import { KnowledgeItem } from '../types/index.js';
import { KnowledgeManager } from '../managers/KnowledgeManager.js';
import { logger } from "../utils/logger.js";

export class KnowledgeUI {
  private knowledgeManager: KnowledgeManager;
  private logger = logger.createModuleLogger('KnowledgeUI');

  constructor(knowledgeManager: KnowledgeManager) {
    // KnowledgeUI receives KnowledgeManager (created by LocalAI)
    this.knowledgeManager = knowledgeManager;
  }

  async init(): Promise<void> {
    try {
      this.setupEventListeners();
    } catch (error) {
      this.logger.error('Error during initialization:', error);
      throw error;
    }
  }

  async renderKnowledgeList(): Promise<void> {
    try {
      // Get DOM elements - they should exist when this is called
      const knowledgeListElement = document.getElementById('knowledge-list');
      const emptyStateElement = document.getElementById('knowledge-empty-state');
      
      if (!knowledgeListElement) {
        this.logger.warn('knowledge-list element not found - skipping render');
        return;
      }
      
      // If empty state element is missing, create it dynamically
      let emptyState = emptyStateElement;
      if (!emptyState) {
        this.logger.debug('Empty state element not found, creating dynamically');
        emptyState = this.createEmptyStateElement();
        knowledgeListElement.appendChild(emptyState);
      }
      
      const items = await this.knowledgeManager.getAllKnowledge();
      
      if (items.length === 0) {
        // Show empty state
        knowledgeListElement.innerHTML = '';
        knowledgeListElement.appendChild(emptyState);
        emptyState.style.display = 'block';
      } else {
        // Hide empty state and show items
        emptyState.style.display = 'none';
        knowledgeListElement.innerHTML = ''; // Clear existing list
        
        for (const item of items) {
          const itemElement = await this.renderKnowledgeItem(item);
          knowledgeListElement.appendChild(itemElement);
        }
      }
    } catch (error) {
      this.logger.error('Error rendering knowledge list:', error);
    }
  }

  private createEmptyStateElement(): HTMLElement {
    const emptyStateDiv = document.createElement('div');
    emptyStateDiv.className = 'empty-state';
    emptyStateDiv.id = 'knowledge-empty-state';
    emptyStateDiv.innerHTML = `
      <h4>📚 No Knowledge Added Yet</h4>
      <p>Add any PDFs or text you want your Local AI to know</p>
      <div class="empty-state-tips">
        <h5>💡 Tips:</h5>
        <ul>
          <li>Add PDFs for document analysis</li>
          <li>Add text snippets for quick reference</li>
          <li>Use descriptive titles for better organization</li>
          <li>Ask questions in the chat to use your knowledge</li>
        </ul>
      </div>
    `;
    return emptyStateDiv;
  }


  async renderKnowledgeItem(item: KnowledgeItem): Promise<HTMLElement> {
    const itemDiv = document.createElement('div');
    itemDiv.innerHTML = this.createKnowledgeItemHTML(item);
    
    // Get the actual prompt-card element from the innerHTML
    const promptCard = itemDiv.firstElementChild as HTMLElement;
    if (promptCard) {
      promptCard.dataset.knowledgeId = item.id;
    }
    
    // Event listeners are handled by event delegation in setupEventListeners
    // No need to add individual listeners here
    
    return promptCard || itemDiv;
  }

  setupEventListeners(): void {
    // Add knowledge buttons
    const addTextBtn = document.getElementById('add-text-knowledge-btn');
    const addPdfBtn = document.getElementById('add-pdf-knowledge-btn');
    
    addTextBtn?.addEventListener('click', () => {
      this.showTextModal();
    });
    
    addPdfBtn?.addEventListener('click', () => {
      this.showPDFModal();
    });
    
    // Text modal events
    document.getElementById('knowledge-text-modal-close')?.addEventListener('click', () => 
      this.hideTextModal()
    );
    document.getElementById('knowledge-text-modal-cancel')?.addEventListener('click', () => 
      this.hideTextModal()
    );
    document.getElementById('knowledge-text-modal-save')?.addEventListener('click', () => 
      this.handleTextModalSave()
    );
    
    // PDF modal events
    document.getElementById('knowledge-pdf-modal-close')?.addEventListener('click', () => 
      this.hidePDFModal()
    );
    document.getElementById('knowledge-pdf-modal-cancel')?.addEventListener('click', () => 
      this.hidePDFModal()
    );
    document.getElementById('knowledge-pdf-modal-save')?.addEventListener('click', () => 
      this.handlePDFModalSave()
    );
    
    // Settings
    document.getElementById('chunk-size')?.addEventListener('change', () => 
      this.handleSettingsChange()
    );
    document.getElementById('chunk-overlap')?.addEventListener('change', () => 
      this.handleSettingsChange()
    );
    
    // Event delegation for knowledge item buttons
    document.getElementById('knowledge-list')?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const button = target.closest('button[data-action]') as HTMLButtonElement;
      
      if (!button) return;
      
      const action = button.dataset.action;
      const id = button.dataset.id;
      const title = button.dataset.title;
      
      switch (action) {
        case 'delete':
          if (id && title) {
            this.handleDeleteKnowledge(id, title);
          }
          break;
        default:
          this.logger.debug('Unknown action:', action);
      }
    });
    
  }

  // Modal methods
  private showTextModal(): void {
    this.logger.debug('showTextModal called');
    const modal = document.getElementById('knowledge-text-modal');
    if (modal) {
      // Clear previous values first
      (document.getElementById('knowledge-text-title-input') as HTMLInputElement).value = '';
      (document.getElementById('knowledge-text-content-input') as HTMLTextAreaElement).value = '';
      
      // Show modal
      modal.style.display = 'flex'; // Use flex instead of block to match CSS
    }
  }

  private hideTextModal(): void {
    const modal = document.getElementById('knowledge-text-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  private showPDFModal(): void {
    const modal = document.getElementById('knowledge-pdf-modal');
    if (modal) {
      // Clear previous values first
      (document.getElementById('knowledge-pdf-title-input') as HTMLInputElement).value = '';
      (document.getElementById('knowledge-pdf-file-input') as HTMLInputElement).value = '';
      
      // Show modal
      modal.style.display = 'flex'; // Use flex instead of block to match CSS
    }
  }

  private hidePDFModal(): void {
    const modal = document.getElementById('knowledge-pdf-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  private showPDFProcessingModal(): void {
    const modal = document.getElementById('pdf-processing-modal');
    if (modal) {
      // Reset progress
      this.updatePDFProgress(0, 'Extracting text from PDF...', 0);
      modal.style.display = 'flex';
    }
  }

  private hidePDFProcessingModal(): void {
    const modal = document.getElementById('pdf-processing-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  private updatePDFProgress(percentage: number, status: string, chunksProcessed: number): void {
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const statusText = document.getElementById('processing-status-text');
    const chunksText = document.getElementById('progress-chunks');

    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }
    if (progressText) {
      progressText.textContent = `${Math.round(percentage)}%`;
    }
    if (statusText) {
      statusText.textContent = status;
    }
    if (chunksText) {
      chunksText.textContent = `${chunksProcessed} chunks processed`;
    }
  }

  private async handleTextModalSave(): Promise<void> {
    const titleInput = document.getElementById('knowledge-text-title-input') as HTMLInputElement;
    const contentInput = document.getElementById('knowledge-text-content-input') as HTMLTextAreaElement;
    
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    
    if (!title) {
      this.logger.warn('Please provide a title for the knowledge item.');
      return;
    }
    
    if (!content) {
      this.logger.warn('Please provide content for the knowledge item.');
      return;
    }
    
    try {
      // Close the text modal first
      this.hideTextModal();
      
      // Small delay to ensure smooth transition
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Show progress modal
      this.showPDFProcessingModal();
      
      await this.knowledgeManager.addTextDocument(title, content, (percentage, status, chunksProcessed) => {
        this.updatePDFProgress(percentage, status, chunksProcessed);
      });
      
      this.hidePDFProcessingModal();
      await this.renderKnowledgeList();
    } catch (error) {
      this.logger.error(`Error saving text "${title}":`, error);
      // Hide progress modal if it's showing
      this.hidePDFProcessingModal();
    }
  }

  private async handlePDFModalSave(): Promise<void> {
    const titleInput = document.getElementById('knowledge-pdf-title-input') as HTMLInputElement;
    const fileInput = document.getElementById('knowledge-pdf-file-input') as HTMLInputElement;
    
    const title = titleInput.value.trim();
    const file = fileInput.files?.[0];
    
    if (!title) {
      this.logger.warn('Please provide a title for the knowledge item.');
      return;
    }
    
    if (!file) {
      this.logger.warn('Please select a PDF file.');
      return;
    }
    
    try {
      // Close the PDF modal first
      this.hidePDFModal();
      
      // Small delay to ensure smooth transition
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Show progress modal
      this.showPDFProcessingModal();
      
      await this.knowledgeManager.addPDFDocument(file, title, (percentage, status, chunksProcessed) => {
        this.updatePDFProgress(percentage, status, chunksProcessed);
      });
      
      this.hidePDFProcessingModal();
      await this.renderKnowledgeList();
    } catch (error) {
      this.logger.error(`Error adding PDF "${title}":`, error);
      this.hidePDFProcessingModal();
    }
  }

  private async handleDeleteKnowledge(knowledgeId: string, title: string): Promise<void> {
    if (confirm(`Are you sure you want to delete "${title}" from your knowledge base?`)) {
      try {
        await this.knowledgeManager.deleteKnowledgeItem(knowledgeId);
        logger.success(`Deleted "${title}".`, 'KnowledgeUI');
        await this.renderKnowledgeList();
      } catch (error) {
        this.logger.error(`Error deleting "${title}":`, error);
      }
    }
  }


  private async handleSettingsChange(): Promise<void> {
    try {
      const chunkSize = parseInt((document.getElementById('chunk-size') as HTMLInputElement)?.value || '1000');
      const chunkOverlap = parseInt((document.getElementById('chunk-overlap') as HTMLInputElement)?.value || '200');
      
      await this.knowledgeManager.updateSettings({
        chunkSize,
        chunkOverlap
      });
      
      logger.success('Knowledge settings updated.', 'KnowledgeUI');
    } catch (error) {
      this.logger.error('Error updating settings:', error);
    }
  }


  private createKnowledgeItemHTML(item: KnowledgeItem): string {
    const previewContent = item.content.substring(0, 150) + (item.content.length > 150 ? '...' : '');
    
      // Only show delete button for knowledge items
      const actionButtons = `
        <button class="prompt-delete-btn" data-action="delete" data-id="${item.id}" data-title="${item.title}">Delete</button>
      `;
    
    return `
      <div class="prompt-card">
        <div class="prompt-header">
          <h4>${item.title}</h4>
          <div class="prompt-actions">
            ${actionButtons}
          </div>
        </div>
        <div class="prompt-content">
          <p>${previewContent}</p>
        </div>
      </div>
    `;
  }

}
