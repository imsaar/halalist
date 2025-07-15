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
        this.rescanBtn = document.getElementById('rescanBtn');
        this.cropCanvas = document.getElementById('cropCanvas');
        this.cropBtn = document.getElementById('cropBtn');
        this.scanCropBtn = document.getElementById('scanCropBtn');
        this.resetCropBtn = document.getElementById('resetCropBtn');
        this.processingModeText = document.getElementById('processingMode');
        this.resetDefaultsBtn = document.getElementById('resetDefaults');
        this.instructions = document.getElementById('instructions');
        this.originalImage = null;
        this.processedImage = null;
        this.croppedOriginal = null;
        this.processingMode = 0;
        this.cropArea = null;
        this.isSelecting = false;
        this.isDragging = false;
        this.isResizing = false;
        this.resizeHandle = null;
        this.startX = 0;
        this.startY = 0;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.initialCropArea = null;
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
        
        
        this.rescanBtn.addEventListener('click', () => this.rescanWithDifferentMode());
        
        this.cropBtn.addEventListener('click', () => this.startCropSelection());
        this.scanCropBtn.addEventListener('click', () => this.scanCroppedArea());
        this.resetCropBtn.addEventListener('click', () => this.resetCrop());
        this.resetDefaultsBtn.addEventListener('click', () => this.resetToDefaults());
        
        this.cropCanvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.cropCanvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.cropCanvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        
        this.cropCanvas.addEventListener('touchstart', (e) => this.onTouchStart(e), {passive: false});
        this.cropCanvas.addEventListener('touchmove', (e) => this.onTouchMove(e), {passive: false});
        this.cropCanvas.addEventListener('touchend', (e) => this.onTouchEnd(e), {passive: false});
        this.cropCanvas.addEventListener('touchcancel', (e) => this.onTouchEnd(e), {passive: false});
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
        
        // Normalize text by removing extra spaces and line breaks
        const lowerText = text.toLowerCase().replace(/\s+/g, ' ');
        
        // Debug: Check for vanilla extract specifically
        console.log('Checking for vanilla extract...');
        console.log('Text contains "vanilla":', lowerText.includes('vanilla'));
        console.log('Text contains "extract":', lowerText.includes('extract'));
        
        this.suspiciousIngredients.forEach(ingredient => {
            // Create a flexible pattern that allows for spaces/line breaks
            const pattern = ingredient.toLowerCase().split(' ').join('\\s+');
            const regex = new RegExp(pattern, 'i');
            if (regex.test(text)) {
                detectedSuspicious.push(ingredient);
            }
        });
        
        this.prohibitedIngredients.forEach(ingredient => {
            // Create a flexible pattern that allows for spaces/line breaks
            const pattern = ingredient.toLowerCase().split(' ').join('\\s+');
            const regex = new RegExp(pattern, 'i');
            if (regex.test(text)) {
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
        const rect = this.cropCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if clicking on existing selection for drag/resize
        if (this.cropArea) {
            const handle = this.getResizeHandle(x, y);
            if (handle) {
                this.isResizing = true;
                this.resizeHandle = handle;
                this.initialCropArea = {...this.cropArea};
            } else if (this.isInsideSelection(x, y)) {
                this.isDragging = true;
                this.dragStartX = x - this.cropArea.x;
                this.dragStartY = y - this.cropArea.y;
            } else {
                // Start new selection
                this.isSelecting = true;
                this.startX = x;
                this.startY = y;
                this.cropArea = null;
            }
        } else {
            // Start new selection
            this.isSelecting = true;
            this.startX = x;
            this.startY = y;
        }
    }
    
    onMouseMove(e) {
        const rect = this.cropCanvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        // Update cursor based on position
        if (!this.isSelecting && !this.isDragging && !this.isResizing && this.cropArea) {
            const handle = this.getResizeHandle(currentX, currentY);
            if (handle) {
                this.cropCanvas.style.cursor = this.getCursorForHandle(handle);
            } else if (this.isInsideSelection(currentX, currentY)) {
                this.cropCanvas.style.cursor = 'move';
            } else {
                this.cropCanvas.style.cursor = 'crosshair';
            }
        }
        
        if (this.isSelecting) {
            this.drawSelection(this.startX, this.startY, currentX, currentY);
        } else if (this.isDragging) {
            const newX = Math.max(0, Math.min(currentX - this.dragStartX, this.cropCanvas.width - this.cropArea.width));
            const newY = Math.max(0, Math.min(currentY - this.dragStartY, this.cropCanvas.height - this.cropArea.height));
            this.cropArea.x = newX;
            this.cropArea.y = newY;
            this.redrawSelection();
        } else if (this.isResizing) {
            this.resizeSelection(currentX, currentY);
        }
    }
    
    onMouseUp(e) {
        if (this.isSelecting) {
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
            
            // Redraw to show handles
            this.redrawSelection();
        }
        
        this.isDragging = false;
        this.isResizing = false;
        this.resizeHandle = null;
        this.cropCanvas.style.cursor = 'crosshair';
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
        if (!this.isSelecting && !this.isDragging && !this.isResizing) return;
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.onMouseMove(mouseEvent);
    }
    
    onTouchEnd(e) {
        if (!this.isSelecting && !this.isDragging && !this.isResizing) return;
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
        
        // Draw white border first for better visibility
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, width, height);
        
        // Then draw colored border
        ctx.strokeStyle = '#01411C';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        // Don't draw handles during active selection
        if (!this.isSelecting && width > 0 && height > 0) {
            this.drawResizeHandles(ctx, x, y, width, height);
            
            // Add instruction text for mobile
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            if (isTouchDevice && width > 100 && height > 60) {
                ctx.font = '14px system-ui, -apple-system, sans-serif';
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.fillText('Drag to move • Handles to resize', x + width/2, y + height/2);
            }
        }
    }
    
    redrawSelection() {
        if (!this.cropArea) return;
        this.drawSelection(
            this.cropArea.x,
            this.cropArea.y,
            this.cropArea.x + this.cropArea.width,
            this.cropArea.y + this.cropArea.height
        );
    }
    
    drawResizeHandles(ctx, x, y, width, height) {
        // Detect if touch device
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const handleSize = isTouchDevice ? 16 : 8; // Larger handles for touch
        const handles = [
            {x: x, y: y}, // top-left
            {x: x + width/2, y: y}, // top-center
            {x: x + width, y: y}, // top-right
            {x: x + width, y: y + height/2}, // middle-right
            {x: x + width, y: y + height}, // bottom-right
            {x: x + width/2, y: y + height}, // bottom-center
            {x: x, y: y + height}, // bottom-left
            {x: x, y: y + height/2} // middle-left
        ];
        
        handles.forEach(handle => {
            // White background for better visibility
            ctx.fillStyle = 'white';
            ctx.fillRect(
                handle.x - handleSize/2 - 1,
                handle.y - handleSize/2 - 1,
                handleSize + 2,
                handleSize + 2
            );
            
            // Handle with border
            ctx.fillStyle = '#01411C';
            ctx.fillRect(
                handle.x - handleSize/2,
                handle.y - handleSize/2,
                handleSize,
                handleSize
            );
        });
    }
    
    getResizeHandle(x, y) {
        if (!this.cropArea) return null;
        
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const handleSize = isTouchDevice ? 24 : 12; // Much larger hit area for touch
        const half = handleSize / 2;
        const {x: sx, y: sy, width, height} = this.cropArea;
        
        const handles = [
            {name: 'nw', x: sx, y: sy},
            {name: 'n', x: sx + width/2, y: sy},
            {name: 'ne', x: sx + width, y: sy},
            {name: 'e', x: sx + width, y: sy + height/2},
            {name: 'se', x: sx + width, y: sy + height},
            {name: 's', x: sx + width/2, y: sy + height},
            {name: 'sw', x: sx, y: sy + height},
            {name: 'w', x: sx, y: sy + height/2}
        ];
        
        for (const handle of handles) {
            if (x >= handle.x - half && x <= handle.x + half &&
                y >= handle.y - half && y <= handle.y + half) {
                return handle.name;
            }
        }
        
        return null;
    }
    
    getCursorForHandle(handle) {
        const cursors = {
            'nw': 'nw-resize',
            'n': 'n-resize',
            'ne': 'ne-resize',
            'e': 'e-resize',
            'se': 'se-resize',
            's': 's-resize',
            'sw': 'sw-resize',
            'w': 'w-resize'
        };
        return cursors[handle] || 'default';
    }
    
    isInsideSelection(x, y) {
        if (!this.cropArea) return false;
        return x >= this.cropArea.x &&
               x <= this.cropArea.x + this.cropArea.width &&
               y >= this.cropArea.y &&
               y <= this.cropArea.y + this.cropArea.height;
    }
    
    resizeSelection(currentX, currentY) {
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const minSize = isTouchDevice ? 40 : 20; // Larger minimum size for touch
        let {x, y, width, height} = this.initialCropArea;
        
        switch (this.resizeHandle) {
            case 'nw':
                width = Math.max(minSize, x + width - currentX);
                height = Math.max(minSize, y + height - currentY);
                x = Math.min(currentX, x + this.initialCropArea.width - minSize);
                y = Math.min(currentY, y + this.initialCropArea.height - minSize);
                break;
            case 'n':
                height = Math.max(minSize, y + height - currentY);
                y = Math.min(currentY, y + this.initialCropArea.height - minSize);
                break;
            case 'ne':
                width = Math.max(minSize, currentX - x);
                height = Math.max(minSize, y + height - currentY);
                y = Math.min(currentY, y + this.initialCropArea.height - minSize);
                break;
            case 'e':
                width = Math.max(minSize, currentX - x);
                break;
            case 'se':
                width = Math.max(minSize, currentX - x);
                height = Math.max(minSize, currentY - y);
                break;
            case 's':
                height = Math.max(minSize, currentY - y);
                break;
            case 'sw':
                width = Math.max(minSize, x + width - currentX);
                height = Math.max(minSize, currentY - y);
                x = Math.min(currentX, x + this.initialCropArea.width - minSize);
                break;
            case 'w':
                width = Math.max(minSize, x + width - currentX);
                x = Math.min(currentX, x + this.initialCropArea.width - minSize);
                break;
        }
        
        // Keep within canvas bounds
        x = Math.max(0, x);
        y = Math.max(0, y);
        width = Math.min(width, this.cropCanvas.width - x);
        height = Math.min(height, this.cropCanvas.height - y);
        
        this.cropArea = {x, y, width, height};
        this.redrawSelection();
    }
    
    async scanCroppedArea() {
        if (!this.cropArea || this.cropArea.width < 10 || this.cropArea.height < 10) {
            alert('Please select a valid area to scan');
            return;
        }
        
        this.loading.classList.remove('hidden');
        
        try {
            // First crop the original image
            const croppedImage = await this.cropImage(this.originalImage, this.cropArea);
            
            // Store the cropped original
            this.croppedOriginal = croppedImage;
            
            // Apply preprocessing to the cropped image
            this.processedImage = await this.preprocessImage(croppedImage);
            
            // Always show processed image
            this.previewImg.src = this.processedImage;
            
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
        const ctx = this.cropCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.cropCanvas.width, this.cropCanvas.height);
        this.cropArea = null;
        this.previewImg.src = this.originalImage;
        
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
            
            this.previewImg.src = this.processedImage;
            
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
            // Delete localStorage entries
            localStorage.removeItem('suspiciousIngredients');
            localStorage.removeItem('prohibitedIngredients');
            
            // Reset to defaults
            this.suspiciousIngredients = [...this.defaultSuspicious];
            this.prohibitedIngredients = [...this.defaultProhibited];
            
            this.renderIngredientLists();
            alert('Ingredient lists have been reset to defaults.');
        }
    }
}

const scanner = new IngredientScanner();