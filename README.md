# Halalist - Ingredient Scanner

A mobile-friendly web application that helps identify suspicious or prohibited ingredients in food products by scanning ingredient labels using OCR technology. Perfect for dietary restrictions, allergies, and conscious food choices.

## Features

- 📱 **Mobile-Friendly Design** - Optimized for smartphones and tablets
- 📷 **Photo Capture/Upload** - Take photos directly or upload existing images
- ✂️ **Smart Cropping** - Select specific areas of the image for better OCR accuracy
- 🔍 **OCR Text Extraction** - Uses Tesseract.js to extract text from images
- ⚠️ **Ingredient Detection** - Automatically highlights suspicious and prohibited ingredients
- 📝 **Customizable Lists** - Add or remove ingredients from your watch lists
- 💾 **Local Storage** - Your custom ingredient lists are saved locally
- 🎨 **Multiple Processing Modes** - Different image enhancement options for better OCR results
- 🟢 **Green Theme Design** - Features a distinctive green color scheme
- 📖 **Smart Instructions** - Context-aware help that appears when needed

## Quick Start

1. Open `index.html` in a web browser
2. Click "Take or Upload Photo" to capture an ingredient label
3. Click "✂️ Select Area" to crop to just the ingredients section
4. Draw a rectangle around the ingredients text
5. Click "Scan Selected Area" to detect ingredients
6. Review the results - suspicious ingredients appear in yellow, prohibited in red
7. If results aren't clear, use "Try Different Processing" to cycle through enhancement modes

## How It Works

### Image Processing Pipeline
1. **Upload** - User uploads or captures a photo of ingredients
2. **Crop** - User selects the specific area containing ingredients text
3. **Preprocess** - Image is enhanced for better OCR (contrast, sharpening, etc.)
4. **OCR** - Tesseract.js extracts text from the processed image
5. **Detection** - Extracted text is compared against ingredient lists
6. **Display** - Matching ingredients are highlighted with appropriate warnings

### Processing Modes
- **Mild Enhancement** - Gentle contrast boost and grayscale (default)
- **Sharpen Filter** - Helps with blurry text
- **Adaptive Threshold** - Better for low contrast text
- **High Resolution Original** - Minimal processing, just upscaling

## Default Ingredient Lists

### Suspicious Ingredients (May contain haram elements)
- Butter cream (may contain lard)
- Mono and diglycerides (may be from animal fat)
- Enzymes (may be from pork)
- Rennet (may be from non-halal animals)
- Whey (processing concerns)
- Casein (processing concerns)
- L-cysteine (often from human hair or duck feathers)
- Glycerin (may be from animal fat)
- Glycerol (may be from animal fat)
- Stearic acid (may be from animal fat)
- Magnesium stearate (may be from animal fat)
- Cochineal (from insects)
- Confectioner's glaze (from insects)
- MSG/Monosodium glutamate
- Artificial colors (Red 40, Yellow 5, Blue 1)
- Carmine (from insects)

### Prohibited Ingredients (Haram)
- Pork and pork products (bacon, ham, lard)
- Gelatin (pork gelatin, beef gelatin, kosher gelatin - unless specified halal)
- Shellac (from insects)
- Alcohol in all forms (ethanol, ethyl alcohol)
- Alcoholic beverages (wine, beer, rum, bourbon, vodka, sherry, whiskey)
- Cooking wine, rice wine, mirin
- Vanilla extract (contains alcohol)
- Grape juice (may contain alcohol from fermentation)
- Animal-derived ingredients (pepsin, pancreatin)
- Animal shortening/Animal fat (unless halal certified)
- Tallow/Suet (animal fat)

## Customization

Click the settings icon (⚙️) to:
- View and manage ingredient lists
- Add new ingredients to watch for
- Remove ingredients from lists
- Manage both suspicious and prohibited categories
- Reset to default lists if needed

All changes are saved automatically to your browser's local storage.

## Tips for Best Results

1. **Good Lighting** - Take photos in well-lit conditions
2. **Straight Angle** - Hold camera parallel to the label
3. **Focus on Text** - Ensure ingredients text is sharp and clear
4. **Crop Tightly** - Select only the ingredients paragraph
5. **Try Different Modes** - If OCR fails, try different processing modes

## Technical Details

- **Frontend Only** - No server required, runs entirely in the browser
- **Privacy First** - All processing happens locally, no data is sent anywhere
- **Progressive Web App** - Can be installed on mobile devices
- **Responsive Design** - Works on any screen size

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome for Android)

## Dependencies

- [Tesseract.js v5](https://tesseract.projectnaptha.com/) - OCR engine
- No other external dependencies - uses vanilla JavaScript

## Limitations

- OCR accuracy depends on image quality
- Works best with printed text (not handwritten)
- English language only
- Requires good lighting and clear photos

## Recent Updates

- **App Rebranding** - Now called "Halalist" with subtitle "Ingredient Scanner"
- **Green Theme** - Distinctive green color scheme (#01411C)
- **Improved UX** - Instructions hide after scanning, contextual help for processing modes
- **Better Image Handling** - Fixed black image issues with improved loading process
- **Enhanced Cropping** - Original image shown during selection for accuracy

## Future Enhancements

- Multiple language support (Urdu, Arabic, etc.)
- Halal certification database integration
- Barcode scanning for product identification
- Cloud sync for ingredient lists
- Batch processing of multiple images
- Export/import ingredient lists
- Integration with halal food databases
- E-code (E-numbers) detection and explanation

## License

This project is open source and available for personal use.

## Contributing

Feel free to submit issues or pull requests to improve the application. Contributions for halal-specific features and multi-language support are especially welcome.