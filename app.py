import os
import tensorflow as tf
from flask import Flask, request, jsonify, render_template
import numpy as np
import base64
import io
from PIL import Image
import gc
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Enable mixed precision for faster inference
tf.keras.mixed_precision.set_global_policy('mixed_float16')

app = Flask(__name__)

# Constants
IMG_SIZE = 224
BATCH_SIZE = 1

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Create uploads folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load the model with optimizations
model_path = 'model/efficientnetb0_feature_extract_model_mixed_precision_fine_tuned.keras'
logger.info(f"Current working directory: {os.getcwd()}")
logger.info(f"Attempting to load model from: {os.path.abspath(model_path)}")

try:
    # Load model with optimizations
    model = tf.keras.models.load_model(model_path)
    
    # Optimize model for inference
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy'],
        jit_compile=True  # Enable XLA compilation
    )
    
    # Create a prediction function that uses tf.function for faster execution
    @tf.function
    def predict_batch(images):
        return model(images, training=False)
    
    logger.info("Model loaded and optimized successfully")
except Exception as e:
    logger.error(f"Error loading model: {str(e)}")
    logger.error(f"Full error details: {repr(e)}")
    raise

# Food class names (you may need to adjust these based on your model's classes)
FOOD_CLASSES = ['apple_pie',
 'baby_back_ribs',
 'baklava',
 'beef_carpaccio',
 'beef_tartare',
 'beet_salad',
 'beignets',
 'bibimbap',
 'bread_pudding',
 'breakfast_burrito',
 'bruschetta',
 'caesar_salad',
 'cannoli',
 'caprese_salad',
 'carrot_cake',
 'ceviche',
 'cheesecake',
 'cheese_plate',
 'chicken_curry',
 'chicken_quesadilla',
 'chicken_wings',
 'chocolate_cake',
 'chocolate_mousse',
 'churros',
 'clam_chowder',
 'club_sandwich',
 'crab_cakes',
 'creme_brulee',
 'croque_madame',
 'cup_cakes',
 'deviled_eggs',
 'donuts',
 'dumplings',
 'edamame',
 'eggs_benedict',
 'escargots',
 'falafel',
 'filet_mignon',
 'fish_and_chips',
 'foie_gras',
 'french_fries',
 'french_onion_soup',
 'french_toast',
 'fried_calamari',
 'fried_rice',
 'frozen_yogurt',
 'garlic_bread',
 'gnocchi',
 'greek_salad',
 'grilled_cheese_sandwich',
 'grilled_salmon',
 'guacamole',
 'gyoza',
 'hamburger',
 'hot_and_sour_soup',
 'hot_dog',
 'huevos_rancheros',
 'hummus',
 'ice_cream',
 'lasagna',
 'lobster_bisque',
 'lobster_roll_sandwich',
 'macaroni_and_cheese',
 'macarons',
 'miso_soup',
 'mussels',
 'nachos',
 'omelette',
 'onion_rings',
 'oysters',
 'pad_thai',
 'paella',
 'pancakes',
 'panna_cotta',
 'peking_duck',
 'pho',
 'pizza',
 'pork_chop',
 'poutine',
 'prime_rib',
 'pulled_pork_sandwich',
 'ramen',
 'ravioli',
 'red_velvet_cake',
 'risotto',
 'samosa',
 'sashimi',
 'scallops',
 'seaweed_salad',
 'shrimp_and_grits',
 'spaghetti_bolognese',
 'spaghetti_carbonara',
 'spring_rolls',
 'steak',
 'strawberry_shortcake',
 'sushi',
 'tacos',
 'takoyaki',
 'tiramisu',
 'tuna_tartare',
 'waffles']

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def load_and_prep_image(image, img_shape=224, scale=False):
    """
    Process image to match the notebook's approach
    """
    # Convert PIL image to tensor and optimize preprocessing
    img = tf.keras.preprocessing.image.img_to_array(image)
    img = tf.image.resize(img, size=[img_shape, img_shape])
    img = tf.cast(img, tf.float32)  # Ensure correct dtype
    return img

def predict_food(image):
    """
    Make prediction using the model
    """
    try:
        logger.info("Starting prediction process")
        # Process image without scaling (as per notebook)
        img = load_and_prep_image(image, scale=False)
        logger.info("Image preprocessed successfully")
        
        # Add batch dimension
        img = tf.expand_dims(img, axis=0)
        
        # Make prediction using the optimized function
        logger.info("Making prediction")
        pred_prob = predict_batch(img)
        
        # Get the predicted class and confidence
        pred_prob = pred_prob.numpy()  # Convert to numpy for faster processing
        pred_class_idx = pred_prob.argmax()
        pred_class = FOOD_CLASSES[pred_class_idx]
        confidence = float(pred_prob.max())
        
        # Log prediction details
        logger.info(f"Prediction: {pred_class}")
        logger.info(f"Confidence: {confidence:.2f}")
        
        # Clear memory
        del img
        gc.collect()
        
        return pred_class, confidence
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        raise

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        if 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400

        # Remove the data:image/jpeg;base64 prefix if present
        image_data = data['image']
        if ',' in image_data:
            image_data = image_data.split(',')[1]

        try:
            # Decode base64 image
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
        except Exception as e:
            return jsonify({'error': f'Invalid image data: {str(e)}'}), 400
        
        try:
            food_class, confidence = predict_food(image)
            
            # Clear memory
            del image
            del image_bytes
            gc.collect()
            
            return jsonify({
                'prediction': food_class,
                'confidence': confidence
            })
        except Exception as e:
            return jsonify({'error': f'Prediction failed: {str(e)}'}), 500
            
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
