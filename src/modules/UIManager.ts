import { TemplateManager } from './TemplateManager.js';
import { debugError } from '../utils/debug.js';

export class UIManager {

  constructor() {
    TemplateManager.loadTemplates();
  }

  async initialize(): Promise<void> {
    this.setupEventListeners();
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

      chatInput.addEventListener('focus', () => {
        // Chat input focused
      });

      chatInput.addEventListener('click', () => {
        // Chat input clicked
      });
    }

    // Clear button
    const clearButton = document.getElementById('clear-chat-btn');
    if (clearButton) {
      clearButton.addEventListener('click', () => {
        this.handleClearChat();
      });
    }

    // Settings controls
    const temperatureSlider = document.getElementById('temperature') as HTMLInputElement;
    const topkSlider = document.getElementById('topk') as HTMLInputElement;

    if (temperatureSlider) {
      temperatureSlider.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        this.updateParameterDisplay('temperature', parseFloat(target.value));
      });
    }

    if (topkSlider) {
      topkSlider.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        this.updateParameterDisplay('topk', parseInt(target.value));
      });
    }

    // New chat button
    const newChatBtn = document.getElementById('new-chat-btn');
    if (newChatBtn) {
      newChatBtn.addEventListener('click', () => {
        this.handleNewChat();
      });
    }

    // Tab switching
    this.setupTabSwitching();

    // Prompt library event listeners
    this.setupPromptLibraryListeners();
  }

  private setupPromptLibraryListeners(): void {
    // Add New Prompt button
    const addPromptBtn = document.getElementById('add-prompt-btn');
    if (addPromptBtn) {
      addPromptBtn.addEventListener('click', () => {
        this.handleAddPrompt();
      });
    }

    // Edit and Delete buttons (using event delegation since they're dynamically created)
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      if (target.classList.contains('prompt-edit-btn')) {
        const promptId = target.getAttribute('data-prompt-id');
        if (promptId) {
          this.handleEditPrompt(promptId);
        }
      }
      
      if (target.classList.contains('prompt-delete-btn')) {
        const promptId = target.getAttribute('data-prompt-id');
        if (promptId) {
          this.handleDeletePrompt(promptId);
        }
      }
    });
  }

  private setupTabSwitching(): void {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');
        
        // Remove active class from all buttons and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked button
        button.classList.add('active');
        
        // Show corresponding content
        if (targetTab) {
          const targetContent = document.getElementById(`${targetTab}-tab`);
          if (targetContent) {
            targetContent.classList.add('active');
          }
        }
      });
    });
  }

  switchToTab(tabName: string): void {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Find the target tab button
    const targetButton = document.querySelector(`[data-tab="${tabName}"]`) as HTMLElement;
    if (!targetButton) return;
    
    // Remove active class from all buttons and contents
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to target button
    targetButton.classList.add('active');
    
    // Show corresponding content
    const targetContent = document.getElementById(`${tabName}-tab`);
    if (targetContent) {
      targetContent.classList.add('active');
    }
  }

  private handleAddPrompt(): void {
    // Dispatch custom event for LocalAI to handle
    const event = new CustomEvent('addPrompt');
    document.dispatchEvent(event);
  }

  private handleEditPrompt(promptId: string): void {
    // Dispatch custom event for LocalAI to handle
    const event = new CustomEvent('editPrompt', { detail: { promptId } });
    document.dispatchEvent(event);
  }

  private handleDeletePrompt(promptId: string): void {
    // Dispatch custom event for LocalAI to handle
    const event = new CustomEvent('deletePrompt', { detail: { promptId } });
    document.dispatchEvent(event);
  }

  private handleNewChat(): void {
    // Dispatch custom event for LocalAI to handle
    const event = new CustomEvent('newChat');
    document.dispatchEvent(event);
  }

  private handleSendMessage(): void {
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    if (!chatInput) return;

    const message = chatInput.value.trim();
    if (!message) return;

    // Dispatch custom event for other modules to handle
    const event = new CustomEvent('sendMessage', { 
      detail: { message } 
    });
    document.dispatchEvent(event);

    chatInput.value = '';
  }

  private handleClearChat(): void {
    const event = new CustomEvent('clearChat');
    document.dispatchEvent(event);
  }

  showSplashScreen(): void {
    const splash = document.getElementById('loading-splash');
    if (splash) {
      splash.style.display = 'flex';
    }
  }

  hideSplashScreen(): void {
    const splash = document.getElementById('loading-splash');
    if (splash) {
      splash.style.display = 'none';
    }
  }

  updateSplashStatus(message: string): void {
    const statusText = document.getElementById('splash-status-text');
    if (statusText) {
      statusText.textContent = message;
    }
  }

  showSplashDownloadOption(): void {
    const splashContent = document.querySelector('.splash-content');
    if (!splashContent) return;

    const downloadElement = TemplateManager.createElementFromTemplate('splash-download-template');
    if (!downloadElement) return;

    downloadElement.className = 'splash-download-section';

    // Remove existing download section
    const existingDownload = splashContent.querySelector('.splash-download-section');
    if (existingDownload) {
      existingDownload.remove();
    }

    splashContent.appendChild(downloadElement);

    // Add event listeners
    const downloadBtn = document.getElementById('splash-download-btn');
    const continueBtn = document.getElementById('splash-continue-btn');

    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        const event = new CustomEvent('startDownload');
        document.dispatchEvent(event);
      });
    }

    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        this.hideSplashScreen();
      });
    }
  }

  showSplashProgress(): void {
    const splashContent = document.querySelector('.splash-content');
    if (!splashContent) return;

    const progressElement = TemplateManager.createElementFromTemplate('splash-progress-template');
    if (!progressElement) return;

    progressElement.className = 'splash-progress-section';

    // Remove existing sections
    const existingDownload = splashContent.querySelector('.splash-download-section');
    const existingProgress = splashContent.querySelector('.splash-progress-section');
    if (existingDownload) existingDownload.remove();
    if (existingProgress) existingProgress.remove();

    splashContent.appendChild(progressElement);

    // Add event listener for download progress updates
    document.addEventListener('downloadProgressUpdate', (e: any) => {
      this.updateDownloadProgress(e.detail.progress, e.detail.loaded, e.detail.total);
    });

    // Add event listener for check button
    const checkBtn = document.getElementById('splash-check-progress-btn');
    if (checkBtn) {
      checkBtn.addEventListener('click', () => {
        const event = new CustomEvent('checkDownloadProgress');
        document.dispatchEvent(event);
      });
    }

    // Start with 0% progress
    this.updateDownloadProgress(0, 0, 0);
  }

  private updateDownloadProgress(progress: number, loaded: number, total: number): void {
    const progressFill = document.querySelector('.splash-progress-fill') as HTMLElement;
    const progressStatus = document.querySelector('.splash-progress-status') as HTMLElement;
    
    if (progressFill) {
      progressFill.style.width = `${progress}%`;
    }
    
    if (progressStatus) {
      if (progress === 0) {
        progressStatus.textContent = 'Preparing download...';
      } else if (progress === 100) {
        progressStatus.textContent = 'Download complete! Finalizing...';
      } else {
        const loadedMB = Math.round(loaded / (1024 * 1024));
        const totalMB = Math.round(total / (1024 * 1024));
        progressStatus.textContent = `Downloading... ${progress}% (${loadedMB}MB / ${totalMB}MB)`;
      }
    }
  }

  addMessage(content: string, sender: 'user' | 'ai'): void {
    const chatContainer = document.getElementById('chat-messages');
    if (!chatContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    if (sender === 'user') {
      contentDiv.textContent = content;
    } else {
      contentDiv.innerHTML = `<strong>Local AI:</strong> ${this.formatMessage(content)}`;
    }

    messageDiv.appendChild(contentDiv);
    chatContainer.appendChild(messageDiv);
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

  renderPrompts(prompts: any[]): void {
    const favoritesGrid = document.querySelector('.favorites-grid');
    if (!favoritesGrid) return;

    favoritesGrid.innerHTML = '';
    
    prompts.forEach(prompt => {
      const button = document.createElement('button');
      button.className = 'favorite-prompt-btn';
      button.textContent = prompt.title;
      button.addEventListener('click', () => {
        const event = new CustomEvent('usePrompt', { detail: { prompt } });
        document.dispatchEvent(event);
      });
      
      favoritesGrid.appendChild(button);
    });
  }

  renderPromptsLibrary(prompts: any[]): void {
    const promptsList = document.getElementById('prompts-list');
    if (!promptsList) return;

    promptsList.innerHTML = '';
    
    prompts.forEach(prompt => {
      const promptCard = document.createElement('div');
      promptCard.className = 'prompt-card';
      
      promptCard.innerHTML = `
        <div class="prompt-header">
          <h4>${prompt.title}</h4>
          <div class="prompt-actions">
            <button class="prompt-edit-btn" data-prompt-id="${prompt.id}">Edit</button>
            <button class="prompt-delete-btn" data-prompt-id="${prompt.id}">Delete</button>
          </div>
        </div>
        <div class="prompt-content">
          <p>${prompt.content}</p>
        </div>
      `;
      
      promptsList.appendChild(promptCard);
    });
  }

  updateParameterDisplay(param: string, value: number): void {
    const valueElement = document.getElementById(`${param}-value`);
    if (valueElement) {
      valueElement.textContent = value.toString();
    }
  }

  updateModelStatusDisplay(status: string, message?: string): void {
    const statusInfo = document.getElementById('model-status-info');
    if (!statusInfo) return;

    let statusText = '';
    let statusColor = '#6c757d';

    switch (status) {
      case 'available':
        statusText = '✅ AI model is ready and available';
        statusColor = '#28a745';
        break;
      case 'downloadable':
        statusText = '📥 AI model needs to be downloaded';
        statusColor = '#ffc107';
        break;
      case 'downloading':
        statusText = '⏳ AI model is downloading...';
        statusColor = '#17a2b8';
        break;
      case 'error':
        statusText = '❌ AI model is not available';
        statusColor = '#dc3545';
        break;
      case 'checking':
        statusText = '🔍 Checking model availability...';
        statusColor = '#6c757d';
        break;
      default:
        statusText = message || 'Unknown status';
    }

    statusInfo.innerHTML = `<p style="color: ${statusColor}; font-weight: bold;">${statusText}</p>`;
  }

  updateModelParamsDisplay(params: any): void {
    const paramsInfo = document.getElementById('model-params-info');
    if (!paramsInfo) return;

    if (typeof params === 'string') {
      paramsInfo.innerHTML = `<p style="color: #dc3545;">${params}</p>`;
      return;
    }

    const html = TemplateManager.renderTemplate('model-params-template', params);
    paramsInfo.innerHTML = html;
  }

  updateStatus(message: string): void {
    const statusElement = document.getElementById('status-message');
    if (statusElement) {
      statusElement.textContent = message;
      
      // Add confirmation animation
      statusElement.style.opacity = '1';
      setTimeout(() => {
        statusElement.style.opacity = '0.7';
      }, 2000);
    }
  }

}
