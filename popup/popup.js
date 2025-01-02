// This script runs when the popup is opened
document.addEventListener('DOMContentLoaded', function() {
  const downloadButton = document.getElementById('downloadAll');
  const statusDiv = document.getElementById('status');
  const progressDiv = document.getElementById('progress');
  
  // Checkboxes for different media types
  const checkboxes = {
    mainImages: document.getElementById('mainImages'),
    detailImages: document.getElementById('detailImages'),
    skuImages: document.getElementById('skuImages'),
    videos: document.getElementById('videos')
  };

  // Load saved preferences when popup opens
  loadSavedPreferences();

  // Add change event listeners to save preferences when changed
  Object.entries(checkboxes).forEach(([key, checkbox]) => {
    checkbox.addEventListener('change', () => {
      savePreferences();
    });
  });

  // Function to load saved preferences
  async function loadSavedPreferences() {
    try {
      const result = await chrome.storage.sync.get({
        // Default values if nothing is saved
        preferences: {
          mainImages: true,
          detailImages: true,
          skuImages: true,
          videos: true
        }
      });

      // Apply saved preferences to checkboxes
      Object.entries(checkboxes).forEach(([key, checkbox]) => {
        checkbox.checked = result.preferences[key];
      });
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  }

  // Function to save preferences
  async function savePreferences() {
    const preferences = {
      mainImages: checkboxes.mainImages.checked,
      detailImages: checkboxes.detailImages.checked,
      skuImages: checkboxes.skuImages.checked,
      videos: checkboxes.videos.checked
    };

    try {
      await chrome.storage.sync.set({ preferences });
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }

  downloadButton.addEventListener('click', async () => {
    const options = {
      mainImages: checkboxes.mainImages.checked,
      detailImages: checkboxes.detailImages.checked,
      skuImages: checkboxes.skuImages.checked,
      videos: checkboxes.videos.checked
    };

    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Check if we're on a JD product page
      if (!tab.url.includes('item.jd.com')) {
        statusDiv.textContent = 'Please navigate to a JD product page first.';
        return;
      }

      statusDiv.textContent = 'Extracting media...';
      
      // First, check if the content script is already loaded
      try {
        const [{ result: isLoaded }] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => window.JDImageExtractor !== undefined
        });

        // Only inject if not already loaded
        if (!isLoaded) {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content/content.js']
          });

          // Wait a brief moment to ensure the script is loaded
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Now send message to the content script
        const media = await chrome.tabs.sendMessage(tab.id, {
          action: 'extractMedia',
          options: options
        });

        // Create a timestamp in YYYY_MM_DD_HH_mm format for the product folder
        const date = new Date();
        const timestamp = `${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, '0')}_${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}_${String(date.getMinutes()).padStart(2, '0')}`;
        const productId = tab.url.match(/item\.jd\.com\/(\d+)\.html/)?.[1] || 'unknown';
        const baseFolder = `JD_Product_${timestamp}_${productId}`;

        // Prepare downloads by type
        let totalFiles = 0;
        const downloads = [];

        if (media.main && media.main.length > 0) {
          media.main.forEach((url, index) => {
            downloads.push({
              url,
              filename: `${baseFolder}/main_images/main_${index + 1}${getFileExtension(url)}`
            });
          });
          totalFiles += media.main.length;
        }

        if (media.detail && media.detail.length > 0) {
          media.detail.forEach((url, index) => {
            downloads.push({
              url,
              filename: `${baseFolder}/detail_images/detail_${index + 1}${getFileExtension(url)}`
            });
          });
          totalFiles += media.detail.length;
        }

        if (media.sku && media.sku.length > 0) {
          media.sku.forEach((url, index) => {
            downloads.push({
              url,
              filename: `${baseFolder}/sku_images/sku_${index + 1}${getFileExtension(url)}`
            });
          });
          totalFiles += media.sku.length;
        }

        if (media.videos && media.videos.length > 0) {
          media.videos.forEach((url, index) => {
            downloads.push({
              url,
              filename: `${baseFolder}/videos/video_${index + 1}${getFileExtension(url)}`
            });
          });
          totalFiles += media.videos.length;
        }

        if (downloads.length === 0) {
          statusDiv.textContent = 'No media found to download.';
          return;
        }

        // Create progress bar
        progressDiv.innerHTML = '<div class="progress-bar"></div>';
        const progressBar = progressDiv.querySelector('.progress-bar');

        // Download files
        for (let i = 0; i < downloads.length; i++) {
          const { url, filename } = downloads[i];
          
          try {
            await chrome.downloads.download({
              url: url,
              filename: filename,
              conflictAction: 'uniquify'
            });

            // Update progress
            const progress = ((i + 1) / downloads.length) * 100;
            progressBar.style.width = `${progress}%`;
            statusDiv.textContent = `Downloading: ${i + 1}/${downloads.length}`;
          } catch (downloadError) {
            console.error(`Failed to download ${filename}:`, downloadError);
            // Continue with next download even if one fails
            continue;
          }
        }

        statusDiv.textContent = `Download complete! Saved ${downloads.length} files.`;
      } catch (error) {
        console.error('Error:', error);
        statusDiv.textContent = `Error: ${error.message}`;
      }
    } catch (error) {
      console.error('Error:', error);
      statusDiv.textContent = `Error: ${error.message}`;
    }
  });
});

function getFileExtension(url) {
  // First try to get extension from URL
  const urlMatch = url.match(/\.(jpg|jpeg|png|gif|mp4|webm|webp)($|\?)/i);
  if (urlMatch) return `.${urlMatch[1].toLowerCase()}`;

  // If no extension in URL, try to guess from content type or default to .jpg
  if (url.includes('video')) return '.mp4';
  return '.jpg';
} 