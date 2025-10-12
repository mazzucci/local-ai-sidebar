// Sidebar JavaScript for AI Page Assistant using Chrome's Prompt API
console.log('Sidebar script loading...');

class AIPageAssistant {
    constructor() {
        console.log('AIPageAssistant constructor called');
        this.currentTab = null;
        this.session = null;
        this.settings = {
            temperature: 0.7,
            topK: 40
        };
        this.modelAvailable = false;
        this.modelStatus = 'checking';
        this.selectedText = '';
        this.prompts = [];
        this.chatHistory = new Map(); // Store chat history per tab
        this.init();
    }

    async init() {
        console.log('AIPageAssistant init started');
        await this.loadSettings();
        await this.loadPrompts();
        
        // Set up event listeners immediately - sidebar should be ready
        this.setupEventListeners();
        this.setupTabs();
        
        // Show splash screen and start loading
        this.showSplashScreen();
        
        // Check model availability
        await this.checkModelAvailability();
        
        // Get current tab and update UI
        await this.updateCurrentTab();
        
        // Ensure content script is available for text selection
        await this.ensureContentScriptInjected();
        
        // Listen for tab changes
        this.setupTabChangeListener();
        
        // Initialize prompt library
        this.renderPrompts();
        this.renderFavorites();
        console.log('AIPageAssistant init completed');
    }

    showSplashScreen() {
        const splash = document.getElementById('loading-splash');
        if (splash) {
            splash.style.display = 'flex';
        }
        this.updateSplashStatus('Initializing AI model...');
    }

    hideSplashScreen() {
        const splash = document.getElementById('loading-splash');
        if (splash) {
            splash.classList.add('hidden');
            // Remove from DOM after animation
            setTimeout(() => {
                splash.style.display = 'none';
            }, 300);
        }
    }

    updateSplashStatus(message) {
        const statusText = document.getElementById('splash-status-text');
        if (statusText) {
            statusText.textContent = message;
        }
    }

    handleToggleChange() {
        const includePageContent = document.getElementById('include-page-content').checked;
        
        console.log('Toggle change - Page content:', includePageContent);
        
        // If page content toggle is enabled, ensure content script is injected
        if (includePageContent) {
            this.ensureContentScriptInjected();
        }
    }

    async checkAndFillSelectedText() {
        try {
            console.log('checkAndFillSelectedText called');
            if (!this.currentTab || !this.currentTab.id) {
                console.log('No current tab available');
                return;
            }
            
            console.log('Getting selected text for tab:', this.currentTab.id);
            const selectedText = await this.getSelectedText();
            console.log('Selected text result:', selectedText);
            
            this.updateSelectedTextDisplay(selectedText);
        } catch (error) {
            console.error('Error checking selected text for auto-fill:', error);
        }
    }

    updateSelectedTextDisplay(selectedText) {
        const selectedTextDisplay = document.getElementById('selected-text-display');
        const selectedTextContent = document.getElementById('selected-text-content');
        
        if (!selectedTextDisplay || !selectedTextContent) {
            console.log('Selected text display elements not found');
            return;
        }
        
        if (selectedText && selectedText.trim()) {
            // Show first 2-3 words with ellipsis
            const words = selectedText.trim().split(/\s+/);
            const displayText = words.length > 3 
                ? words.slice(0, 3).join(' ') + '...' 
                : selectedText;
            
            selectedTextContent.textContent = displayText;
            selectedTextDisplay.style.display = 'flex';
            console.log('Selected text display updated:', displayText);
        } else {
            selectedTextDisplay.style.display = 'none';
            console.log('Selected text display hidden');
        }
    }

    async ensureContentScriptInjected() {
        try {
            if (!this.currentTab || !this.currentTab.id) {
                console.log('No current tab available for content script injection');
                return;
            }
            
            console.log('Checking if content script is injected for tab:', this.currentTab.id);
            
            // Check if content script is already injected
            const response = await chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'ping'
            }).catch(() => null);
            
            if (!response) {
                console.log('Content script not found, injecting...');
                // Inject content script
                await chrome.runtime.sendMessage({
                    action: 'injectContentScript'
                });
                console.log('Content script injection requested');
            } else {
                console.log('Content script already injected');
            }
        } catch (error) {
            console.error('Error ensuring content script:', error);
        }
    }


    clearChatInput() {
        console.log('Clear button clicked');
        
        // Clear chat input text
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.value = '';
            chatInput.focus();
            console.log('Chat input cleared');
        }
        
        // Clear selected text display
        this.updateSelectedTextDisplay('');
        
        // Clear chat history for current tab
        const tabKey = this.getTabKey();
        this.chatHistory.delete(tabKey);
        console.log('Chat history cleared for tab:', tabKey);
        
        // Reload the chat for this tab (will show initial message)
        this.loadChatHistoryForTab();
    }

    async checkModelAvailability() {
        try {
            this.updateSplashStatus('Checking Prompt API availability...');
            
            // Check if the Prompt API is available
            if (!('LanguageModel' in window)) {
                this.modelStatus = 'unavailable';
                this.updateStatus('Prompt API not available');
                this.updateSplashStatus('Prompt API not available');
                this.showModelStatus();
                this.hideSplashScreen();
                return;
            }

            this.updateSplashStatus('Checking Gemini Nano availability...');
            
            // Check model availability
            const availability = await LanguageModel.availability();
            this.modelStatus = availability;
            
            if (availability === 'unavailable') {
                this.updateStatus('Gemini Nano not available');
                this.updateSplashStatus('Gemini Nano not available');
                this.showModelStatus();
                this.hideSplashScreen();
                return;
            }

            if (availability === 'downloadable' || availability === 'downloading') {
                this.updateStatus('Gemini Nano needs to be downloaded first');
                this.updateSplashStatus('Gemini Nano needs to be downloaded');
                this.showModelStatus();
                this.hideSplashScreen();
                return;
            }

            if (availability === 'available') {
                this.updateSplashStatus('Initializing Gemini Nano session...');
                this.modelAvailable = true;
                this.updateStatus('Ready - Gemini Nano loaded');
                await this.initializeSession();
                this.updateSplashStatus('Ready!');
                setTimeout(() => this.hideSplashScreen(), 1000);
            }

            this.showModelStatus();
        } catch (error) {
            console.error('Error checking model availability:', error);
            this.modelStatus = 'error';
            this.updateStatus('Error checking model availability');
            this.updateSplashStatus('Error loading model');
            this.showModelStatus();
            this.hideSplashScreen();
        }
    }

    async initializeSession() {
        try {
            if (!this.modelAvailable) return;
            
            this.session = await LanguageModel.create();
            
            // Set up the AI assistant with context
            await this.session.prompt(`You are an AI assistant that helps users interact with web pages. You can:
1. Answer questions about page content
2. Provide summaries and analysis
3. Give instructions for page modifications
4. Help users understand and navigate web content

Always be helpful, concise, and focus on the user's needs. If asked to modify a page, provide clear, actionable instructions.`);
            
            this.updateStatus('AI Assistant ready');
        } catch (error) {
            console.error('Error initializing session:', error);
            this.updateStatus('Error initializing AI session');
        }
    }

    showModelStatus() {
        const statusMessages = {
            'unavailable': 'Gemini Nano is not available on this device.',
            'downloadable': 'Gemini Nano needs to be downloaded. Click "Download Model" to start the download.',
            'downloading': 'Gemini Nano is being downloaded. This may take several minutes depending on your internet connection.',
            'available': 'Gemini Nano is ready to use!',
            'error': 'There was an error checking model availability.'
        };

        const message = statusMessages[this.modelStatus] || 'Unknown status';
        
        // Update the status display in settings tab
        const statusElement = document.getElementById('model-status-info');
        if (statusElement) {
            statusElement.innerHTML = `<p>${message}</p>`;
        }
        
        // Add download button if needed
        if (this.modelStatus === 'downloadable') {
            this.addDownloadButton();
        }
    }

    addDownloadButton() {
        const messagesContainer = document.getElementById('chat-messages');
        const buttonDiv = document.createElement('div');
        buttonDiv.className = 'message ai-message';
        buttonDiv.innerHTML = `
            <div class="message-content">
                <button id="download-model-btn" class="download-button">
                    📥 Download Gemini Nano Model
                </button>
                <p><small>This will download ~2GB of data. Make sure you have a stable internet connection.</small></p>
            </div>
        `;
        messagesContainer.appendChild(buttonDiv);
        
        document.getElementById('download-model-btn').addEventListener('click', () => {
            this.downloadModel();
        });
    }

    async downloadModel() {
        try {
            this.updateStatus('Starting model download...');
            
            // Trigger download by creating a session (this will start the download)
            const tempSession = await LanguageModel.create();
            await tempSession.prompt('Hello'); // Simple prompt to trigger download
            tempSession.destroy();
            
            this.updateStatus('Model download started');
            this.addMessage('Model download has started. This may take several minutes. You can continue using the extension while it downloads.', 'ai');
            
            // Check availability periodically
            this.checkDownloadProgress();
        } catch (error) {
            console.error('Error starting download:', error);
            this.updateStatus('Error starting download');
            this.addMessage('There was an error starting the model download. Please try again.', 'ai');
        }
    }

    async checkDownloadProgress() {
        const checkInterval = setInterval(async () => {
            try {
                const availability = await LanguageModel.availability();
                if (availability === 'available') {
                    clearInterval(checkInterval);
                    this.modelAvailable = true;
                    this.modelStatus = 'available';
                    this.updateStatus('Model download complete - Ready!');
                    this.addMessage('🎉 Gemini Nano is now ready to use!', 'ai');
                    await this.initializeSession();
                } else if (availability === 'unavailable') {
                    clearInterval(checkInterval);
                    this.updateStatus('Model download failed');
                    this.addMessage('Model download failed. Please check your internet connection and try again.', 'ai');
                }
            } catch (error) {
                console.error('Error checking download progress:', error);
            }
        }, 5000); // Check every 5 seconds
    }

    setupEventListeners() {
        console.log('setupEventListeners called');
        
        // Chat functionality
        const chatInput = document.getElementById('chat-input');
        const sendButton = document.getElementById('send-button');
        
        console.log('Setting up chat listeners - chatInput:', !!chatInput, 'sendButton:', !!sendButton);

        if (sendButton) {
            sendButton.addEventListener('click', () => this.sendMessage());
            console.log('Send button listener added');
        }
        if (chatInput) {
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            // Ensure content script is available when user interacts with chat
            chatInput.addEventListener('focus', () => {
                console.log('Chat input focused');
                this.ensureContentScriptInjected();
                this.checkAndFillSelectedText();
            });
            
            // Also check for selected text when clicking on chat input
            chatInput.addEventListener('click', () => {
                console.log('Chat input clicked');
                setTimeout(() => {
                    this.ensureContentScriptInjected();
                    this.checkAndFillSelectedText();
                }, 50);
            });
            console.log('Chat input listener added');
        }

        // Note: Action buttons removed for privacy and stability

        // Settings
        document.getElementById('save-settings').addEventListener('click', () => this.saveSettings());
        document.getElementById('temperature').addEventListener('input', (e) => {
            document.getElementById('temperature-value').textContent = e.target.value;
        });
        
        // Toggle event listeners
        const pageContentToggle = document.getElementById('include-page-content');
        
        console.log('Toggle elements found - pageContent:', !!pageContentToggle);
        
        if (pageContentToggle) {
            pageContentToggle.addEventListener('change', () => {
                console.log('Page content toggle changed:', pageContentToggle.checked);
                this.handleToggleChange();
            });
        }
        
        // Add click listeners to toggle labels to actually toggle the checkboxes
        const toggleLabels = document.querySelectorAll('.toggle-label');
        console.log('Found toggle labels:', toggleLabels.length);
        
        toggleLabels.forEach((label, index) => {
            console.log(`Setting up toggle label ${index}:`, label);
            label.addEventListener('click', (e) => {
                console.log(`Toggle label ${index} clicked`);
                e.preventDefault();
                e.stopPropagation();
                const checkbox = label.querySelector('input[type="checkbox"]');
                if (checkbox) {
                    console.log(`Toggling checkbox ${checkbox.id} from ${checkbox.checked} to ${!checkbox.checked}`);
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                } else {
                    console.log('No checkbox found in label');
                }
            });
        });
        
        // Clear chat button
        const clearButton = document.getElementById('clear-chat-btn');
        console.log('Setting up clear button listener - clearButton:', !!clearButton);
        if (clearButton) {
            clearButton.addEventListener('click', () => this.clearChatInput());
        }
        
        // Manual content script injection
        document.getElementById('inject-script-btn').addEventListener('click', () => this.injectContentScript());
        
        // Test selected text button
        document.getElementById('test-selected-text-btn').addEventListener('click', () => this.testSelectedText());
        
        // Prompt library buttons
        document.getElementById('add-prompt-btn').addEventListener('click', () => this.showAddPromptModal());
        
        // Modal event listeners
        document.getElementById('modal-close').addEventListener('click', () => this.closePromptModal());
        document.getElementById('modal-cancel').addEventListener('click', () => this.closePromptModal());
        document.getElementById('modal-save').addEventListener('click', () => this.savePromptFromModal());
        
        // Close modal when clicking outside
        document.getElementById('prompt-modal').addEventListener('click', (e) => {
            if (e.target.id === 'prompt-modal') {
                this.closePromptModal();
            }
        });
        
        // Handle Enter key in modal textarea
        document.getElementById('prompt-content-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.savePromptFromModal();
            }
        });
        
        // Add click listener to entire sidebar to check for selected text
        document.addEventListener('click', (e) => {
            // Only check if clicking within the sidebar and not on input elements
            if (e.target.closest('.container') && !e.target.matches('input, textarea, button')) {
                console.log('Sidebar clicked, checking for selected text');
                // Small delay to avoid checking too frequently
                setTimeout(() => {
                    this.ensureContentScriptInjected();
                    this.checkAndFillSelectedText();
                }, 100);
            }
        });
        
        // Add click listener to quick prompt buttons to refresh selected text
        document.addEventListener('click', (e) => {
            if (e.target.matches('.favorite-prompt-btn')) {
                console.log('Quick prompt clicked, refreshing selected text');
                setTimeout(async () => {
                    await this.ensureContentScriptInjected();
                    await this.getSelectedText(); // Refresh the selection
                }, 50);
            }
        });
    }

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;
                
                // Remove active class from all tabs and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                button.classList.add('active');
                document.getElementById(`${targetTab}-tab`).classList.add('active');
                
                // No special action needed when switching tabs
            });
        });
    }

    async updateCurrentTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            this.currentTab = tab;
            this.updateTabInfo();
        } catch (error) {
            console.error('Error getting current tab:', error);
        }
    }

    updateTabInfo() {
        const tabTitle = document.getElementById('tab-title');
        const tabUrl = document.getElementById('tab-url');
        
        if (this.currentTab && tabTitle && tabUrl) {
            tabTitle.textContent = this.currentTab.title || 'Untitled';
            tabUrl.textContent = this.currentTab.url || '';
        }
        
        // Load chat history for this tab
        this.loadChatHistoryForTab();
    }

    getTabKey() {
        return this.currentTab ? `${this.currentTab.id}-${this.currentTab.url}` : 'unknown';
    }

    loadChatHistoryForTab() {
        const tabKey = this.getTabKey();
        const messagesContainer = document.getElementById('chat-messages');
        
        if (!messagesContainer) return;
        
        // Clear current messages
        messagesContainer.innerHTML = '';
        
        // Load messages for this tab
        const tabHistory = this.chatHistory.get(tabKey) || [];
        
        if (tabHistory.length === 0) {
            // Show initial message for new tab
            this.addMessage('Hello! I can help you with this page. Type your message below or use the quick prompts above for quick access.\n\n🔒 Privacy: This extension only accesses content when you explicitly enable the page content toggle below. Selected text is automatically included when available. Each tab is independent.', 'ai', false);
        } else {
            // Restore chat history for this tab
            tabHistory.forEach(msg => {
                this.addMessage(msg.content, msg.sender, false);
            });
        }
    }

    saveChatHistoryForTab() {
        const tabKey = this.getTabKey();
        const messagesContainer = document.getElementById('chat-messages');
        
        if (!messagesContainer) return;
        
        const messages = [];
        const messageElements = messagesContainer.querySelectorAll('.message');
        
        messageElements.forEach(msgEl => {
            const contentEl = msgEl.querySelector('.message-content');
            if (contentEl) {
                const sender = msgEl.classList.contains('user-message') ? 'user' : 'ai';
                const content = contentEl.textContent || contentEl.innerText;
                messages.push({ sender, content });
            }
        });
        
        this.chatHistory.set(tabKey, messages);
    }

    setupTabChangeListener() {
        // Listen for tab activation changes
        chrome.tabs.onActivated.addListener(async (activeInfo) => {
            try {
                const tab = await chrome.tabs.get(activeInfo.tabId);
                this.currentTab = tab;
                this.updateTabInfo();
            } catch (error) {
                console.error('Error handling tab activation:', error);
            }
        });

        // Listen for tab updates (when page loads/changes)
        chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
            // Only update if this is the active tab and the page has finished loading
            if (changeInfo.status === 'complete' && this.currentTab && tabId === this.currentTab.id) {
                try {
                    this.currentTab = tab;
                    this.updateTabInfo();
                } catch (error) {
                    console.error('Error handling tab update:', error);
                }
            }
        });
    }

    startDownloadProgressCheck() {
        // Simple download progress check
        const checkInterval = setInterval(async () => {
            try {
                const availability = await LanguageModel.availability();
                if (availability === 'available') {
                    clearInterval(checkInterval);
                    this.updateStatus('Model download complete - Ready!');
                    await this.initializeSession();
                } else if (availability === 'unavailable') {
                    clearInterval(checkInterval);
                    this.updateStatus('Model download failed');
                }
            } catch (error) {
                console.error('Error checking download progress:', error);
            }
        }, 5000); // Check every 5 seconds
    }

    async sendMessage() {
        const chatInput = document.getElementById('chat-input');
        const message = chatInput.value.trim();
        
        if (!message) return;
        
        // Clear input
        chatInput.value = '';
        this.lastUserMessage = message; // Store for action detection
        
        // Get context information for display
        let displayMessage = message;
        let pageContent = "";
        let selectedText = "";
        const includePageContent = document.getElementById('include-page-content').checked;
        
        // Always check for selected text first
        try {
            await this.ensureContentScriptInjected();
            selectedText = await this.getSelectedText();
            console.log('Selected text retrieved:', selectedText ? `"${selectedText}"` : 'None');
            
            // Add selected text indicator
            if (selectedText.trim()) {
                // Show truncated version like in the display above
                const truncatedText = selectedText.length > 50 
                    ? selectedText.substring(0, 50) + '...' 
                    : selectedText;
                displayMessage += `\n\n📝 Selected text: "${truncatedText}"`;
            }
        } catch (error) {
            console.log('Error getting selected text:', error);
        }
        
        // Get page content if enabled
        if (includePageContent) {
            try {
                pageContent = await this.getPageContent();
                console.log('Page content retrieved:', pageContent ? 'Yes' : 'No');
                
                // Add page content indicator
                if (pageContent && this.currentTab) {
                    const pageTitle = this.currentTab.title || 'Current Page';
                    displayMessage += `\n\n📄 Page content: "${pageTitle}"`;
                }
            } catch (error) {
                console.log('Error getting page content:', error);
            }
        }
        
        // Add user message with context indicators
        this.addMessage(displayMessage, 'user');
        
        if (!this.modelAvailable) {
            this.addMessage('Please wait for Gemini Nano to be ready, or download it if needed.', 'ai');
            return;
        }

        this.updateStatus('AI is thinking...');
        
        // Show thinking indicator
        this.showThinkingIndicator();

        try {
            // Create the prompt with page context and selected text
            let prompt = `The user is currently on a webpage and has asked: "${message}"`;
            
            // Include selected text if available (automatic)
            if (selectedText.trim()) {
                prompt += `\n\nThe user has selected this specific text from the page: "${selectedText}"`;
            }
            
            // Include page content if user has enabled it
            if (includePageContent && pageContent) {
                prompt += `\n\nHere's the content of the current page:
${pageContent}`;
            } else if (!includePageContent && !selectedText.trim()) {
                prompt += `\n\nNote: The user has chosen not to share page content and has not selected any text, so I only have access to their question.`;
            } else if (!includePageContent && selectedText.trim()) {
                prompt += `\n\nNote: The user has chosen not to share page content, but has selected specific text to discuss.`;
            }
            
            prompt += `\n\nPlease provide a helpful response about the content. Do not suggest any page modifications or formatting changes. Just provide informative and helpful responses about the content.`;
            
            console.log('Final prompt:', prompt);
            
            // Send to Gemini Nano
            const response = await this.session.prompt(prompt, {
                temperature: this.settings.temperature,
                topK: this.settings.topK
            });
            
            // Hide thinking indicator and add AI response
            this.hideThinkingIndicator();
            console.log('AI Response:', response); // Debug log
            this.addMessage(response, 'ai');
            this.updateStatus('Ready');
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.hideThinkingIndicator();
            this.addMessage('Sorry, I encountered an error. Please try again.', 'ai');
            this.updateStatus('Error occurred');
        }
    }

    async getPageContent() {
        try {
            const response = await chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'getPageContent'
            });
            return response.content;
        } catch (error) {
            console.error('Error getting page content:', error);
            return 'Unable to read page content';
        }
    }

    addMessage(content, sender, saveToHistory = true) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (sender === 'user') {
            contentDiv.textContent = content;
        } else {
            contentDiv.innerHTML = `<strong>AI Assistant:</strong> ${this.formatMessage(content)}`;
        }
        
        messageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Save to tab-specific chat history
        if (saveToHistory) {
            this.saveChatHistoryForTab();
        }
    }

    formatMessage(content) {
        // Escape HTML to prevent XSS
        let formatted = content.replace(/&/g, '&amp;')
                              .replace(/</g, '&lt;')
                              .replace(/>/g, '&gt;');
        
        // Convert line breaks to <br>
        formatted = formatted.replace(/\n/g, '<br>');
        
        // Bold text: **text** or __text__
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>');
        
        // Italic text: *text* or _text_
        formatted = formatted.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
        formatted = formatted.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>');
        
        // Code: `code`
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Code blocks: ```code```
        formatted = formatted.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
        
        // Links: [text](url)
        formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        
        // Lists: - item or * item
        formatted = formatted.replace(/^[\s]*[-*]\s+(.+)$/gm, '<li>$1</li>');
        formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        
        return formatted;
    }

    showThinkingIndicator() {
        const messagesContainer = document.getElementById('chat-messages');
        
        // Create thinking message
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai-message thinking-message';
        messageDiv.id = 'thinking-indicator';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content thinking-content';
        contentDiv.innerHTML = `
            <div class="thinking-indicator">
                <div class="thinking-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <span class="thinking-text">AI is thinking...</span>
            </div>
        `;
        
        messageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideThinkingIndicator() {
        const thinkingIndicator = document.getElementById('thinking-indicator');
        if (thinkingIndicator) {
            thinkingIndicator.remove();
        }
    }

    showMessage(message, sender) {
        this.addMessage(message, sender);
    }

    updateStatus(status) {
        document.getElementById('status').textContent = status;
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['temperature', 'topK']);
            this.settings = {
                temperature: result.temperature || 0.7,
                topK: result.topK || 40
            };
            
            // Update UI
            document.getElementById('temperature').value = this.settings.temperature;
            document.getElementById('temperature-value').textContent = this.settings.temperature;
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async saveSettings() {
        this.settings = {
            temperature: parseFloat(document.getElementById('temperature').value),
            topK: 40 // Default value for now
        };

        try {
            await chrome.storage.sync.set(this.settings);
            this.updateStatus('Settings saved');
            
            // Show confirmation
            const saveButton = document.getElementById('save-settings');
            const originalText = saveButton.textContent;
            saveButton.textContent = 'Saved!';
            saveButton.style.background = '#28a745';
            
            setTimeout(() => {
                saveButton.textContent = originalText;
                saveButton.style.background = '';
            }, 2000);
        } catch (error) {
            console.error('Error saving settings:', error);
            this.updateStatus('Failed to save settings');
        }
    }

    async testSelectedText() {
        console.log('=== TESTING SELECTED TEXT ===');
        try {
            // First ensure content script is injected
            await this.ensureContentScriptInjected();
            
            // Wait a moment for injection to complete
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Test getting selected text
            const selectedText = await this.getSelectedText();
            console.log('Selected text from test:', selectedText);
            
            if (selectedText.trim()) {
                this.addMessage(`✅ Selected text detected: "${selectedText}"`, 'ai');
                
                // Test auto-fill
                const chatInput = document.getElementById('chat-input');
                if (chatInput) {
                    chatInput.value = selectedText;
                    this.addMessage('✅ Selected text filled in chat input', 'ai');
                } else {
                    this.addMessage('❌ Chat input not found', 'ai');
                }
            } else {
                this.addMessage('❌ No text selected on the page', 'ai');
            }
        } catch (error) {
            console.error('Test selected text error:', error);
            this.addMessage(`❌ Test failed: ${error.message}`, 'ai');
        }
        console.log('=== END TEST ===');
    }

    async injectContentScript() {
        try {
            this.updateStatus('Injecting content script...');
            
            const response = await chrome.runtime.sendMessage({
                action: 'injectContentScript'
            });
            
            if (response.success) {
                this.updateStatus('Content script injected successfully');
                this.addMessage('✅ Content script has been injected. Page manipulation should now work!', 'ai');
                
                // Show confirmation
                const injectButton = document.getElementById('inject-script-btn');
                const originalText = injectButton.textContent;
                injectButton.textContent = '✅ Injected!';
                injectButton.style.background = '#28a745';
                
                setTimeout(() => {
                    injectButton.textContent = originalText;
                    injectButton.style.background = '';
                }, 3000);
            } else {
                this.updateStatus('Failed to inject content script');
                this.addMessage(`❌ Failed to inject content script: ${response.error}`, 'ai');
            }
        } catch (error) {
            console.error('Error injecting content script:', error);
            this.updateStatus('Error injecting content script');
            this.addMessage('❌ Error injecting content script. Please try again.', 'ai');
        }
    }

    async getSelectedText() {
        try {
            if (!this.currentTab || !this.currentTab.id) {
                console.log('No current tab available for selected text');
                return '';
            }
            
            console.log('Sending getSelectedText message to tab:', this.currentTab.id);
            const response = await chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'getSelectedText'
            });
            
            console.log('Selected text response:', response);
            return response?.selectedText || '';
        } catch (error) {
            console.error('Error getting selected text:', error);
            return '';
        }
    }

    testToggle() {
        console.log('Testing toggle functionality...');
        const checkbox = document.getElementById('include-page-content');
        const label = document.querySelector('.toggle-label');
        
        console.log('Checkbox found:', !!checkbox);
        console.log('Label found:', !!label);
        
        if (checkbox) {
            console.log('Current state:', checkbox.checked);
            checkbox.checked = !checkbox.checked;
            console.log('New state:', checkbox.checked);
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            this.addMessage(`Toggle test: ${checkbox.checked ? 'ON' : 'OFF'}`, 'ai');
        } else {
            this.addMessage('Toggle test failed: checkbox not found', 'ai');
        }
    }
    
    debugElements() {
        console.log('=== DEBUG ELEMENTS ===');
        console.log('include-page-content checkbox:', document.getElementById('include-page-content'));
        console.log('All toggle labels:', document.querySelectorAll('.toggle-label'));
        console.log('All checkboxes:', document.querySelectorAll('input[type="checkbox"]'));
        console.log('All toggle sliders:', document.querySelectorAll('.toggle-slider'));
        console.log('====================');
    }

    cleanup() {
        // Clear any pending timeouts
        if (this.inputTimeout) {
            clearTimeout(this.inputTimeout);
            this.inputTimeout = null;
        }
    }

    // Prompt Library Methods
    async loadPrompts() {
        try {
            const result = await chrome.storage.sync.get(['prompts']);
            this.prompts = result.prompts || this.getDefaultPrompts();
            await this.savePrompts();
        } catch (error) {
            console.error('Error loading prompts:', error);
            this.prompts = this.getDefaultPrompts();
        }
    }

    async savePrompts() {
        try {
            await chrome.storage.sync.set({ prompts: this.prompts });
        } catch (error) {
            console.error('Error saving prompts:', error);
        }
    }

    generatePromptTitle(content) {
        // If content has multiple lines, use the first line as title
        const lines = content.trim().split('\n');
        if (lines.length > 1) {
            // Use first line as title, clean up punctuation
            const firstLine = lines[0].trim();
            return firstLine.replace(/[.,!?;:]+$/, '');
        }
        
        // For single line content, take first 3-4 words, remove "please" if it's the first word, and clean up punctuation
        let words = content.trim().split(/\s+/).slice(0, 4);
        
        // Remove "please" if it's the first word
        if (words[0].toLowerCase() === 'please') {
            words = words.slice(1);
        }
        
        // Clean up punctuation and capitalize
        const cleanWords = words.map(word => {
            // Remove punctuation from the end
            const cleanWord = word.replace(/[.,!?;:]+$/, '');
            return cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase();
        });
        
        return cleanWords.join(' ');
    }

    getDefaultPrompts() {
        return [
            {
                id: 'summarize-page',
                content: 'Concise Summary\n\nProvide a concise summary of the main points and key information from the provided text.'
            },
            {
                id: 'explain-selected',
                content: 'Explain Text\n\nExplain the meaning and context of the selected text in simple terms.'
            },
            {
                id: 'fix-grammar',
                content: 'Fix Grammar\n\nCheck and correct any grammar, spelling, or punctuation errors in the selected text.'
            }
        ];
    }

    renderPrompts() {
        const promptsList = document.getElementById('prompts-list');
        if (!promptsList) return;

        promptsList.innerHTML = '';

        this.prompts.forEach(prompt => {
            const promptElement = this.createPromptElement(prompt);
            promptsList.appendChild(promptElement);
        });
    }

    createPromptElement(prompt) {
        const div = document.createElement('div');
        div.className = 'prompt-item';
        div.dataset.promptId = prompt.id;
        
        div.innerHTML = `
            <div class="prompt-header">
                <div class="prompt-title">${this.generatePromptTitle(prompt.content)}</div>
                <div class="prompt-controls">
                    <button class="prompt-control-btn edit" data-action="edit" title="Edit Prompt">Edit</button>
                    <button class="prompt-control-btn delete" data-action="delete" title="Delete Prompt">Delete</button>
                </div>
            </div>
            <div class="prompt-content">${prompt.content}</div>
        `;

        // Add event listeners
        div.querySelectorAll('.prompt-control-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                this.handlePromptAction(action, prompt.id);
            });
        });

        // Add click to use prompt
        div.addEventListener('click', () => {
            this.usePrompt(prompt);
        });

        return div;
    }

    renderFavorites() {
        const favoritesGrid = document.getElementById('favorites-grid');
        if (!favoritesGrid) return;

        favoritesGrid.innerHTML = '';

        if (this.prompts.length === 0) {
            favoritesGrid.innerHTML = '<div style="color: #6c757d; font-size: 0.75rem; text-align: center; padding: 10px;">No prompts yet. Add some prompts in the Prompts tab.</div>';
            return;
        }

        this.prompts.forEach(prompt => {
            const btn = document.createElement('button');
            btn.className = 'favorite-prompt-btn';
            btn.textContent = this.generatePromptTitle(prompt.content);
            btn.title = prompt.content;
            btn.addEventListener('click', () => this.usePromptAndExecute(prompt));
            favoritesGrid.appendChild(btn);
        });
    }

    handlePromptAction(action, promptId) {
        const prompt = this.prompts.find(p => p.id === promptId);
        if (!prompt) return;

        switch (action) {
            case 'edit':
                this.editPrompt(prompt);
                break;
            case 'delete':
                this.deletePrompt(promptId);
                break;
        }
    }

    usePrompt(prompt) {
        // Switch to chat tab
        const chatTab = document.querySelector('[data-tab="chat"]');
        if (chatTab) {
            chatTab.click();
        }

        // Process the prompt with variables
        let processedContent = prompt.content;
        
        if (prompt.variables.includes('SelectedText') && this.selectedText.trim()) {
            processedContent = processedContent.replace(/\{SelectedText\}/g, this.selectedText);
        }
        
        if (prompt.variables.includes('PageContent')) {
            // We'll get page content when sending
            processedContent = processedContent.replace(/\{PageContent\}/g, '[Page content will be included]');
        }

        // Set the chat input
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.value = processedContent;
            chatInput.focus();
        }
    }

    async usePromptAndExecute(prompt) {
        // Switch to chat tab
        const chatTab = document.querySelector('[data-tab="chat"]');
        if (chatTab) {
            chatTab.click();
        }

        // Ensure content script is available and get fresh selected text
        try {
            await this.ensureContentScriptInjected();
            const freshSelectedText = await this.getSelectedText();
            console.log('Fresh selected text for prompt:', freshSelectedText ? `"${freshSelectedText}"` : 'None');
        } catch (error) {
            console.log('Could not get fresh selected text:', error);
        }

        // Set the chat input and execute immediately
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.value = prompt.content;
            
            // Trigger the send button click after a short delay
            setTimeout(() => {
                const sendButton = document.getElementById('send-button');
                if (sendButton) {
                    sendButton.click();
                }
            }, 100);
        }
    }

    showAddPromptModal() {
        this.openPromptModal();
    }

    openPromptModal(promptToEdit = null) {
        const modal = document.getElementById('prompt-modal');
        const title = document.getElementById('modal-title');
        const textarea = document.getElementById('prompt-content-input');
        
        if (promptToEdit) {
            title.textContent = 'Edit Prompt';
            textarea.value = promptToEdit.content;
        } else {
            title.textContent = 'Add New Prompt';
            textarea.value = '';
        }
        
        modal.style.display = 'flex';
        textarea.focus();
        
        // Store the prompt being edited
        this.editingPrompt = promptToEdit;
    }

    closePromptModal() {
        const modal = document.getElementById('prompt-modal');
        modal.style.display = 'none';
        this.editingPrompt = null;
    }

    savePromptFromModal() {
        const textarea = document.getElementById('prompt-content-input');
        const content = textarea.value.trim();
        
        if (!content) {
            alert('Please enter prompt instructions.');
            return;
        }

        if (this.editingPrompt) {
            // Edit existing prompt
            this.editingPrompt.content = content;
        } else {
            // Create new prompt
            const newPrompt = {
                id: 'custom-' + Date.now(),
                content: content
            };
            this.prompts.push(newPrompt);
        }

        this.savePrompts();
        this.renderPrompts();
        this.renderFavorites();
        this.closePromptModal();
    }

    editPrompt(prompt) {
        this.openPromptModal(prompt);
    }

    deletePrompt(promptId) {
        if (confirm('Are you sure you want to delete this prompt?')) {
            this.prompts = this.prompts.filter(p => p.id !== promptId);
            this.savePrompts();
            this.renderPrompts();
            this.renderFavorites();
        }
    }
}

// Initialize the AI Page Assistant immediately
console.log('About to create AIPageAssistant instance...');
const assistant = new AIPageAssistant();

// Expose debug methods globally for testing
window.debugAssistant = assistant;
window.debugElements = () => assistant.debugElements();