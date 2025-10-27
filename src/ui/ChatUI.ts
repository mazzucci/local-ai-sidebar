import { ChatManager } from '../managers/ChatManager.js';
import { RAGManager } from '../managers/RAGManager.js';
import { SettingsManager } from '../managers/SettingsManager.js';
import { LLM_ROLE } from '../config/settings.js';
import { logger } from "../utils/logger.js";

export interface ChatUIProps {
  onMessageSent?: () => void; // Optional notification when message is sent
}

export class ChatUI {
  private chatManager: ChatManager;
  private ragManager: RAGManager;
  private settingsManager: SettingsManager;
  private logger = logger.createModuleLogger('ChatUI');
  private props: ChatUIProps;

  constructor(
    chatManager: ChatManager,
    ragManager: RAGManager,
    settingsManager: SettingsManager,
    props?: ChatUIProps
  ) {
    this.chatManager = chatManager;
    this.ragManager = ragManager;
    this.settingsManager = settingsManager;
    this.props = props || {};
  }

  async init(): Promise<void> {
    try {
      this.setupEventListeners();
      this.setupQuickPromptsListeners();
      
      // Initialize chat history
      this.chatManager.addWelcomeMessageIfNeeded();
      const chatHistory = this.chatManager.getAllMessages();
      if (chatHistory.length > 0) {
        this.renderChatHistory(chatHistory);
      }
    } catch (error) {
      this.logger.error('ChatUI initialization failed:', error);
      throw error;
    }
  }

  private setupQuickPromptsListeners(): void {
    // Use event delegation for dynamically created quick prompt buttons
    const favoritesGrid = document.getElementById('favorites-grid');
    if (favoritesGrid) {
      favoritesGrid.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('favorite-prompt-btn')) {
          const promptContent = target.getAttribute('data-prompt-content');
          if (promptContent) {
            this.usePrompt(promptContent);
          }
        }
      });
    }
  }

  private setupEventListeners(): void {
    // Chat input and send button
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    const sendButton = document.getElementById('send-button') as HTMLButtonElement;

    if (sendButton) {
      sendButton.addEventListener('click', () => {
        this.handleSendMessage();
      });
    }

    if (chatInput) {
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSendMessage();
        }
      });
    }

    // Clear button - handle directly
    const clearButton = document.getElementById('clear-chat-btn');
    if (clearButton) {
      clearButton.addEventListener('click', () => {
        this.clearChatInput();
      });
    }

    // New chat button - handle directly
    const newChatBtn = document.getElementById('new-chat-btn');
    if (newChatBtn) {
      newChatBtn.addEventListener('click', () => {
        this.startNewChat();
      });
    }
  }

  private async handleSendMessage(): Promise<void> {
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    if (!chatInput) return;

    const message = chatInput.value.trim();
    if (!message) return;

    // Clear input immediately
    chatInput.value = '';

    this.logger.debug('Handling send message:', message);

    // Add user message to chat
    this.chatManager.addMessage(message, LLM_ROLE.USER);

    // Show thinking indicator
    this.showThinkingIndicator();

    try {
      const settings = this.settingsManager.getSettings();
      
      // Generate response using RAGManager
      const ragResponse = await this.ragManager.generateResponse(message, settings);
      
      this.hideThinkingIndicator();
      
      // Add response to chat
      this.chatManager.addMessage(ragResponse.content, LLM_ROLE.ASSISTANT);
      
      // Re-render UI from manager state
      const messages = this.chatManager.getAllMessages();
      this.renderChatHistory(messages);

      // Notify parent if callback exists
      if (this.props.onMessageSent) {
        this.props.onMessageSent();
      }
    } catch (error) {
      this.logger.error('Error sending message:', error);
      this.hideThinkingIndicator();
      
      // Add error message to manager
      this.chatManager.addMessage('Sorry, I encountered an error. Please try again.', LLM_ROLE.ASSISTANT);
      
      // Re-render UI from manager state
      const messages = this.chatManager.getAllMessages();
      this.renderChatHistory(messages);
    }
  }

  addMessage(content: string, sender: 'user' | 'assistant'): void {
    const chatContainer = document.getElementById('chat-messages');
    if (!chatContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    if (sender === LLM_ROLE.USER) {
      contentDiv.textContent = content;
    } else {
      contentDiv.innerHTML = `<strong>Local AI:</strong> ${this.formatMessage(content)}`;
    }

    messageDiv.appendChild(contentDiv);
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  renderChatHistory(messages: any[]): void {
    const chatContainer = document.getElementById('chat-messages');
    if (!chatContainer) return;

    // Clear existing messages (except welcome message)
    const welcomeMessage = chatContainer.querySelector('.welcome-message');
    chatContainer.innerHTML = '';
    
    // Re-add welcome message if it existed
    if (welcomeMessage) {
      chatContainer.appendChild(welcomeMessage);
    }

    // Render all messages from history
    messages.forEach(message => {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${message.sender}-message`;

      const contentDiv = document.createElement('div');
      contentDiv.className = 'message-content';

      if (message.sender === LLM_ROLE.USER) {
        contentDiv.textContent = message.content;
      } else {
        contentDiv.innerHTML = `<strong>Local AI:</strong> ${this.formatMessage(message.content)}`;
      }

      messageDiv.appendChild(contentDiv);
      chatContainer.appendChild(messageDiv);
    });

    // Scroll to bottom to show latest messages
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  private formatMessage(content: string): string {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }


  showThinkingIndicator(): void {
    const chatContainer = document.getElementById('chat-messages');
    if (!chatContainer) return;

    const thinkingDiv = document.createElement('div');
    thinkingDiv.id = 'thinking-indicator';
    thinkingDiv.className = 'message ai-message';
    thinkingDiv.innerHTML = `
      <div class="message-content">
        <strong>Local AI:</strong> 
        <span class="thinking-text">Thinking</span>
      </div>
    `;

    chatContainer.appendChild(thinkingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  hideThinkingIndicator(): void {
    const thinkingIndicator = document.getElementById('thinking-indicator');
    if (thinkingIndicator) {
      thinkingIndicator.remove();
    }
  }

  // Chat input manipulation methods
  clearChatInput(): void {
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    if (chatInput) {
      chatInput.value = '';
      chatInput.focus();
    }
  }

  getChatInputValue(): string {
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    return chatInput ? chatInput.value.trim() : '';
  }

  setChatInputValue(value: string): void {
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    if (chatInput) {
      chatInput.value = value;
      chatInput.focus();
    }
  }

  focusChatInput(): void {
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    if (chatInput) {
      chatInput.focus();
    }
  }

  clearChatMessages(): void {
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
      chatMessages.innerHTML = '';
    }
  }

  // Public method to send a message programmatically (e.g., from prompts)
  async sendMessage(message: string): Promise<void> {
    if (!message || !message.trim()) return;
    
    // Add user message to chat
    this.chatManager.addMessage(message, LLM_ROLE.USER);

    // Show thinking indicator
    this.showThinkingIndicator();

    try {
      const settings = this.settingsManager.getSettings();
      
      // Generate response using RAGManager
      const ragResponse = await this.ragManager.generateResponse(message, settings);
      
      this.hideThinkingIndicator();
      
      // Add response to chat
      this.chatManager.addMessage(ragResponse.content, LLM_ROLE.ASSISTANT);
      
      // Re-render UI from manager state
      const messages = this.chatManager.getAllMessages();
      this.renderChatHistory(messages);

      // Notify parent if callback exists
      if (this.props.onMessageSent) {
        this.props.onMessageSent();
      }
    } catch (error) {
      this.logger.error('Error sending message:', error);
      this.hideThinkingIndicator();
      
      // Add error message to manager
      this.chatManager.addMessage('Sorry, I encountered an error. Please try again.', LLM_ROLE.ASSISTANT);
      
      // Re-render UI from manager state
      const messages = this.chatManager.getAllMessages();
      this.renderChatHistory(messages);
    }
  }

  // Public method to start a new chat session
  startNewChat(): void {
    // Clear chat history in manager
    this.chatManager.clearChatHistory();
    
    // Clear UI
    this.clearChatMessages();
    this.clearChatInput();
    
    // Add welcome message
    this.chatManager.addWelcomeMessageIfNeeded();
    
    // Re-render from manager state
    const messages = this.chatManager.getAllMessages();
    this.renderChatHistory(messages);
  }

  // Public method to use a prompt (combine with current input and send)
  async usePrompt(promptContent: string): Promise<void> {
    // Get current input and combine with prompt if needed
    const currentContent = this.getChatInputValue();
    const messageToSend = currentContent 
      ? `${promptContent}\n\n${currentContent}` 
      : promptContent;
    
    // Clear input
    this.clearChatInput();
    
    // Send the combined message
    await this.sendMessage(messageToSend);
  }
}
