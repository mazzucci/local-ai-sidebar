import { TemplateManager } from './TemplateManager.js';
import { ChatUI } from './ChatUI.js';
import { PromptsUI } from './PromptsUI.js';
import { SettingsUI } from './SettingsUI.js';
import { KnowledgeUI } from './KnowledgeUI.js';
import { SplashscreenUI } from './SplashscreenUI.js';
import { ChatManager } from '../managers/ChatManager.js';
import { PromptManager } from '../managers/PromptManager.js';
import { KnowledgeManager } from '../managers/KnowledgeManager.js';
import { SettingsManager } from '../managers/SettingsManager.js';
import { RAGManager } from '../managers/RAGManager.js';
import { logger } from "../utils/logger.js";

export interface UIManagerProps {
  onStartDownload?: () => void;
  onCheckDownloadProgress?: () => void;
  onDownloadProgressUpdate?: (progress: number, loaded: number, total: number) => void;
}

export class UIManager {
  private chatUI: ChatUI;
  private promptsUI: PromptsUI;
  private settingsUI: SettingsUI;
  private splashscreenUI: SplashscreenUI;
  private knowledgeUI: KnowledgeUI;
  private logger = logger.createModuleLogger('UIManager');

  constructor(
    chatManager: ChatManager,
    promptManager: PromptManager,
    knowledgeManager: KnowledgeManager,
    settingsManager: SettingsManager,
    ragManager: RAGManager,
    uiManagerProps?: UIManagerProps
  ) {
    TemplateManager.loadTemplates();
    this.chatUI = new ChatUI(chatManager, ragManager, settingsManager);
    this.promptsUI = new PromptsUI(promptManager);
    this.settingsUI = new SettingsUI(settingsManager);
    this.knowledgeUI = new KnowledgeUI(knowledgeManager);
    this.splashscreenUI = new SplashscreenUI({
      onStartDownload: uiManagerProps?.onStartDownload,
      onCheckDownloadProgress: uiManagerProps?.onCheckDownloadProgress,
      onDownloadProgressUpdate: uiManagerProps?.onDownloadProgressUpdate
    });
    this.logger.info('UIManager initialized');
  }

  async initialize(): Promise<void> {
    try {
      await this.chatUI.init();
      await this.promptsUI.init();
      await this.settingsUI.init();
      await this.knowledgeUI.init();
      this.setupTabSwitching();
    } catch (error) {
      this.logger.error('UIManager initialization failed:', error);
      throw error;
    }
  }

  // Tab switching functionality
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
            
            // Initialize tab-specific content when it becomes active
            this.initializeTabContent(targetTab);
          }
        }
      });
    });
  }

  private initializeTabContent(tabName: string): void {
    switch (tabName) {
      case 'knowledge':
        // Initialize knowledge tab when it becomes active
        this.knowledgeUI.renderKnowledgeList().catch((error: any) => {
          console.warn('Failed to render knowledge list:', error);
        });
        break;
      case 'prompts':
        // Prompts are already rendered, no additional initialization needed
        break;
      case 'chat':
        // Chat tab is always ready, no initialization needed
        break;
      case 'settings':
        // Load current settings into UI
        this.settingsUI.loadSettingsIntoUI();
        break;
    }
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
      
      // Initialize tab-specific content when it becomes active
      this.initializeTabContent(tabName);
    }
  }

  // Splash screen delegation methods
  showSplashScreen(): void {
    this.splashscreenUI.showSplashScreen();
  }

  hideSplashScreen(): void {
    this.splashscreenUI.hideSplashScreen();
  }

  updateSplashStatus(message: string): void {
    this.splashscreenUI.updateSplashStatus(message);
  }

  showSplashDownloadOption(): void {
    this.splashscreenUI.showSplashDownloadOption();
  }

  showSplashProgress(): void {
    this.splashscreenUI.showSplashProgress();
  }

  showErrorHelp(): void {
    this.splashscreenUI.showErrorHelp();
  }

  updateDownloadProgress(progress: number, loaded: number, total: number): void {
    this.splashscreenUI.updateDownloadProgress(progress, loaded, total);
  }

  // Settings UI delegation methods (called during initialization flow)
  updateModelStatusDisplay(status: string, message?: string): void {
    this.settingsUI.updateModelStatusDisplay(status, message);
  }

  updateModelParamsDisplay(params: any): void {
    this.settingsUI.updateModelParamsDisplay(params);
  }

}