// Service Worker for AI Page Assistant Extension

// Enable the side panel when the extension is installed
chrome.runtime.onInstalled.addListener(async () => {
    try {
        // Set up the side panel behavior
        await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
        console.log('AI Page Assistant extension installed successfully');
        
        // Set up context menu (optional feature)
        try {
            if (chrome.contextMenus) {
                chrome.contextMenus.create({
                    id: 'ai-assistant',
                    title: 'Ask AI about this page',
                    contexts: ['page', 'selection']
                });
                console.log('Context menu created successfully');
            }
        } catch (contextError) {
            console.log('Context menu not available:', contextError.message);
        }
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

// Handle context menu clicks (if available)
if (chrome.contextMenus && chrome.contextMenus.onClicked) {
    chrome.contextMenus.onClicked.addListener(async (info, tab) => {
        if (info.menuItemId === 'ai-assistant') {
            try {
                await chrome.sidePanel.open({ tabId: tab.id });
            } catch (error) {
                console.error('Error opening side panel from context menu:', error);
            }
        }
    });
}

// Note: Content script injection is now handled on-demand per tab
// when user explicitly enables page content or selected text features

// Handle messages from content script
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === 'getPageContent') {
        // This will be handled by the content script
        sendResponse({ success: true });
    }
    
    // Handle manual content script injection request
    if (request.action === 'injectContentScript') {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content-script.js']
                });
                console.log('Content script manually injected for tab:', tab.id);
                sendResponse({ success: true });
            } else {
                sendResponse({ success: false, error: 'No active tab found' });
            }
        } catch (error) {
            console.error('Error manually injecting content script:', error);
            sendResponse({ success: false, error: error.message });
        }
        return true; // Keep message channel open for async response
    }
});

// Handle side panel events
chrome.sidePanel.onOpened.addListener((info) => {
    console.log('Side panel opened:', info);
});

// Note: Badge updates removed for better privacy - extension is now truly on-demand per tab

// Clean up when extension is disabled/uninstalled
chrome.runtime.onSuspend.addListener(() => {
    console.log('AI Page Assistant extension is being suspended');
});
