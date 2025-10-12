// Content Script for AI Page Assistant Extension
(function() {
    'use strict';

    // Mark that the content script has been injected
    window.aiPageAssistantInjected = true;

    // Page manipulation utilities
    const PageManipulator = {
        // Get page content for AI processing
        getPageContent() {
            const title = document.title;
            const url = window.location.href;
            
            // Get main content (prioritize article, main, or body)
            let mainContent = '';
            const article = document.querySelector('article');
            const main = document.querySelector('main');
            const body = document.body;
            
            if (article) {
                mainContent = article.innerText;
            } else if (main) {
                mainContent = main.innerText;
            } else {
                mainContent = body.innerText;
            }
            
            // Clean up the content
            mainContent = mainContent.replace(/\s+/g, ' ').trim();
            
            // Limit content length to avoid token limits
            if (mainContent.length > 4000) {
                mainContent = mainContent.substring(0, 4000) + '...';
            }
            
            return `Title: ${title}\nURL: ${url}\nContent: ${mainContent}`;
        }
    };

    // Listen for messages from the extension
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                try {
                    switch (request.action) {
                        case 'ping':
                            sendResponse({ success: true });
                            break;
                            
                        case 'getPageContent':
                            const content = PageManipulator.getPageContent();
                            sendResponse({ content: content });
                            break;
                            
                        case 'getSelectedText':
                            const selectedText = window.getSelection().toString().trim();
                            sendResponse({ selectedText: selectedText });
                            break;
                            
                        case 'clearSelection':
                            window.getSelection().removeAllRanges();
                            sendResponse({ success: true });
                            break;
                            
                        default:
                            sendResponse({ error: 'Unknown action' });
                    }
                } catch (error) {
                    console.error('Content script error:', error);
                    sendResponse({ error: error.message });
                }
                
                return true; // Keep message channel open for async response
            });

    // Content script loaded successfully - no visual indicator needed

    console.log('AI Page Assistant content script loaded successfully');
})();