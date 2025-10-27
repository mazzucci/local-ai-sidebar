import { 
  KnowledgeItem, 
  KnowledgeSource, 
  KnowledgeSettings 
} from '../types/index.js';
import { TEXT_TEMPLATES } from '../config/settings.js';
import { EmbeddingStorage } from '../storage/EmbeddingStorage.js';
import { KnowledgeStorage } from '../storage/KnowledgeStorage.js';
import { TextChunker } from '../services/TextChunker.js';
import { TensorFlowEmbeddingService } from '../services/TensorFlowEmbeddingService.js';
import { PDFProcessor } from '../services/PDFProcessor.js';
import { logger } from "../utils/logger.js";
import { generatePrefixedUUID } from '../utils/uuid.js';

export class KnowledgeManager {
  private embeddingStorage: EmbeddingStorage;
  private knowledgeStorage: KnowledgeStorage;
  private textChunker: TextChunker;
  private embeddingService: TensorFlowEmbeddingService;
  private pdfProcessor: PDFProcessor;
  private settings: KnowledgeSettings;
  private logger = logger.createModuleLogger('KnowledgeManager');

  constructor() {
    this.embeddingStorage = new EmbeddingStorage();
    this.knowledgeStorage = new KnowledgeStorage();
    this.textChunker = new TextChunker();
    this.embeddingService = new TensorFlowEmbeddingService();
    this.pdfProcessor = new PDFProcessor();
    
    // Default settings
    this.settings = {
      chunkSize: 1000,
      chunkOverlap: 200
    };
    
    this.logger.info('KnowledgeManager initialized');
  }

  async init(): Promise<void> {
    try {
      await this.embeddingStorage.init();
      await this.knowledgeStorage.init();
      await this.embeddingService.init();
      await this.loadSettings();
      
    } catch (error) {
      this.logger.error('Error during initialization:', error);
      throw error;
    }
  }

  // Document Management
  async addTextDocument(title: string, content: string, progressCallback?: (percentage: number, status: string, chunksProcessed: number) => void): Promise<string> {
    try {
      // Update progress: Starting
      if (progressCallback) {
        progressCallback(10, 'Processing text content...', 0);
      }
      
      // Generate unique ID
      const id = this.generateId();
      
      // Update progress: Chunking text
      if (progressCallback) {
        progressCallback(20, 'Chunking text content...', 0);
      }
      
      // Chunk the text
      const chunks = this.textChunker.chunkText(content);
      
      // Update progress: Creating knowledge item
      if (progressCallback) {
        progressCallback(30, 'Creating knowledge item...', 0);
      }
      
      // Create knowledge item
      const knowledgeItem: KnowledgeItem = {
        id,
        title,
        content,
        type: 'text',
        chunks,
        chunkCount: chunks.length
      };
      
      // Store the document
      await this.knowledgeStorage.storeDocument(knowledgeItem);
      
      // Update progress: Generating embeddings
      if (progressCallback) {
        progressCallback(40, 'Generating embeddings...', 0);
      }
      
      // Generate embeddings with progress updates
      await this.generateEmbeddingsWithProgress(id, progressCallback);
      
      // Update progress: Complete
      if (progressCallback) {
        progressCallback(100, 'Text processing complete!', 0);
      }
      return id;
    } catch (error) {
      this.logger.error(`Error adding text document "${title}":`, error);
      throw error;
    }
  }

  async addPDFDocument(file: File, customTitle?: string, progressCallback?: (percentage: number, status: string, chunksProcessed: number) => void): Promise<string> {
    try {
      // Update progress: Text extraction
      if (progressCallback) {
        progressCallback(10, 'Extracting text from PDF...', 0);
      }
      
      // Extract text using PDF.js
      const content = await this.extractTextFromPDF(file);
      
      // Update progress: Text extraction complete
      if (progressCallback) {
        progressCallback(20, 'Text extraction complete, chunking content...', 0);
      }
      
      // Use custom title if provided, otherwise use filename (without extension)
      const title = customTitle || file.name.replace(/\.[^/.]+$/, '');
      
      // Update progress: Creating knowledge item
      if (progressCallback) {
        progressCallback(30, 'Creating knowledge item...', 0);
      }
      
      // Generate unique ID
      const id = this.generateId();
      
      // Chunk the text
      const chunks = this.textChunker.chunkText(content);
      
      // Create knowledge item with PDF type
      const knowledgeItem: KnowledgeItem = {
        id,
        title,
        content,
        type: 'pdf',
        chunks,
        chunkCount: chunks.length
      };
      
      // Store the document
      await this.knowledgeStorage.storeDocument(knowledgeItem);
      
      // Update progress: Generating embeddings
      if (progressCallback) {
        progressCallback(40, 'Generating embeddings...', 0);
      }
      
      // Generate embeddings with progress updates
      await this.generateEmbeddingsWithProgress(id, progressCallback);
      
      // Update progress: Complete
      if (progressCallback) {
        progressCallback(100, 'PDF processing complete!', 0);
      }
      
      return id;
    } catch (error) {
      this.logger.error(`Error adding PDF document "${file.name}":`, error);
      throw error;
    }
  }

  async deleteKnowledgeItem(knowledgeId: string): Promise<void> {
    try {
      // Delete embeddings first
      await this.embeddingStorage.deleteEmbeddingsByKnowledgeId(knowledgeId);
      
      // Delete the document
      await this.knowledgeStorage.deleteDocument(knowledgeId);
    } catch (error) {
      this.logger.error(`Error deleting knowledge item "${knowledgeId}":`, error);
      throw error;
    }
  }

  // Search & Retrieval
  async searchKnowledge(query: string, limit: number = 5): Promise<KnowledgeSource[]> {
    try {
      this.logger.info(`Searching knowledge base for: "${query}"`);
      
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Search for similar embeddings
      const similarEmbeddings = await this.embeddingStorage.searchSimilar(queryEmbedding, limit);
      
      // Get document titles for the results
      const sources: KnowledgeSource[] = [];
      for (const embedding of similarEmbeddings) {
        const document = await this.knowledgeStorage.getDocument(embedding.knowledgeId);
        if (document) {
          sources.push({
            ...embedding,
            title: document.title
          });
        }
      }
      return sources;
    } catch (error) {
      this.logger.error(`Error searching knowledge for "${query}":`, error);
      throw error;
    }
  }

  async getAllKnowledge(): Promise<KnowledgeItem[]> {
    try {
      return await this.knowledgeStorage.getAllDocuments();
    } catch (error) {
      this.logger.error('Error getting all knowledge:', error);
      throw error;
    }
  }

  async hasKnowledgeContent(): Promise<boolean> {
    try {
      return await this.knowledgeStorage.hasAnyDocuments();
    } catch (error) {
      this.logger.error('Error checking knowledge content:', error);
      return false;
    }
  }

  async getKnowledgeItem(knowledgeId: string): Promise<KnowledgeItem | null> {
    try {
      return await this.knowledgeStorage.getDocument(knowledgeId);
    } catch (error) {
      this.logger.error(`Error getting knowledge item "${knowledgeId}":`, error);
      throw error;
    }
  }

  // Text Processing
  private async generateEmbedding(text: string): Promise<number[]> {
    // Use TensorFlow.js Universal Sentence Encoder for high-quality embeddings
    return await this.embeddingService.generateEmbedding(text);
  }

  private async generateEmbeddingsWithProgress(knowledgeId: string, progressCallback?: (percentage: number, status: string, chunksProcessed: number) => void): Promise<void> {
    try {
      // Get the knowledge item
      const knowledgeItem = await this.knowledgeStorage.getDocument(knowledgeId);
      if (!knowledgeItem) {
        throw new Error(`Knowledge item not found: ${knowledgeId}`);
      }

      // Generate chunks
      const chunks = this.textChunker.chunkText(knowledgeItem.content);
      const totalChunks = chunks.length;
      
      this.logger.info(`Generating embeddings for ${totalChunks} chunks`);
      
      const embeddings: number[][] = [];
      let processedChunks = 0;
      
      // Process chunks in batches to avoid blocking the UI
      const batchSize = 5; // Process 5 chunks at a time
      
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        
        // Generate embeddings for this batch
        const batchEmbeddings = await Promise.all(
          batch.map(chunk => this.generateEmbedding(chunk))
        );
        
        embeddings.push(...batchEmbeddings);
        processedChunks += batch.length;
        
        // Update progress
        if (progressCallback) {
          const percentage = 40 + (processedChunks / totalChunks) * 50; // 40-90% range
          progressCallback(percentage, `Generating embeddings... (${processedChunks}/${totalChunks})`, processedChunks);
        }
        
        // Small delay to allow UI updates
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Store all embeddings
      await this.embeddingStorage.storeEmbeddings(knowledgeId, embeddings, chunks);
    } catch (error) {
      this.logger.error('Error generating embeddings with progress:', error);
      throw error;
    }
  }


  private async extractTextFromPDF(file: File): Promise<string> {
    try {
      this.logger.info(`Extracting text from PDF using PDF.js: ${file.name}`);
      
      // Use PDF.js for proper text extraction with page information
      const result = await this.pdfProcessor.extractTextFromPDFWithPageInfo(file);
      
      if (result.includes('PDF Text Extraction Failed')) {
        this.logger.warn(`PDF text extraction failed for: ${file.name}`);
      } else {
        this.logger.success(`Successfully extracted text from PDF: ${file.name}`);
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Error extracting text from PDF ${file.name}:`, error);
      return TEXT_TEMPLATES.pdfFailureMessage;
    }
  }

  // Settings Management
  async updateSettings(settings: Partial<KnowledgeSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...settings };
      
      // Update text chunker if parameters changed
      if (settings.chunkSize !== undefined || settings.chunkOverlap !== undefined) {
        this.textChunker.updateParameters(
          settings.chunkSize || this.settings.chunkSize,
          settings.chunkOverlap || this.settings.chunkOverlap
        );
      }
      
      await this.saveSettings();
    } catch (error) {
      this.logger.error('Error updating settings:', error);
      throw error;
    }
  }

  async getSettings(): Promise<KnowledgeSettings> {
    return { ...this.settings };
  }

  private async loadSettings(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['knowledgeSettings']);
      if (result.knowledgeSettings) {
        this.settings = { ...this.settings, ...result.knowledgeSettings };
        this.textChunker.updateParameters(this.settings.chunkSize, this.settings.chunkOverlap);
      }
    } catch (error) {
      this.logger.error('Error loading settings:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await chrome.storage.local.set({ knowledgeSettings: this.settings });
    } catch (error) {
      this.logger.error('Error saving settings:', error);
    }
  }

  // Utility Methods
  private generateId(): string {
    return generatePrefixedUUID('knowledge');
  }

  getEmbeddingServiceInfo(): { backend: string; isReady: boolean; modelName: string } {
    return this.embeddingService.getModelInfo();
  }

  // Storage management
  async clearAll(): Promise<void> {
    try {
      await this.embeddingStorage.clearAll();
      await this.knowledgeStorage.clearAll();
    } catch (error) {
      this.logger.error('Error clearing all data:', error);
      throw error;
    }
  }
}
