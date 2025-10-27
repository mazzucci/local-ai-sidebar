import { ChatManager } from './managers/ChatManager.js';
import { PromptManager } from './managers/PromptManager.js';
import { SettingsManager } from './managers/SettingsManager.js';
import { KnowledgeManager } from './managers/KnowledgeManager.js';
import { UIManager } from './ui/UIManager.js';
import { RAGManager } from './managers/RAGManager.js';
import { logger } from "./utils/logger.js";

export class LocalAI {
  private chatManager: ChatManager;
  private promptManager: PromptManager;
  private settingsManager: SettingsManager;
  private knowledgeManager: KnowledgeManager;
  private uiManager: UIManager;
  private ragManager: RAGManager | null = null;

  constructor() {
    // Create all managers (business logic layer)
    this.chatManager = new ChatManager();
    this.promptManager = new PromptManager();
    this.settingsManager = new SettingsManager();
    this.knowledgeManager = new KnowledgeManager();
    
    // Initialize RAG components
    this.ragManager = new RAGManager(
      this.knowledgeManager,
      this.chatManager,
      this.settingsManager
    );
    
    // Create UIManager (UI coordination layer) - it creates all UI components internally
    this.uiManager = new UIManager(
      this.chatManager,
      this.promptManager,
      this.knowledgeManager,
      this.settingsManager,
      this.ragManager,
      {
        onStartDownload: () => this.startDownloadFromSplash(),
        onCheckDownloadProgress: () => this.checkModelAvailability(),
        onDownloadProgressUpdate: (progress: number, loaded: number, total: number) => {
          this.uiManager.updateDownloadProgress(progress, loaded, total);
        }
      }
    );
    
    this.init();
  }

  private async init(): Promise<void> {
    try {
      // Initialize knowledge system with error handling
      try {
        await this.knowledgeManager.init();
        logger.debug('Knowledge system initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize knowledge system:', error);
        logger.debug('Continuing without knowledge system - RAG features will be disabled');
        // Don't let knowledge system errors affect AI detection
      }
      
      // Initialize UI components (each UI component initializes itself)
      await this.uiManager.initialize();
      
      // Show splash screen and start loading
      this.uiManager.showSplashScreen();
      
      // Check model availability
      await this.checkModelAvailability();
    } catch (error) {
      logger.error('Critical error during LocalAI initialization:', error);
      // Show error screen instead of staying on splash
      this.uiManager.showErrorHelp();
    }
  }


  private async checkModelAvailability(): Promise<void> {
    try {
      this.uiManager.updateSplashStatus('Checking AI model availability...');
      this.uiManager.updateModelStatusDisplay('checking');
      
      const statusPromise = this.ragManager?.checkModelAvailability();
      if (!statusPromise) {
        throw new Error('RAGManager not initialized');
      }
      
      // Add timeout to prevent infinite hanging
      let timeoutFired = false;
      const timeoutPromise = new Promise<string>((resolve) => {
        setTimeout(() => {
          timeoutFired = true;
          resolve('timeout');
        }, 10000);
      });
      
      let status = await Promise.race([statusPromise, timeoutPromise]);
      
      logger.debug('Model availability status received:', status);
      
      // Only log timeout if it actually fired
      if (timeoutFired && status === 'timeout') {
        logger.debug('Model availability check timed out after 10 seconds');
      }
      
      // Handle timeout case
      if (status === 'timeout') {
        logger.debug('Initial model check timed out after 10 seconds, but this is normal for slow systems');
        this.uiManager.updateSplashStatus('⏳ Model check taking longer than expected...');
        this.uiManager.updateModelStatusDisplay('checking', 'Taking longer than expected');
        
        // Try to get the actual result with a longer timeout
        try {
          logger.debug('Attempting to get model status with extended timeout...');
          this.uiManager.updateSplashStatus('⏳ Still checking model availability...');
          
          // Use a longer timeout for the second attempt
          const extendedTimeoutPromise = new Promise<string>((resolve) => {
            setTimeout(() => {
              logger.debug('Extended model availability check timed out after 30 seconds');
              resolve('timeout');
            }, 30000);
          });
          
          const extendedStatusPromise = this.ragManager?.checkModelAvailability();
          if (!extendedStatusPromise) {
            throw new Error('RAGManager not initialized');
          }
          const extendedStatus = await Promise.race([extendedStatusPromise, extendedTimeoutPromise]);
          
          if (extendedStatus === 'timeout') {
            logger.error('Model availability check failed after extended timeout');
            this.uiManager.updateSplashStatus('❌ Model check timed out - please try refreshing');
            this.uiManager.updateModelStatusDisplay('error', 'Check timed out');
            this.uiManager.showErrorHelp();
            return;
          }
          
          logger.debug('Model status received after extended timeout:', extendedStatus);
          status = extendedStatus; // Use the actual status
        } catch (error) {
          logger.error('Failed to get model status after extended timeout:', error);
          this.uiManager.updateSplashStatus('❌ Unable to check model availability');
          this.uiManager.updateModelStatusDisplay('error', 'Check failed');
          this.uiManager.showErrorHelp();
          return;
        }
      }
      
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
          this.uiManager.showErrorHelp();
          break;
          
        default:
          logger.error('Unknown model status:', status);
          this.uiManager.updateSplashStatus('❌ Unknown model status');
          this.uiManager.updateModelStatusDisplay('error');
          this.uiManager.showErrorHelp();
      }
    } catch (error) {
      logger.error('Error checking model availability:', error);
      this.uiManager.updateSplashStatus('❌ Error checking model availability');
      this.uiManager.updateModelStatusDisplay('error', 'Error checking model availability');
      this.uiManager.showErrorHelp();
    }
  }

  // ========== AI Initialization Methods ==========

  /**
   * initializeAI: Initialize AI session and model
   * - Check model availability (done before calling this)
   * - Initialize RAG session with conversation history
   * - Load model parameters
   */
  private async initializeAI(): Promise<void> {
    logger.debug('Window object keys:', Object.keys(window).filter(key => key.includes('Language') || key.includes('AI') || key.includes('chrome')));
    
    if (!('LanguageModel' in window)) {
      logger.debug('LanguageModel not available, skipping AI initialization');
      return;
    }

    await this.ragManager?.initializeSession();
    await this.ragManager?.loadModelParameters();
  }

  /**
   * updateModelParamsUI: Update model parameters display after AI initialization
   */
  private async updateModelParamsUI(): Promise<void> {
    const modelParams = this.ragManager?.getModelParameters();
    logger.debug('Model parameters received:', modelParams);
    
    if (modelParams) {
      this.uiManager.updateModelParamsDisplay(modelParams);
    } else {
      this.uiManager.updateModelParamsDisplay('Model parameters not available');
    }
  }

  /**
   * initializeSession: Initialize AI session and update UI
   */
  private async initializeSession(): Promise<void> {
    try {
      await this.initializeAI();
      await this.updateModelParamsUI();
      this.uiManager.hideSplashScreen();
    } catch (error) {
      logger.error('Error initializing session:', error);
      logger.debug('Running in demo mode due to initialization error');
      
      // Update model parameters display with error message
      this.uiManager.updateModelParamsDisplay('Model parameters not available - running in demo mode');
      
      this.uiManager.hideSplashScreen();
    }
  }

  private async startDownloadFromSplash(): Promise<void> {
    try {
      this.uiManager.showSplashProgress();
      
      // Pass progress callback directly to downloadModel
      const success = await this.ragManager?.downloadModel((progress, loaded, total) => {
        this.uiManager.updateDownloadProgress(progress, loaded, total);
      });
      
      if (success) {
        this.uiManager.updateModelStatusDisplay('available');
        await this.initializeSession();
        this.uiManager.hideSplashScreen();
      } else {
        this.uiManager.updateSplashStatus('❌ Download failed. Please try again.');
        this.uiManager.updateModelStatusDisplay('error', 'Download failed');
      }
    } catch (error) {
      logger.error('Error starting download:', error);
      this.uiManager.updateSplashStatus('❌ Download failed. Please try again.');
      this.uiManager.updateModelStatusDisplay('error', 'Download failed');
    }
  }

}

// Initialize the Local AI immediately
new LocalAI();
