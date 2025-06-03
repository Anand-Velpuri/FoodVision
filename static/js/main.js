document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseButton = document.getElementById('browse-button');
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const loadingOverlay = document.getElementById('loading-overlay');
    const resultContainer = document.getElementById('result-container');
    const predictionText = document.getElementById('prediction-text');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const historyList = document.getElementById('history-list');
    const clearHistoryButton = document.getElementById('clear-history');
    const confirmationPopup = document.getElementById('confirmation-popup');
    const confirmationMessage = document.getElementById('confirmation-message');
    const confirmActionButton = document.getElementById('confirm-action');
    const cancelConfirmationButton = document.getElementById('cancel-confirmation');
    const uploadProgressBar = document.getElementById('upload-progress-bar');
    const uploadProgressText = document.getElementById('upload-progress-text');

    // IndexedDB setup
    const dbName = 'FoodVisionDB';
    const dbVersion = 1;
    let db;

    const request = indexedDB.open(dbName, dbVersion);

    request.onerror = (event) => {
        console.error('Database error:', event.target.error);
        showToast('Error accessing local storage');
    };

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        if (!db.objectStoreNames.contains('predictions')) {
            db.createObjectStore('predictions', { keyPath: 'id', autoIncrement: true });
        }
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        loadHistory();
    };

    // Load prediction history
    function loadHistory() {
        const transaction = db.transaction(['predictions'], 'readonly');
        const store = transaction.objectStore('predictions');
        const request = store.getAll();

        request.onsuccess = () => {
            historyList.innerHTML = '';
            request.result.reverse().forEach(item => {
                addHistoryItem(item);
            });
        };
    }

    // Add item to history
    function addHistoryItem(item) {
        const div = document.createElement('div');
        div.className = 'history-item bg-white rounded-lg shadow p-4 flex items-center justify-between transform scale-95 opacity-0';
        div.setAttribute('data-id', item.id);
        div.innerHTML = `
            <div class="flex items-center space-x-4">
                <img src="${item.imagePath}" alt="${item.prediction}" class="w-16 h-16 object-cover rounded">
                <div>
                    <p class="font-semibold text-gray-800">${item.prediction}</p>
                    <p class="text-sm text-gray-500">${new Date(item.timestamp).toLocaleString()}</p>
                </div>
            </div>
            <button class="delete-item px-3 py-1 text-red-500 hover:text-red-700 transition-colors duration-300 relative z-30">
                Delete
            </button>
        `;

        div.querySelector('.delete-item').addEventListener('click', (e) => {
            e.stopPropagation();
            showConfirmation('Are you sure you want to delete this prediction?', () => {
                deleteHistoryItem(item.id);
            });
        });

        historyList.insertBefore(div, historyList.firstChild);
        
        // Animate the new item
        gsap.to(div, {
            scale: 1,
            opacity: 1,
            duration: 0.3,
            ease: "back.out(1.7)"
        });
    }

    // Delete history item
    function deleteHistoryItem(id) {
        const item = document.querySelector(`[data-id="${id}"]`);
        if (item) {
            gsap.to(item, {
                scale: 0.8,
                opacity: 0,
                duration: 0.3,
                ease: "back.in(1.7)",
                onComplete: () => {
                    const transaction = db.transaction(['predictions'], 'readwrite');
                    const store = transaction.objectStore('predictions');
                    const request = store.delete(id);

                    request.onsuccess = () => {
                        item.remove();
                        showToast('Prediction deleted');
                    };

                    request.onerror = () => {
                        showToast('Error deleting prediction');
                        gsap.to(item, {
                            scale: 1,
                            opacity: 1,
                            duration: 0.3,
                            ease: "back.out(1.7)"
                        });
                    };
                }
            });
        }
    }

    // Clear all history
    function clearAllHistory() {
        const items = document.querySelectorAll('.history-item');
        
        gsap.to(items, {
            scale: 0.8,
            opacity: 0,
            duration: 0.3,
            stagger: 0.05,
            ease: "back.in(1.7)",
            onComplete: () => {
                const transaction = db.transaction(['predictions'], 'readwrite');
                const store = transaction.objectStore('predictions');
                const request = store.clear();

                request.onsuccess = () => {
                    historyList.innerHTML = '';
                    showToast('All predictions cleared');
                };

                request.onerror = () => {
                    showToast('Error clearing predictions');
                    gsap.to(items, {
                        scale: 1,
                        opacity: 1,
                        duration: 0.3,
                        stagger: 0.05,
                        ease: "back.out(1.7)"
                    });
                };
            }
        });
    }

    // Confirmation popup
    function showConfirmation(message, callback) {
        confirmationMessage.textContent = message;
        confirmationPopup.classList.remove('hidden');
        confirmationPopup.classList.add('show');

        const handleConfirm = () => {
            hideConfirmation();
            callback();
        };

        const handleCancel = () => {
            hideConfirmation();
        };

        confirmActionButton.onclick = handleConfirm;
        cancelConfirmationButton.onclick = handleCancel;
    }

    function hideConfirmation() {
        confirmationPopup.classList.remove('show');
        setTimeout(() => {
            confirmationPopup.classList.add('hidden');
        }, 300);
    }

    // Handle drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('dragover');
    }

    function unhighlight(e) {
        dropZone.classList.remove('dragover');
    }

    // Handle file drop
    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            const file = files[0];
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            
            if (!allowedTypes.includes(file.type)) {
                e.preventDefault();
                showWarning(`Unsupported file type. Please upload a JPG, JPEG, or PNG image.`);
                return;
            }
        }
        
        handleFiles(files);
    }

    // Handle file input change
    fileInput.addEventListener('change', function() {
        const files = this.files;
        if (files.length > 0) {
            const file = files[0];
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            
            if (!allowedTypes.includes(file.type)) {
                this.value = ''; // Clear the input
                showWarning(`Unsupported file type. Please upload a JPG, JPEG, or PNG image.`);
                return;
            }
        }
        handleFiles(files);
    });

    // Handle browse button click
    browseButton.addEventListener('click', () => {
        fileInput.click();
    });

    // Handle clear history button click
    clearHistoryButton.addEventListener('click', () => {
        showConfirmation('Are you sure you want to clear all predictions?', clearAllHistory);
    });

    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            
            if (allowedTypes.includes(file.type)) {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onloadend = function() {
                    const dataUrl = reader.result;
                    imagePreview.src = dataUrl;
                    previewContainer.classList.remove('hidden');
                    resultContainer.classList.add('hidden');
                    // Hide any existing warning
                    hideWarning();
                    // Store in IndexedDB immediately
                    storeImageInIndexedDB(dataUrl);
                    // Send for prediction
                    uploadDataUrl(dataUrl);
                };
            } else {
                showWarning(`Unsupported file type. Please upload a JPG, JPEG, or PNG image.`);
            }
        }
    }

    function storeImageInIndexedDB(dataUrl) {
        // Save to IndexedDB as a new entry with just the image (prediction will be updated after response)
        const transaction = db.transaction(['predictions'], 'readwrite');
        const store = transaction.objectStore('predictions');
        store.add({
            prediction: 'Pending...',
            imagePath: dataUrl,
            timestamp: new Date().toISOString()
        });
        loadHistory();
    }

    function uploadDataUrl(dataUrl) {
        loadingOverlay.classList.remove('hidden');
        updateProgress(0);
        
        gsap.from(loadingOverlay, {
            opacity: 0,
            duration: 0.3,
            ease: "power2.out"
        });
        
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 90) {
                clearInterval(progressInterval);
            } else {
                updateProgress(progress);
            }
        }, 100);

        fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: dataUrl })
        })
        .then(response => response.json())
        .then(data => {
            clearInterval(progressInterval);
            updateProgress(100);
            
            setTimeout(() => {
                gsap.to(loadingOverlay, {
                    opacity: 0,
                    duration: 0.3,
                    ease: "power2.in",
                    onComplete: () => {
                        loadingOverlay.classList.add('hidden');
                    }
                });

                if (data.error) {
                    showToast(data.error);
                    return;
                }
                
                predictionText.textContent = `${data.prediction} (${(data.confidence * 100).toFixed(1)}% confidence)`;
                resultContainer.classList.remove('hidden');
                
                const resultDiv = resultContainer.querySelector('div');
                gsap.to(resultDiv, {
                    scale: 1,
                    opacity: 1,
                    duration: 0.5,
                    ease: "back.out(1.7)"
                });
                
                updateLatestPrediction(data.prediction, data.confidence);
            }, 500);
        })
        .catch(error => {
            clearInterval(progressInterval);
            loadingOverlay.classList.add('hidden');
            showToast('Error processing image');
            console.error('Error:', error);
        });
    }

    function updateLatestPrediction(prediction, confidence) {
        const transaction = db.transaction(['predictions'], 'readwrite');
        const store = transaction.objectStore('predictions');
        const request = store.openCursor(null, 'prev');

        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                // Update the first (most recent) item
                const data = cursor.value;
                data.prediction = prediction;
                data.confidence = confidence;
                cursor.update(data);
                loadHistory(); // Reload the history to show the updated prediction
            }
        };
    }

    function updateProgress(percent) {
        const roundedPercent = Math.round(percent);
        uploadProgressBar.style.width = `${roundedPercent}%`;
        uploadProgressText.textContent = `${roundedPercent}%`;
        
        // Animate progress bar
        gsap.to(uploadProgressBar, {
            width: `${roundedPercent}%`,
            duration: 0.3,
            ease: "power1.out"
        });
    }

    function showError(message) {
        loadingOverlay.classList.add('hidden');
        showToast(message);
        
        // Reset progress bar
        gsap.to(uploadProgressBar, {
            backgroundColor: '#EF4444', // Red color
            duration: 0.3,
            onComplete: () => {
                setTimeout(() => {
                    updateProgress(0);
                    gsap.to(uploadProgressBar, {
                        backgroundColor: '#F97316', // Orange color
                        duration: 0.3
                    });
                }, 1000);
            }
        });
    }

    function showToast(message) {
        toastMessage.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    function showWarning(message) {
        const warningMessage = document.getElementById('warning-message');
        const warningText = document.getElementById('warning-text');
        const warningContent = warningMessage.querySelector('div');
        
        warningText.textContent = message;
        warningMessage.classList.remove('hidden');
        
        // Animate in
        gsap.to(warningContent, {
            scale: 1,
            opacity: 1,
            duration: 0.3,
            ease: "back.out(1.7)"
        });
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            hideWarning();
        }, 5000);
    }

    function hideWarning() {
        const warningMessage = document.getElementById('warning-message');
        const warningContent = warningMessage.querySelector('div');
        
        // Animate out
        gsap.to(warningContent, {
            scale: 0.95,
            opacity: 0,
            duration: 0.3,
            ease: "back.in(1.7)",
            onComplete: () => {
                warningMessage.classList.add('hidden');
            }
        });
    }
}); 