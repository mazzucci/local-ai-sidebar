// Service Worker for Local AI Extension

// Enable the side panel when the extension is installed
chrome.runtime.onInstalled.addListener(async () => {
    try {
        // Set up the side panel behavior
        await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
        console.log('Local AI extension installed successfully');
        
    } catch (error) {
        console.error('Error setting up side panel:', error);
    }
});

// Handle action button clicks
chrome.action.onClicked.addListener(async (tab) => {
    try {
        // Open the side panel
        await chrome.sidePanel.open({ tabId: tab.id });
    } catch (error) {
        console.error('Error opening side panel:', error);
    }
});


// Handle side panel events
chrome.sidePanel.onOpened.addListener((info) => {
    console.log('Side panel opened:', info);
});

// Clean up when extension is disabled/uninstalled
chrome.runtime.onSuspend.addListener(() => {
    console.log('Local AI extension is being suspended');
});
