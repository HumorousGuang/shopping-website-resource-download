// Background script runs in the background
// Handle events, manage state, and perform actions that don't require UI

// Handle installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('JD Image Downloader installed');
});

// Handle download errors
chrome.downloads.onChanged.addListener((delta) => {
  if (delta.error) {
    console.error('Download failed:', delta.error);
  }
}); 