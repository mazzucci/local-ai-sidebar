import { 
  RAGResponse, 
  KnowledgeSource,
  TEXT_TEMPLATES,
  ModelParameters,
  ModelStatus
} from '../types/index.js';
import { DEFAULT_SETTINGS, LLM_ROLE } from '../config/settings.js';
import { KnowledgeManager } from './KnowledgeManager.js';
import { ChatManager } from './ChatManager.js';
import { SettingsManager } from './SettingsManager.js';
import { logger } from "../utils/logger.js";

export class RAGManager {
  private knowledgeManager: KnowledgeManager;
  private chatManager: ChatManager;
  private settingsManager: SettingsManager;
  private session: any | null = null;
  private modelParams: ModelParameters | null = null;
  private modelStatus: ModelStatus = 'checking';
  private logger = logger.createModuleLogger('RAGManager');

  constructor(
    knowledgeManager: KnowledgeManager,
    chatManager: ChatManager,
    settingsManager: SettingsManager
  ) {
    this.knowledgeManager = knowledgeManager;
    this.chatManager = chatManager;
    this.settingsManager = settingsManager;
    
    this.logger.info('RAGManager initialized (session will be set later)');
  }

  // Method to initialize the session
  async initializeSession(): Promise<void> {
    try {
      if (!('LanguageModel' in window)) {
        this.logger.warn('LanguageModel not available');
        return;
      }

      // Build conversation history
      const conversationHistory = this.buildConversationHistory();
      
      const modelOptions = {
        language: 'en' as const,
        outputLanguage: 'en' as const,
        initialPrompts: conversationHistory
      };

      this.session = await (window as any).LanguageModel.create(modelOptions);
    } catch (error) {
      this.logger.error('Error initializing session:', error);
      throw error;
    }
  }

  private buildConversationHistory(): any[] {
    const messages = this.chatManager.getAllMessages();
    const conversationHistory: any[] = [];
    
    // Get settings for maxRecentMessages
    const settings = this.settingsManager.getSettings();
    
    // Limit to last N messages to avoid quota exceeded error
    const recentMessages = messages.slice(-settings.maxRecentMessages);
    // Add system message
    conversationHistory.push({
      role: LLM_ROLE.SYSTEM,
      content: TEXT_TEMPLATES.systemMessage
    });
    
    // Add chat messages (sender is already 'user' or 'assistant', matching LLM API)
    recentMessages.forEach(msg => {
      conversationHistory.push({
        role: msg.sender,
        content: msg.content
      });
    });
    
    return conversationHistory;
  }

  // Check if session is ready
  isSessionReady(): boolean {
    return this.session !== null;
  }

  async generateResponse(query: string, settings: any): Promise<RAGResponse> {
    if (!this.session) {
      this.logger.warn('Session not initialized - AI not available');
      return { 
        content: `I received your message: "${query}"\n\nHowever, the AI model is not currently available. This could be because:\n• The model hasn't finished downloading\n• Chrome AI is not enabled\n• There was an error during initialization\n\nPlease check the model status in the Settings tab or try refreshing the extension.`
      };
    }

    try {
      // Get fresh settings from SettingsManager
      const allSettings = this.settingsManager.getSettings();
      
      // OPTIMIZATION: Early check if knowledge base is empty to avoid expensive operations
      const hasKnowledge = await this.knowledgeManager.hasKnowledgeContent();
      
      if (!hasKnowledge) {
        this.logger.info('Knowledge base is empty, generating generic response');
        return {
          content: await this.generateGenericResponse(query, settings)
        };
      }
      
      // Check if we have relevant knowledge
      const relevantSources = await this.findRelevantSources(query, allSettings.maxSources);
      
      if (relevantSources.length === 0) {
        this.logger.info('No relevant knowledge found, generating generic response');
      return {
        content: await this.generateGenericResponse(query, settings)
      };
      }
      
      // Generate RAG response with context
      const content = await this.generateRAGResponse(query, relevantSources, settings);
      
      this.logger.success(`Generated RAG response with ${relevantSources.length} sources`);
      
      return { content };
    } catch (error) {
      this.logger.error(`Error generating RAG response for "${query}":`, error);
      
      // Fallback to generic response
      return {
        content: await this.generateGenericResponse(query, settings)
      };
    }
  }

  private async findRelevantSources(query: string, limit: number): Promise<KnowledgeSource[]> {
    try {
      // Use KnowledgeManager's search method
      const sources = await this.knowledgeManager.searchKnowledge(query, limit);
      
      // Get fresh settings from SettingsManager
      const settings = this.settingsManager.getSettings();
      
      // Filter by minimum similarity threshold
      const filteredSources = sources.filter(
        source => source.similarity >= settings.minSimilarityThreshold
      );
      
      this.logger.info(`Found ${filteredSources.length} relevant sources (threshold: ${settings.minSimilarityThreshold})`);
      return filteredSources;
    } catch (error) {
      this.logger.error('Error finding relevant sources:', error);
      return [];
    }
  }

  private async generateRAGResponse(
    query: string, 
    sources: KnowledgeSource[], 
    settings: any
  ): Promise<string> {
    try {
      const contextPrompt = this.createContextPrompt(query, sources);
      
      const response = await this.session.prompt([
        { role: LLM_ROLE.USER, content: contextPrompt }
      ], {
        temperature: settings.temperature || DEFAULT_SETTINGS.temperature,
        topK: settings.topK || DEFAULT_SETTINGS.topK
      });
      
      return response;
    } catch (error) {
      this.logger.error('Error generating RAG response with context:', error);
      throw error;
    }
  }

  private createContextPrompt(query: string, sources: KnowledgeSource[]): string {
    const contextSections = sources.map((source) => {
      let citation = '';
      if (source.pageNumber) {
        citation = ` (${source.title} - page ${source.pageNumber})`;
      } else {
        citation = ` (${source.title})`;
      }
      
      return `[From: ${source.title}]${citation}
${source.text}`;
    }).join('\n\n---\n\n');

    return TEXT_TEMPLATES.ragPrompt
      .replace('{{contextSections}}', contextSections)
      .replace('{{query}}', query);
  }

  private async generateGenericResponse(query: string, settings: any): Promise<string> {
    try {
      const genericPrompt = TEXT_TEMPLATES.genericPrompt.replace('{{query}}', query);

      const response = await this.session.prompt([
        { role: LLM_ROLE.USER, content: genericPrompt }
      ], {
        temperature: settings.temperature || DEFAULT_SETTINGS.temperature,
        topK: settings.topK || DEFAULT_SETTINGS.topK
      });
      
      return response;
    } catch (error) {
      this.logger.error('Error generating generic response:', error);
      return TEXT_TEMPLATES.errorResponse;
    }
  }


  // Utility method to check if knowledge base has any content
  async hasKnowledgeContent(): Promise<boolean> {
    return await this.knowledgeManager.hasKnowledgeContent();
  }

  async checkModelAvailability(): Promise<ModelStatus> {
    try {
      // Check if LanguageModel is available in global scope
      if (!('LanguageModel' in window)) {
        this.logger.error('LanguageModel is not available in window');
        this.logger.debug('Available window properties:', Object.keys(window).slice(0, 20));
        this.modelStatus = 'error';
        return 'error';
      }
      
      this.logger.debug('LanguageModel is available, checking model availability...');

      const modelOptions = {
        language: 'en' as const,
        outputLanguage: 'en' as const
      };

      this.logger.debug('Calling LanguageModel.availability() with options:', modelOptions);
      const availability = await (window as any).LanguageModel.availability(modelOptions);
      this.logger.debug('Model availability result received:', availability);
      
      switch (availability) {
        case 'available':
          this.modelStatus = 'available';
          this.logger.debug('Model is available');
          break;
        case 'downloadable':
          this.modelStatus = 'downloadable';
          this.logger.debug('Model is downloadable');
          break;
        case 'downloading':
          this.modelStatus = 'downloading';
          this.logger.debug('Model is downloading');
          break;
        case 'unavailable':
          this.modelStatus = 'error';
          this.logger.debug('Model is unavailable');
          break;
        default:
          this.logger.error('Unknown availability status:', availability);
          this.modelStatus = 'error';
      }

      return this.modelStatus;
    } catch (error) {
      this.logger.error('Error checking model availability:', error);
      this.modelStatus = 'error';
      return 'error';
    }
  }

  async downloadModel(onProgress?: (progress: number, loaded: number, total: number) => void): Promise<boolean> {
    try {
      if (!('LanguageModel' in window)) {
        return false;
      }

      const modelOptions = {
        language: 'en' as const,
        outputLanguage: 'en' as const,
        monitor: (monitor: any) => {
          monitor.addEventListener('downloadprogress', (e: any) => {
            const progress = Math.round((e.loaded / e.total) * 100);
            
            if (onProgress) {
              onProgress(progress, e.loaded, e.total);
            }
          });
        }
      };

      await (window as any).LanguageModel.create(modelOptions);
      this.modelStatus = 'available';
      return true;
    } catch (error) {
      this.logger.error('Error downloading model:', error);
      this.modelStatus = 'error';
      return false;
    }
  }

  private getDefaultModelParams(): ModelParameters {
    return {
      defaultTemperature: DEFAULT_SETTINGS.temperature,
      maxTemperature: DEFAULT_SETTINGS.maxTemperature,
      defaultTopK: DEFAULT_SETTINGS.topK,
      maxTopK: DEFAULT_SETTINGS.maxTopK
    };
  }

  async loadModelParameters(): Promise<ModelParameters | null> {
    try {
      if (!this.isModelAvailable()) {
        return null;
      }

      const params = await (window as any).LanguageModel.params();
      this.logger.debug('Raw model parameters from API:', params);
      
      // Merge API params with defaults (API params override defaults)
      const modelParams = {
        ...this.getDefaultModelParams(),
        ...params
      };
      
      this.modelParams = modelParams;
      return modelParams;
    } catch (error) {
      this.logger.error('Error loading model parameters:', error);
      const defaultParams = this.getDefaultModelParams();
      this.modelParams = defaultParams;
      return defaultParams;
    }
  }

  getModelParameters(): ModelParameters | null {
    return this.modelParams;
  }

  getModelStatus(): ModelStatus {
    return this.modelStatus;
  }

  isModelAvailable(): boolean {
    return this.modelStatus === 'available';
  }

  isModelDownloadable(): boolean {
    return this.modelStatus === 'downloadable';
  }

  isModelDownloading(): boolean {
    return this.modelStatus === 'downloading';
  }

}
