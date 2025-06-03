# 🍽️ FoodVision 101 - Beating Benchmark Accuracy with EfficientNet

A high-performance food image classification model that surpasses official benchmark accuracy on the Food101 dataset. Built with TensorFlow and EfficientNetB0, this project demonstrates advanced deep learning techniques and optimization strategies.

## 🎯 Project Highlights

- **Dataset**: Food101 (101,000 images across 101 categories)
- **Model**: Transfer learning with EfficientNetB0
- **Performance**: Surpassed official benchmark accuracy
- **Optimization**: Mixed precision training for efficiency
- **Advanced Callbacks**:
  - TensorBoard for visualization
  - ModelCheckpoint for best model saving
  - EarlyStopping to prevent overfitting
  - ReduceLROnPlateau for dynamic learning rate adjustment

## 🛠️ Technical Implementation

### Core Technologies

- **Deep Learning Framework**: TensorFlow
- **Model Architecture**: EfficientNetB0
- **Data Pipeline**: TensorFlow Datasets (TFDS)
- **Training Optimization**: Mixed precision (float16)
- **Visualization**: TensorBoard

### Key Features

- **Optimized Data Pipeline**:
  - Custom tf.data input pipelines
  - Shuffle, batch, and prefetch operations
  - AUTOTUNE for optimal performance
- **Advanced Training Techniques**:
  - Transfer learning with fine-tuning
  - Mixed precision training
  - Dynamic learning rate adjustment
- **Comprehensive Evaluation**:
  - F1-score calculation
  - Accuracy metrics
  - Class-wise performance breakdown
  - Confusion matrix analysis

## 🚀 Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/anandvelpuri/FoodVision.git
   cd FoodVision
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Run the application:

   ```bash
   python app.py
   ```

4. Access the web interface at `http://localhost:5000`

## 📊 Model Performance

The model achieves superior performance through:

- Efficient transfer learning with EfficientNetB0
- Optimized data pipeline implementation
- Advanced callback integration
- Mixed precision training
- Dynamic learning rate adjustment

## 🧠 Main Concepts Demonstrated

- TensorFlow Datasets (TFDS) integration
- EfficientNetB0 transfer learning & fine-tuning
- Mixed precision training (float16 policy)
- Input pipeline optimization
- Advanced callback implementation
- Training visualization
- Model performance analysis

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Author

- **Anand Velpuri** - Initial work and development

## 🙏 Acknowledgments

- Food101 dataset
- TensorFlow team
- EfficientNet authors
- All contributors and supporters

## 📊 Model Performance Metrics

### Training Results (Epoch 11/100)

- **Training Accuracy**: 98.66%
- **Training Loss**: 0.0713
- **Validation Accuracy**: 84.19%
- **Validation Loss**: 0.6091
- **Learning Rate**: 4.0e-06

These metrics demonstrate exceptional model performance, with:

- Near-perfect training accuracy (98.66%)
- Strong validation accuracy (84.19%)
- Low training loss (0.0713)
- Stable learning rate adaptation

---

Made by Anand Velpuri
