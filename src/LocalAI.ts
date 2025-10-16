import { Prompt } from './types/index.js';
import { ChatManager } from './modules/ChatManager.js';
import { PromptManager } from './modules/PromptManager.js';
import { SettingsManager } from './modules/SettingsManager.js';
import { UIManager } from './modules/UIManager.js';
import { debugLog, debugError } from './utils/debug.js';

export class LocalAI {
  private chatManager: ChatManager;
  private promptManager: PromptManager;
  private settingsManager: SettingsManager;
  private uiManager: UIManager;
  private session: any = null;

  constructor() {
    debugLog('LocalAI constructor called');
    
    this.chatManager = new ChatManager();
    this.promptManager = new PromptManager();
    this.settingsManager = new SettingsManager();
    this.uiManager = new UIManager();
    
    this.init();
  }

  private async init(): Promise<void> {
    debugLog('LocalAI init started');
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize UI components
    await this.uiManager.initialize();
    
    // Show splash screen and start loading
    this.uiManager.showSplashScreen();
    
    // Check model availability
    await this.checkModelAvailability();
    
    // Initialize prompt library
    this.renderPrompts();
    this.renderQuickPrompts();
    
    debugLog('LocalAI init completed');
  }

  private setupEventListeners(): void {
    // Custom events from UIManager
    document.addEventListener('sendMessage', (e: any) => {
      this.handleSendMessage(e.detail.message);
    });

    document.addEventListener('clearChat', () => {
      this.handleClearChat();
    });

    document.addEventListener('usePrompt', (e: any) => {
      this.handleUsePrompt(e.detail.prompt);
    });

    document.addEventListener('addPrompt', () => {
      this.handleAddPrompt();
    });

    document.addEventListener('editPrompt', (e: any) => {
      this.handleEditPrompt(e.detail.promptId);
    });

    document.addEventListener('deletePrompt', (e: any) => {
      this.handleDeletePrompt(e.detail.promptId);
    });

    document.addEventListener('startDownload', () => {
      this.startDownloadFromSplash();
    });

    document.addEventListener('checkDownloadProgress', () => {
      this.checkModelAvailability();
    });

    document.addEventListener('newChat', () => {
      this.handleNewChat();
    });
  }

  private async checkModelAvailability(): Promise<void> {
    try {
      this.uiManager.updateSplashStatus('Checking AI model availability...');
      this.uiManager.updateModelStatusDisplay('checking');
      
      const status = await this.settingsManager.checkModelAvailability();
      
      switch (status) {
        case 'available':
          this.uiManager.updateSplashStatus('✅ AI model ready!');
          this.uiManager.updateModelStatusDisplay('available');
          await this.initializeSession();
          this.uiManager.hideSplashScreen();
          break;
          
        case 'downloadable':
          this.uiManager.updateSplashStatus('📥 Model download required');
          this.uiManager.updateModelStatusDisplay('downloadable');
          this.uiManager.showSplashDownloadOption();
          break;
          
        case 'downloading':
          this.uiManager.updateSplashStatus('⏳ Model downloading...');
          this.uiManager.updateModelStatusDisplay('downloading');
          this.uiManager.showSplashProgress();
          break;
          
        case 'error':
          this.uiManager.updateSplashStatus('❌ AI model not available. Please check Chrome version and AI settings.');
          this.uiManager.updateModelStatusDisplay('error');
          this.showErrorHelp();
          break;
      }
    } catch (error) {
      debugError('Error checking model availability:', error);
      this.uiManager.updateSplashStatus('❌ Error checking model availability');
      this.uiManager.updateModelStatusDisplay('error', 'Error checking model availability');
      this.showErrorHelp();
    }
  }

  private showErrorHelp(): void {
    const splashContent = document.querySelector('.splash-content');
    if (!splashContent) return;

    const helpSection = document.createElement('div');
    helpSection.className = 'splash-help-section';
    helpSection.innerHTML = `
      <div class="splash-help-content">
        <h4>🔧 Troubleshooting</h4>
        <p>The Chrome AI API might not be available. Try these steps:</p>
        <ul>
          <li>✅ Make sure you're using Chrome 138+</li>
          <li>✅ Enable AI features in chrome://flags</li>
          <li>✅ Check chrome://on-device-internals for AI status</li>
          <li>✅ Try refreshing the extension</li>
        </ul>
        <p><strong>Chrome Flags to enable:</strong></p>
        <ul>
          <li>#on-device-model</li>
          <li>#optimization-guide-on-device-model</li>
        </ul>
        <button id="splash-continue-anyway-btn" class="splash-continue-button">
          Continue Anyway
        </button>
      </div>
    `;

    // Remove existing help section
    const existingHelp = splashContent.querySelector('.splash-help-section');
    if (existingHelp) {
      existingHelp.remove();
    }

    splashContent.appendChild(helpSection);

    // Add event listener
    const continueBtn = document.getElementById('splash-continue-anyway-btn');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        this.uiManager.hideSplashScreen();
      });
    }
  }

  private async initializeSession(): Promise<void> {
    try {
      if (!('LanguageModel' in window)) {
        debugLog('LanguageModel not available, running in demo mode');
        this.addWelcomeMessage();
        this.uiManager.hideSplashScreen();
        return;
      }

      // Get conversation history for initial prompts
      const conversationHistory = this.buildConversationHistory();
      
      const modelOptions = {
        language: 'en' as const,
        outputLanguage: 'en' as const,
        initialPrompts: conversationHistory
      };

      this.session = await (window as any).LanguageModel.create(modelOptions);
      debugLog('AI session initialized successfully with conversation history');
      
      // Load model parameters
      await this.settingsManager.loadModelParameters();
      
      // Update model parameters display
      const modelParams = this.settingsManager.getModelParameters();
      debugLog('Model parameters received:', modelParams);
      if (modelParams) {
        this.uiManager.updateModelParamsDisplay(modelParams);
      } else {
        this.uiManager.updateModelParamsDisplay('Model parameters not available');
      }
      
      // Add welcome message
      this.addWelcomeMessage();
      
    } catch (error) {
      debugError('Error initializing session:', error);
      debugLog('Running in demo mode due to AI initialization error');
      
      // Update model parameters display with error message
      this.uiManager.updateModelParamsDisplay('Model parameters not available - running in demo mode');
      
      this.addWelcomeMessage();
      this.uiManager.hideSplashScreen();
    }
  }

  private async startDownloadFromSplash(): Promise<void> {
    try {
      this.uiManager.showSplashProgress();
      
      const success = await this.settingsManager.downloadModel();
      if (success) {
        this.uiManager.updateModelStatusDisplay('available');
        await this.initializeSession();
        this.uiManager.hideSplashScreen();
      } else {
        this.uiManager.updateSplashStatus('❌ Download failed. Please try again.');
        this.uiManager.updateModelStatusDisplay('error', 'Download failed');
      }
    } catch (error) {
      debugError('Error starting download:', error);
      this.uiManager.updateSplashStatus('❌ Download failed. Please try again.');
      this.uiManager.updateModelStatusDisplay('error', 'Download failed');
    }
  }

  private async handleSendMessage(message: string): Promise<void> {
    debugLog('handleSendMessage called with:', message);
    
    if (!this.session) {
      debugLog('No session available, showing demo response');
      this.chatManager.addMessage(message, 'user');
      this.uiManager.addMessage(message, 'user');
      
      // Demo response when AI is not available
      const demoResponse = `I'm running in demo mode because the Chrome AI API is not available. 

To enable full AI functionality:
1. Make sure you're using Chrome 138+
2. Enable these flags in chrome://flags:
   - #on-device-model
   - #optimization-guide-on-device-model
3. Restart Chrome
4. Reload this extension

Your message was: "${message}"`;
      
      this.chatManager.addMessage(demoResponse, 'ai');
      this.uiManager.addMessage(demoResponse, 'ai');
      return;
    }

    // Add user message to chat
    this.chatManager.addMessage(message, 'user');
    this.uiManager.addMessage(message, 'user');

    // Show thinking indicator
    this.uiManager.showThinkingIndicator();

    try {
      const settings = this.settingsManager.getSettings();
      
      // Send to Gemini Nano using the proper conversation format
      const response = await this.session.prompt([
        {
          role: 'user',
          content: message
        }
      ], {
        temperature: settings.temperature,
        topK: settings.topK
      });

      this.uiManager.hideThinkingIndicator();
      
      debugLog('AI Response:', response);
      this.chatManager.addMessage(response, 'ai');
      this.uiManager.addMessage(response, 'ai');
    } catch (error) {
      debugError('Error sending message:', error);
      this.uiManager.hideThinkingIndicator();
      this.uiManager.addMessage('Sorry, I encountered an error. Please try again.', 'ai');
    }
  }

  private handleClearChat(): void {
    debugLog('Clear button clicked - clearing chatbox only');
    
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    if (chatInput) {
      chatInput.value = '';
      chatInput.focus();
      debugLog('Chat input cleared');
    }
  }

  private handleNewChat(): void {
    debugLog('New chat button clicked - starting fresh conversation');
    
    // Clear chat history
    this.chatManager.clearChatHistory();
    
    // Clear chat messages UI (not the entire container)
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
      chatMessages.innerHTML = '';
    }
    
    // Clear chat input
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    if (chatInput) {
      chatInput.value = '';
      chatInput.focus();
    }
    
    // Reinitialize session with empty conversation history
    this.initializeSession();
    
    debugLog('New chat session started');
  }

  private handleUsePrompt(prompt: Prompt): void {
    debugLog('Quick prompt clicked, manual paste approach');
    
    // Switch to chat tab
    this.uiManager.switchToTab('chat');

    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    if (chatInput) {
      const currentContent = chatInput.value.trim();
      
      if (currentContent) {
        // If there's existing content, put the prompt instruction first, then the content
        chatInput.value = `${prompt.content}\n\n${currentContent}`;
      } else {
        // If no existing content, just use the prompt
        chatInput.value = prompt.content;
      }
      
      // Focus and send the message directly
      chatInput.focus();
      
      // Send the message directly using the prompt content
      this.handleSendMessage(chatInput.value);
      
      // Clear the input after sending
      chatInput.value = '';
    }
  }

  private addWelcomeMessage(): void {
    const welcomeMessage = 'Hello! I can help you with any content. Type your message below or use the quick prompts above for quick access.\n\n🔒 Privacy: This extension works with content you manually copy and paste. Simply copy any text from any webpage and paste it in the chat input, then use quick prompts or ask questions.';
    this.chatManager.addMessage(welcomeMessage, 'ai');
    this.uiManager.addMessage(welcomeMessage, 'ai');
  }

  private buildConversationHistory(): any[] {
    const messages = this.chatManager.getAllMessages();
    const conversationHistory: any[] = [];
    
    // Add system message
    conversationHistory.push({
      role: 'system',
      content: 'You are a helpful AI assistant that works with content users manually copy and paste. Provide informative and helpful responses about the content they share. Do not suggest page modifications or formatting changes.'
    });
    
    // Convert chat messages to API format
    messages.forEach(msg => {
      conversationHistory.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });
    
    return conversationHistory;
  }

  private renderPrompts(): void {
    const prompts = this.promptManager.getAllPrompts();
    debugLog('Rendering prompts:', prompts.length);
    // Render prompts in the prompts tab
    this.uiManager.renderPromptsLibrary(prompts);
  }

  private renderQuickPrompts(): void {
    const allPrompts = this.promptManager.getAllPrompts();
    debugLog('Rendering all prompts as quick prompts:', allPrompts.length, allPrompts);
    this.uiManager.renderPrompts(allPrompts);
  }

  // Public methods for external access
  public getChatManager(): ChatManager {
    return this.chatManager;
  }

  public getPromptManager(): PromptManager {
    return this.promptManager;
  }

  public getSettingsManager(): SettingsManager {
    return this.settingsManager;
  }

  public getUIManager(): UIManager {
    return this.uiManager;
  }

  // Prompt management methods
  private handleAddPrompt(): void {
    debugLog('Add prompt requested');
    this.showPromptModal();
  }

  private handleEditPrompt(promptId: string): void {
    debugLog('Edit prompt requested:', promptId);
    const prompt = this.promptManager.getPromptById(promptId);
    if (prompt) {
      this.showPromptModal(prompt);
    }
  }

  private handleDeletePrompt(promptId: string): void {
    debugLog('Delete prompt requested:', promptId);
    if (confirm('Are you sure you want to delete this prompt?')) {
      this.promptManager.deletePrompt(promptId);
      this.renderPrompts(); // Refresh the prompts list
      this.renderQuickPrompts(); // Refresh quick prompts
    }
  }

  private showPromptModal(prompt?: any): void {
    const modal = document.getElementById('prompt-modal');
    const titleInput = document.getElementById('prompt-title-input') as HTMLInputElement;
    const contentInput = document.getElementById('prompt-content-input') as HTMLTextAreaElement;
    const modalTitle = document.getElementById('modal-title');
    
    if (!modal || !titleInput || !contentInput || !modalTitle) return;

    if (prompt) {
      // Edit mode
      modalTitle.textContent = 'Edit Prompt';
      titleInput.value = prompt.title;
      contentInput.value = prompt.content;
    } else {
      // Add mode
      modalTitle.textContent = 'Add New Prompt';
      titleInput.value = '';
      contentInput.value = '';
    }

    modal.style.display = 'block';
    titleInput.focus();

    // Set up event listeners
    this.setupModalListeners(prompt);
  }

  private setupModalListeners(editingPrompt?: any): void {
    const modal = document.getElementById('prompt-modal');
    const closeBtn = document.getElementById('modal-close');
    const cancelBtn = document.getElementById('modal-cancel');
    const saveBtn = document.getElementById('modal-save');
    const titleInput = document.getElementById('prompt-title-input') as HTMLInputElement;
    const contentInput = document.getElementById('prompt-content-input') as HTMLTextAreaElement;

    if (!modal || !closeBtn || !cancelBtn || !saveBtn) return;

    const closeModal = () => {
      modal.style.display = 'none';
    };

    // Remove existing event listeners to prevent duplicates
    const newCloseBtn = closeBtn.cloneNode(true) as HTMLButtonElement;
    const newCancelBtn = cancelBtn.cloneNode(true) as HTMLButtonElement;
    const newSaveBtn = saveBtn.cloneNode(true) as HTMLButtonElement;
    
    closeBtn.parentNode?.replaceChild(newCloseBtn, closeBtn);
    cancelBtn.parentNode?.replaceChild(newCancelBtn, cancelBtn);
    saveBtn.parentNode?.replaceChild(newSaveBtn, saveBtn);

    // Close modal events
    newCloseBtn.addEventListener('click', closeModal);
    newCancelBtn.addEventListener('click', closeModal);
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Save prompt
    newSaveBtn.addEventListener('click', () => {
      const title = titleInput.value.trim();
      const content = contentInput.value.trim();

      // Validation
      if (!title) {
        alert('Please enter a prompt title.');
        titleInput.focus();
        return;
      }

      if (!content) {
        alert('Please enter prompt content.');
        contentInput.focus();
        return;
      }

      if (title.length > 100) {
        alert('Prompt title is too long. Please keep it under 100 characters.');
        titleInput.focus();
        return;
      }

      if (editingPrompt) {
        // Update existing prompt
        this.promptManager.updatePrompt(editingPrompt.id, { title, content });
      } else {
        // Add new prompt
        this.promptManager.addPrompt(title, content);
      }

      this.renderPrompts(); // Refresh the prompts list
      this.renderQuickPrompts(); // Refresh quick prompts
      closeModal();
    });
  }
}

// Initialize the Local AI immediately
debugLog('About to create LocalAI instance...');
const assistant = new LocalAI();

// Expose debug methods globally for testing
(window as any).debugAssistant = assistant;
(window as any).debugElements = () => {
  debugLog('=== DEBUG ELEMENTS ===');
  debugLog('include-page-content checkbox:', document.getElementById('include-page-content'));
  debugLog('All toggle labels:', document.querySelectorAll('.toggle-label'));
  debugLog('All checkboxes:', document.querySelectorAll('input[type="checkbox"]'));
  debugLog('All toggle sliders:', document.querySelectorAll('.toggle-slider'));
  debugLog('====================');
};
