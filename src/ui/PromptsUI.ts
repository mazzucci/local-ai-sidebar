import { Prompt } from '../types/index.js';
import { PromptManager } from '../managers/PromptManager.js';
import { logger } from "../utils/logger.js";

export interface PromptsUIProps {
  onPromptsChanged?: () => void; // Notify when prompts are modified
}

export class PromptsUI {
  private logger = logger.createModuleLogger('PromptsUI');
  private props: PromptsUIProps;
  private promptManager: PromptManager;

  constructor(promptManager: PromptManager, props?: PromptsUIProps) {
    this.promptManager = promptManager;
    this.props = props || {};
    this.logger.info('PromptsUI initialized');
  }

  async init(): Promise<void> {
    try {
      this.setupEventListeners();
      
      // Initialize prompts display
      const prompts = this.promptManager.getAllPrompts();
      this.renderPromptsLibrary(prompts);
      this.renderPrompts(prompts);
      this.logger.debug(`Rendered ${prompts.length} prompts`);
      
      this.logger.success('PromptsUI initialization complete');
    } catch (error) {
      this.logger.error('PromptsUI initialization failed:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
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

  private handleAddPrompt(): void {
    this.showModal();
  }

  private handleEditPrompt(promptId: string): void {
    this.logger.debug('Edit prompt requested:', promptId);
    const prompt = this.promptManager.getPromptById(promptId);
    if (prompt) {
      this.showModal(prompt);
    }
  }

  private handleDeletePrompt(promptId: string): void {
    this.logger.debug('Delete prompt requested:', promptId);
    if (confirm('Are you sure you want to delete this prompt?')) {
      this.promptManager.deletePrompt(promptId);
      // Re-render both views
      const allPrompts = this.promptManager.getAllPrompts();
      this.renderPromptsLibrary(allPrompts);
      this.renderPrompts(allPrompts);
      
      // Notify parent that prompts changed
      if (this.props.onPromptsChanged) {
        this.props.onPromptsChanged();
      }
    }
  }

  showModal(prompt?: Prompt): void {
    const modal = document.getElementById('prompt-modal');
    const titleInput = document.getElementById('prompt-title-input') as HTMLInputElement;
    const contentInput = document.getElementById('prompt-content-input') as HTMLTextAreaElement;
    const modalTitle = document.getElementById('modal-title');
    
    if (!modal || !titleInput || !contentInput || !modalTitle) return;

    if (prompt) {
      modalTitle.textContent = 'Edit Prompt';
      titleInput.value = prompt.title;
      contentInput.value = prompt.content;
    } else {
      modalTitle.textContent = 'Add New Prompt';
      titleInput.value = '';
      contentInput.value = '';
    }

    modal.style.display = 'flex';
    titleInput.focus();
    this.setupModalListeners(prompt);
  }

  private setupModalListeners(editingPrompt?: Prompt): void {
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

    // Close modal events (once: true to auto-remove after first use)
    closeBtn.addEventListener('click', closeModal, { once: true });
    cancelBtn.addEventListener('click', closeModal, { once: true });
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    }, { once: true });

    // Save prompt
    saveBtn.addEventListener('click', () => {
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

      // Save or update prompt
      if (editingPrompt) {
        this.promptManager.updatePrompt(editingPrompt.id, { title, content });
      } else {
        this.promptManager.addPrompt(title, content);
      }

      // Re-render both views
      const allPrompts = this.promptManager.getAllPrompts();
      this.renderPromptsLibrary(allPrompts);
      this.renderPrompts(allPrompts);
      
      // Notify parent that prompts changed
      if (this.props.onPromptsChanged) {
        this.props.onPromptsChanged();
      }

      closeModal();
    }, { once: true });
  }

  renderPrompts(prompts: any[]): void {
    const favoritesGrid = document.querySelector('.favorites-grid');
    const favoritesSection = document.getElementById('favorites-section');
    
    if (!favoritesGrid || !favoritesSection) return;

    // Clear the grid
    favoritesGrid.innerHTML = '';
    
    if (prompts.length === 0) {
      // Hide the entire favorites section when no prompts
      favoritesSection.style.display = 'none';
      return;
    }
    
    // Show the favorites section when there are prompts
    favoritesSection.style.display = 'block';
    
    // Render prompt buttons (ChatUI handles click events via event delegation)
    prompts.forEach(prompt => {
      const button = document.createElement('button');
      button.className = 'favorite-prompt-btn';
      button.textContent = prompt.title;
      button.setAttribute('data-prompt-content', prompt.content);
      
      favoritesGrid.appendChild(button);
    });
  }

  renderPromptsLibrary(prompts: any[]): void {
    const promptsList = document.getElementById('prompts-list');
    if (!promptsList) return;

    // Clear the list
    promptsList.innerHTML = '';
    
    if (prompts.length === 0) {
      // Show empty state
      promptsList.innerHTML = `
        <div class="empty-state" id="prompts-empty-state">
          <h4>📚 No Prompts Saved Yet</h4>
          <p>Create custom prompts to speed up your AI interactions</p>
          <div class="empty-state-tips">
            <h5>💡 Tips:</h5>
            <ul>
              <li>Create prompts for common tasks</li>
              <li>Use variables like {{text}} for dynamic content</li>
              <li>Mark favorites for quick access in chat</li>
              <li>Organize prompts with descriptive titles</li>
            </ul>
          </div>
        </div>
      `;
      return;
    }
    
    // Render prompts
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
}
