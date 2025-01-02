# JD Shopping Website Resource Downloader

A Chrome extension that helps download images and videos from JD.com product pages.

## Features

- Download product images in high quality:
  - Main product images
  - Detail images
  - SKU/variant images
  - Product videos
- Organize downloads into categorized folders
- Save user preferences
- One-click download all selected resources
- Automatic high-quality image URL conversion

## Installation

1. Clone this repository or download the ZIP file
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

1. Navigate to any JD.com product page (e.g., item.jd.com/*)
2. Click the extension icon in your browser
3. Select which types of media you want to download
4. Click "Download All"
5. Files will be downloaded to your default download folder, organized in the following structure:
   ```
   JD_Product_[timestamp]_[productId]/
   ├── main_images/
   ├── detail_images/
   ├── sku_images/
   └── videos/
   ```

## Project Structure 