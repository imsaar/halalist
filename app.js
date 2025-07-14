class IngredientScanner {
    constructor() {
        // Define default lists first
        this.defaultSuspicious = [
            'butter cream',
            'mono and diglycerides',
            'emulsifiers',
            'enzymes',
            'rennet',
            'whey',
            'casein',
            'l-cysteine',
            'glycerin',
            'glycerol',
            'stearic acid',
            'magnesium stearate',
            'carmine',
            'cochineal',
            'shellac',
            'confectioner\'s glaze',
            'high fructose corn syrup',
            'msg',
            'monosodium glutamate',
            'aspartame',
            'sucralose',
            'artificial colors',
            'red 40',
            'yellow 5',
            'blue 1',
            'sodium nitrite',
            'bha',
            'bht',
            'propylene glycol',
            'carrageenan'
        ];
        
        this.defaultProhibited = [
            'pork',
            'bacon',
            'ham',
            'lard',
            'gelatin',
            'pork gelatin',
            'beef gelatin',
            'alcohol',
            'ethanol',
            'ethyl alcohol',
            'wine',
            'beer',
            'rum',
            'bourbon',
            'vodka',
            'whiskey',
            'cooking wine',
            'rice wine',
            'mirin',
            'vanilla extract',
            'grape juice from concentrate',
            'pepsin',
            'pancreatin',
            'animal shortening',
            'animal fat',
            'tallow',
            'suet'
        ];
        
        // Load from localStorage or use defaults
        const storedSuspicious = this.loadFromStorage('suspiciousIngredients');
        const storedProhibited = this.loadFromStorage('prohibitedIngredients');
        
        // If localStorage exists, use it; otherwise use defaults
        this.suspiciousIngredients = storedSuspicious ? [...storedSuspicious] : [...this.defaultSuspicious];
        this.prohibitedIngredients = storedProhibited ? [...storedProhibited] : [...this.defaultProhibited];
        
        // Save defaults to localStorage if this is first time
        if (!storedSuspicious) {
            this.saveToStorage('suspiciousIngredients', this.suspiciousIngredients);
        }
        if (!storedProhibited) {
            this.saveToStorage('prohibitedIngredients', this.prohibitedIngredients);
        }
        
        this.initializeElements();
        this.attachEventListeners();
        this.renderIngredientLists();
    }
    
    initializeElements() {
        this.imageInput = document.getElementById('imageInput');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.imagePreview = document.getElementById('imagePreview');
        this.previewImg = document.getElementById('previewImg');
        this.closePreview = document.getElementById('closePreview');
        this.scanResults = document.getElementById('scanResults');
        this.extractedText = document.getElementById('extractedText');
        this.detectedIngredients = document.getElementById('detectedIngredients');
        this.loading = document.getElementById('loading');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsModal = document.getElementById('settingsModal');
        this.closeSettings = document.getElementById('closeSettings');
        this.suspiciousList = document.getElementById('suspiciousList');
        this.prohibitedList = document.getElementById('prohibitedList');
        this.suspiciousInput = document.getElementById('suspiciousInput');
        this.prohibitedInput = document.getElementById('prohibitedInput');
        this.addSuspicious = document.getElementById('addSuspicious');
        this.addProhibited = document.getElementById('addProhibited');
        this.showProcessed = document.getElementById('showProcessed');
        this.rescanBtn = document.getElementById('rescanBtn');
        this.cropCanvas = document.getElementById('cropCanvas');
        this.cropBtn = document.getElementById('cropBtn');
        this.scanCropBtn = document.getElementById('scanCropBtn');
        this.resetCropBtn = document.getElementById('resetCropBtn');
        this.processedToggle = document.getElementById('processedToggle');
        this.processingModeText = document.getElementById('processingMode');
        this.resetDefaultsBtn = document.getElementById('resetDefaults');
        this.instructions = document.getElementById('instructions');
        this.originalImage = null;
        this.processedImage = null;
        this.croppedOriginal = null;
        this.processingMode = 0;
        this.cropArea = null;
        this.isSelecting = false;
        this.startX = 0;
        this.startY = 0;
    }
    
    attachEventListeners() {
        this.uploadBtn.addEventListener('click', () => this.imageInput.click());
        this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        this.closePreview.addEventListener('click', () => this.clearResults());
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.closeSettings.addEventListener('click', () => this.closeSettingsModal());
        this.addSuspicious.addEventListener('click', () => this.addIngredient('suspicious'));
        this.addProhibited.addEventListener('click', () => this.addIngredient('prohibited'));
        
        this.suspiciousInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addIngredient('suspicious');
        });
        
        this.prohibitedInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addIngredient('prohibited');
        });
        
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) this.closeSettingsModal();
        });
        
        this.showProcessed.addEventListener('change', (e) => {
            if (this.cropArea && this.croppedOriginal) {
                this.previewImg.src = e.target.checked ? this.processedImage : this.croppedOriginal;
            } else if (this.processedImage) {
                this.previewImg.src = e.target.checked ? this.processedImage : this.originalImage;
            }
        });
        
        this.rescanBtn.addEventListener('click', () => this.rescanWithDifferentMode());
        
        this.cropBtn.addEventListener('click', () => this.startCropSelection());
        this.scanCropBtn.addEventListener('click', () => this.scanCroppedArea());
        this.resetCropBtn.addEventListener('click', () => this.resetCrop());
        this.resetDefaultsBtn.addEventListener('click', () => this.resetToDefaults());
        
        this.cropCanvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.cropCanvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.cropCanvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        
        this.cropCanvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.cropCanvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.cropCanvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
    }
    
    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Verify it's an image
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        
        // Reset everything to initial state
        this.processedImage = null;
        this.croppedOriginal = null;
        this.processingMode = 0;
        this.cropArea = null;
        this.showProcessed.checked = false;
        this.processedToggle.classList.add('hidden');
        
        // Create object URL for the image
        const imageUrl = URL.createObjectURL(file);
        
        // Load image to get dimensions
        const img = new Image();
        img.onload = async () => {
            console.log('Image loaded:', img.width, 'x', img.height);
            
            // Display the image
            this.previewImg.src = imageUrl;
            this.imagePreview.classList.remove('hidden');
            this.scanResults.classList.add('hidden');
            this.instructions.classList.remove('hidden');
            
            // Convert to data URL for processing later
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            this.originalImage = canvas.toDataURL('image/jpeg', 0.95);
            
            // Set up crop canvas after image displays
            setTimeout(() => {
                const rect = this.previewImg.getBoundingClientRect();
                this.cropCanvas.width = rect.width;
                this.cropCanvas.height = rect.height;
                
                // Clear canvas
                const cropCtx = this.cropCanvas.getContext('2d');
                cropCtx.clearRect(0, 0, this.cropCanvas.width, this.cropCanvas.height);
            }, 100);
        };
        
        img.onerror = () => {
            alert('Failed to load image. Please try another image.');
            URL.revokeObjectURL(imageUrl);
        };
        
        img.src = imageUrl;
    }
    
    async preprocessImage(imageData) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Different processing modes
                switch(this.processingMode) {
                    case 0: // Mild enhancement - best for most cases
                        canvas.width = img.width * 2;
                        canvas.height = img.height * 2;
                        ctx.filter = 'contrast(1.3) brightness(1.1) saturate(0)';
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        break;
                        
                    case 1: // Sharpen filter
                        canvas.width = img.width * 2;
                        canvas.height = img.height * 2;
                        // First draw normally
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        // Apply sharpening
                        ctx.filter = 'contrast(1.4) brightness(1.1)';
                        ctx.globalCompositeOperation = 'overlay';
                        ctx.drawImage(canvas, 0, 0);
                        ctx.globalCompositeOperation = 'source-over';
                        break;
                        
                    case 2: // Adaptive threshold
                        canvas.width = img.width * 2;
                        canvas.height = img.height * 2;
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const data = imageData.data;
                        
                        // Convert to grayscale with adaptive threshold
                        for (let i = 0; i < data.length; i += 4) {
                            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                            // Adaptive threshold - keep more midtones
                            let value;
                            if (gray < 100) {
                                value = 0;
                            } else if (gray > 200) {
                                value = 255;
                            } else {
                                // Enhance contrast in midtones
                                value = ((gray - 100) / 100) * 255;
                            }
                            data[i] = data[i + 1] = data[i + 2] = value;
                        }
                        
                        ctx.putImageData(imageData, 0, 0);
                        break;
                        
                    case 3: // Original high resolution
                        canvas.width = img.width * 2;
                        canvas.height = img.height * 2;
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        break;
                }
                
                resolve(canvas.toDataURL());
            };
            img.src = imageData;
        });
    }
    
    async extractTextFromImage(imageData) {
        // Initialize worker
        const worker = await Tesseract.createWorker('eng');
        
        try {
            // Recognize with better parameters
            const { data: { text } } = await worker.recognize(imageData, {
                tessedit_pageseg_mode: '6', // Uniform block of text
                preserve_interword_spaces: '1',
                tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789,.;:()%- ',
            });
            
            return text;
        } finally {
            await worker.terminate();
        }
    }
    
    processExtractedText(text) {
        this.extractedText.textContent = text || 'No text detected';
        
        const detectedSuspicious = [];
        const detectedProhibited = [];
        
        const lowerText = text.toLowerCase();
        
        this.suspiciousIngredients.forEach(ingredient => {
            if (lowerText.includes(ingredient.toLowerCase())) {
                detectedSuspicious.push(ingredient);
            }
        });
        
        this.prohibitedIngredients.forEach(ingredient => {
            if (lowerText.includes(ingredient.toLowerCase())) {
                detectedProhibited.push(ingredient);
            }
        });
        
        this.displayDetectedIngredients(detectedSuspicious, detectedProhibited);
        this.scanResults.classList.remove('hidden');
    }
    
    displayDetectedIngredients(suspicious, prohibited) {
        this.detectedIngredients.innerHTML = '';
        
        if (suspicious.length === 0 && prohibited.length === 0) {
            this.detectedIngredients.innerHTML = '<p style="color: green;">✓ No suspicious or prohibited ingredients detected!</p>';
            return;
        }
        
        prohibited.forEach(ingredient => {
            const alert = document.createElement('div');
            alert.className = 'ingredient-alert prohibited';
            alert.innerHTML = `⚠️ <strong>Prohibited:</strong> ${ingredient}`;
            this.detectedIngredients.appendChild(alert);
        });
        
        suspicious.forEach(ingredient => {
            const alert = document.createElement('div');
            alert.className = 'ingredient-alert suspicious';
            alert.innerHTML = `⚡ <strong>Suspicious:</strong> ${ingredient}`;
            this.detectedIngredients.appendChild(alert);
        });
    }
    
    startCropSelection() {
        this.cropCanvas.classList.add('active');
        this.cropBtn.classList.add('hidden');
        this.scanCropBtn.classList.remove('hidden');
        this.resetCropBtn.classList.remove('hidden');
        this.cropArea = null;
        const ctx = this.cropCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.cropCanvas.width, this.cropCanvas.height);
    }
    
    onMouseDown(e) {
        if (!this.cropCanvas.classList.contains('active')) return;
        this.isSelecting = true;
        const rect = this.cropCanvas.getBoundingClientRect();
        this.startX = e.clientX - rect.left;
        this.startY = e.clientY - rect.top;
    }
    
    onMouseMove(e) {
        if (!this.isSelecting) return;
        const rect = this.cropCanvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        this.drawSelection(this.startX, this.startY, currentX, currentY);
    }
    
    onMouseUp(e) {
        if (!this.isSelecting) return;
        this.isSelecting = false;
        const rect = this.cropCanvas.getBoundingClientRect();
        const endX = e.clientX - rect.left;
        const endY = e.clientY - rect.top;
        
        this.cropArea = {
            x: Math.min(this.startX, endX),
            y: Math.min(this.startY, endY),
            width: Math.abs(endX - this.startX),
            height: Math.abs(endY - this.startY)
        };
    }
    
    onTouchStart(e) {
        if (!this.cropCanvas.classList.contains('active')) return;
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.onMouseDown(mouseEvent);
    }
    
    onTouchMove(e) {
        if (!this.isSelecting) return;
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.onMouseMove(mouseEvent);
    }
    
    onTouchEnd(e) {
        if (!this.isSelecting) return;
        e.preventDefault();
        const touch = e.changedTouches[0];
        const mouseEvent = new MouseEvent('mouseup', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.onMouseUp(mouseEvent);
    }
    
    drawSelection(startX, startY, endX, endY) {
        const ctx = this.cropCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.cropCanvas.width, this.cropCanvas.height);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, this.cropCanvas.width, this.cropCanvas.height);
        
        const x = Math.min(startX, endX);
        const y = Math.min(startY, endY);
        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);
        
        ctx.clearRect(x, y, width, height);
        
        ctx.strokeStyle = '#01411C';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
    }
    
    async scanCroppedArea() {
        if (!this.cropArea || this.cropArea.width < 10 || this.cropArea.height < 10) {
            alert('Please select a valid area to scan');
            return;
        }
        
        this.loading.classList.remove('hidden');
        this.processedToggle.classList.remove('hidden');
        
        try {
            // First crop the original image
            const croppedImage = await this.cropImage(this.originalImage, this.cropArea);
            
            // Store the cropped original
            this.croppedOriginal = croppedImage;
            
            // Apply preprocessing to the cropped image
            this.processedImage = await this.preprocessImage(croppedImage);
            
            // Show processed or original based on checkbox
            if (this.showProcessed.checked) {
                this.previewImg.src = this.processedImage;
            } else {
                this.previewImg.src = this.croppedOriginal;
            }
            
            // Hide the crop canvas after cropping
            this.cropCanvas.classList.remove('active');
            const ctx = this.cropCanvas.getContext('2d');
            ctx.clearRect(0, 0, this.cropCanvas.width, this.cropCanvas.height);
            
            const text = await this.extractTextFromImage(this.processedImage);
            this.processExtractedText(text);
            this.scanResults.classList.remove('hidden');
            
            // Hide instructions when showing results
            this.instructions.classList.add('hidden');
        } catch (error) {
            console.error('Error processing image:', error);
            alert('Error processing image. Please try again.');
        } finally {
            this.loading.classList.add('hidden');
        }
    }
    
    async cropImage(imageData, cropArea) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const scaleX = img.width / this.cropCanvas.width;
                const scaleY = img.height / this.cropCanvas.height;
                
                canvas.width = cropArea.width * scaleX;
                canvas.height = cropArea.height * scaleY;
                
                ctx.drawImage(
                    img,
                    cropArea.x * scaleX,
                    cropArea.y * scaleY,
                    cropArea.width * scaleX,
                    cropArea.height * scaleY,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );
                
                resolve(canvas.toDataURL());
            };
            img.src = imageData;
        });
    }
    
    resetCrop() {
        this.cropCanvas.classList.remove('active');
        this.cropBtn.classList.remove('hidden');
        this.scanCropBtn.classList.add('hidden');
        this.resetCropBtn.classList.add('hidden');
        this.processedToggle.classList.add('hidden');
        const ctx = this.cropCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.cropCanvas.width, this.cropCanvas.height);
        this.cropArea = null;
        this.previewImg.src = this.originalImage;
        this.showProcessed.checked = true;
        
        // Show instructions again when resetting
        if (this.originalImage) {
            this.instructions.classList.remove('hidden');
        }
    }
    
    clearResults() {
        this.imagePreview.classList.add('hidden');
        this.scanResults.classList.add('hidden');
        this.instructions.classList.add('hidden');
        this.imageInput.value = '';
        this.originalImage = null;
        this.processedImage = null;
        this.croppedOriginal = null;
        this.showProcessed.checked = true;
        this.processingMode = 0;
        this.cropArea = null;
        this.resetCrop();
    }
    
    async rescanWithDifferentMode() {
        this.processingMode = (this.processingMode + 1) % 4;
        this.loading.classList.remove('hidden');
        
        // Update mode text
        const modes = ['Mild Enhancement', 'Sharpen Filter', 'Adaptive Threshold', 'High Resolution Original'];
        this.processingModeText.textContent = `Mode: ${modes[this.processingMode]}`;
        
        try {
            // Use cropped image if available, otherwise use original
            const sourceImage = this.croppedOriginal || this.originalImage;
            this.processedImage = await this.preprocessImage(sourceImage);
            
            if (this.showProcessed.checked) {
                this.previewImg.src = this.processedImage;
            }
            
            const text = await this.extractTextFromImage(this.processedImage);
            this.processExtractedText(text);
        } catch (error) {
            console.error('Error processing image:', error);
            alert('Error processing image. Please try again.');
        } finally {
            this.loading.classList.add('hidden');
        }
    }
    
    openSettings() {
        this.settingsModal.classList.remove('hidden');
        this.renderIngredientLists();
    }
    
    closeSettingsModal() {
        this.settingsModal.classList.add('hidden');
    }
    
    renderIngredientLists() {
        this.suspiciousList.innerHTML = '';
        this.prohibitedList.innerHTML = '';
        
        this.suspiciousIngredients.forEach((ingredient, index) => {
            const item = this.createIngredientItem(ingredient, index, 'suspicious');
            this.suspiciousList.appendChild(item);
        });
        
        this.prohibitedIngredients.forEach((ingredient, index) => {
            const item = this.createIngredientItem(ingredient, index, 'prohibited');
            this.prohibitedList.appendChild(item);
        });
    }
    
    createIngredientItem(ingredient, index, type) {
        const item = document.createElement('div');
        item.className = `ingredient-item ${type === 'prohibited' ? 'prohibited' : ''}`;
        item.innerHTML = `
            ${ingredient}
            <button onclick="scanner.removeIngredient(${index}, '${type}')">×</button>
        `;
        return item;
    }
    
    addIngredient(type) {
        const input = type === 'suspicious' ? this.suspiciousInput : this.prohibitedInput;
        const value = input.value.trim();
        
        if (!value) return;
        
        if (type === 'suspicious') {
            if (!this.suspiciousIngredients.includes(value.toLowerCase())) {
                this.suspiciousIngredients.push(value.toLowerCase());
                this.saveToStorage('suspiciousIngredients', this.suspiciousIngredients);
            }
        } else {
            if (!this.prohibitedIngredients.includes(value.toLowerCase())) {
                this.prohibitedIngredients.push(value.toLowerCase());
                this.saveToStorage('prohibitedIngredients', this.prohibitedIngredients);
            }
        }
        
        input.value = '';
        this.renderIngredientLists();
    }
    
    removeIngredient(index, type) {
        if (type === 'suspicious') {
            this.suspiciousIngredients.splice(index, 1);
            this.saveToStorage('suspiciousIngredients', this.suspiciousIngredients);
        } else {
            this.prohibitedIngredients.splice(index, 1);
            this.saveToStorage('prohibitedIngredients', this.prohibitedIngredients);
        }
        
        this.renderIngredientLists();
    }
    
    saveToStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }
    
    loadFromStorage(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }
    
    resetToDefaults() {
        if (confirm('Are you sure you want to reset to the default ingredient lists? This will remove all your custom additions.')) {
            this.suspiciousIngredients = [...this.defaultSuspicious];
            this.prohibitedIngredients = [...this.defaultProhibited];
            
            this.saveToStorage('suspiciousIngredients', this.suspiciousIngredients);
            this.saveToStorage('prohibitedIngredients', this.prohibitedIngredients);
            
            this.renderIngredientLists();
            alert('Ingredient lists have been reset to defaults.');
        }
    }
}

const scanner = new IngredientScanner();