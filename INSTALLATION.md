# Installation Guide - Local AI Sidebar

## Requirements
- Chrome 138+ (latest version recommended)
- Chrome Prompt API enabled
- For detailed requirements, see: [Chrome Prompt API Documentation](https://developer.chrome.com/docs/ai/prompt-api)

## Option 1: Install from Chrome Web Store (Recommended)

Install the extension directly from the [Chrome Web Store](https://chromewebstore.google.com/detail/local-ai-sidebar/oihcenhffgplemccnbaopcflipaiplmo):

1. Visit the [Local AI Sidebar](https://chromewebstore.google.com/detail/local-ai-sidebar/oihcenhffgplemccnbaopcflipaiplmo) page
2. Click **"Add to Chrome"**
3. Click the extension icon to open the AI sidebar
4. The AI model will download automatically on first use (~2GB)

## Option 2: Install from Source (Developers)

For development or testing the latest features:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mazzucci/local-ai-sidebar
   cd local-ai-sidebar
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the extension:**
   ```bash
   npm run build:prod
   ```
   This creates the `dist/` folder with the bundled extension.

4. **Load in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top right corner)
   - Click **"Load unpacked"**
   - Select the `dist/` folder from this project

5. Click the extension icon to open the AI sidebar

## Troubleshooting
- **Extension not loading**: Ensure Chrome is version 138+
- **AI not responding**: Verify the local AI model is downloaded and Chrome Prompt API is enabled
- **Model download fails**: Check [Chrome Prompt API documentation](https://developer.chrome.com/docs/ai/prompt-api) for requirements
- **Sidebar not opening**: Right-click the extension icon and select "Open side panel"
