// Check if the script has already been loaded
if (!window.JDImageExtractor) {
  // Content script to extract images from JD product pages
  window.JDImageExtractor = class {
    constructor() {
      this.images = {
        main: [],
        detail: [],
        sku: [],
        videos: []
      };
    }

    // Extract main product images
    extractMainImages() {
      // Main product images are usually in the img-hover class
      const mainImages = document.querySelectorAll('#spec-list img');
      return Array.from(mainImages).map(img => {
        // Convert thumbnail URLs to full-size image URLs
        // get value of src and data-url
        const src = img.src;
        const dataUrl = img.getAttribute('data-url');
        
        // replace n5 of src with imgzone
        let newSrc = src.replace('/n5/', '/imgzone/');
        // replace imgzone/
        return newSrc.replace(/imgzone\/.*/, `imgzone/${dataUrl}`);
      });
    }

    // Extract detail images
    extractDetailImages() {
      const activityHeader = document.querySelectorAll('#activity_header img');
      const activityHeaderUrls = Array.from(activityHeader).map(img => {
        return img.src;
      });

      // Detail images are usually in the detail section
      // Detail images are in background-image CSS property of ssd-module divs
      const detailDivs = document.querySelectorAll('#detail .ssd-module');
      const detailUrls = Array.from(detailDivs)
        .map(div => {
          const bgImage = window.getComputedStyle(div).backgroundImage;
          // Extract URL from background-image property (format: url("imageUrl"))
          return bgImage.replace(/^url\(['"](.+)['"]\)$/, '$1');
        })
        .filter(url => url !== 'none'); // Filter out divs with no background image

      return [...activityHeaderUrls, ...detailUrls];
    }

    // Extract SKU images
    extractSkuImages() {
      const skuImages = new Set();
      
      // Get images from the color/style selector
      const colorImages = document.querySelectorAll('#choose-attr-1 img, .color-list img');
      colorImages.forEach(img => {
        // Get the original image URL from data-url attribute if available
        const imgUrl = img.getAttribute('data-url') || img.src;
        if (imgUrl) {
          // Convert to high-quality image URL
          const highQualityUrl = imgUrl.replace('/n5/', '/imgzone/');
          skuImages.add(highQualityUrl);
        }
      });

      // Get images from the version/size selector
      const versionImages = document.querySelectorAll('#choose-attr-2 img, .size-list img');
      versionImages.forEach(img => {
        const imgUrl = img.getAttribute('data-url') || img.src;
        if (imgUrl) {
          const highQualityUrl = imgUrl.replace('/n5/', '/imgzone/');
          skuImages.add(highQualityUrl);
        }
      });

      // Get images from any other attribute selectors (like size, color, etc.)
      const otherSkuImages = document.querySelectorAll('.choose-attr img, .item-selected img');
      otherSkuImages.forEach(img => {
        const imgUrl = img.getAttribute('data-url') || img.src;
        if (imgUrl) {
          const highQualityUrl = imgUrl.replace('/n5/', '/imgzone/');
          skuImages.add(highQualityUrl);
        }
      });

      // Convert Set to Array and remove any duplicates
      return [...skuImages].filter(url => url && !url.includes('blank.gif'));
    }

    // Extract video URLs
    extractVideos() {
      // JD videos can be embedded in multiple ways:
      const videoUrls = [];

      // Get video source from Video.js player
      const videoJsPlayer = document.querySelector('#video-player_html5_api');
      if (videoJsPlayer && videoJsPlayer.src) {
        videoUrls.push(videoJsPlayer.src);
      }

      const videoDetailJsPlayer = document.querySelector('#detail-video-player_html5_api');
      if (videoDetailJsPlayer && videoDetailJsPlayer.src) {
        videoUrls.push(videoDetailJsPlayer.src);
      }

      // Remove duplicates
      return [...new Set(videoUrls)];
    }

    // Get all media based on options
    getAllMedia(options) {
      const media = {};
      
      if (options.mainImages) {
        media.main = this.extractMainImages();
      }
      if (options.detailImages) {
        media.detail = this.extractDetailImages();
      }
      if (options.skuImages) {
        media.sku = this.extractSkuImages();
      }
      if (options.videos) {
        media.videos = this.extractVideos();
      }

      return media;
    }
  };

  // Listen for messages from popup only if not already set up
  if (!window.messageListenerSet) {
    window.messageListenerSet = true;
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'extractMedia') {
        const extractor = new window.JDImageExtractor();
        const media = extractor.getAllMedia(request.options);
        sendResponse(media);
      }
      return true; // Keep the message channel open for async response
    });
  }

  console.log('JD Image Extractor initialized');
} 