import { EmbeddingRecord, KnowledgeSource } from '../types/index.js';
import { logger } from "../utils/logger.js";
import { cosineSimilarity } from 'fast-cosine-similarity';

export class EmbeddingStorage {
  private dbName = 'LocalAIEmbeddings';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private logger = logger.createModuleLogger('EmbeddingStorage');

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create embeddings store
        if (!db.objectStoreNames.contains('embeddings')) {
          const store = db.createObjectStore('embeddings', { keyPath: 'id' });
          store.createIndex('knowledgeId', 'knowledgeId', { unique: false });
          store.createIndex('chunkIndex', 'chunkIndex', { unique: false });
        }
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        this.logger.success('EmbeddingStorage initialized successfully');
        resolve();
      };
      
      request.onerror = () => {
        this.logger.error('Error during initialization:', request.error);
        reject(request.error);
      };
    });
  }

  async storeEmbedding(knowledgeId: string, chunkIndex: number, embedding: number[], text: string): Promise<void> {
    if (!this.db) {
      throw new Error('EmbeddingStorage not initialized');
    }

    const record: EmbeddingRecord = {
      id: `${knowledgeId}_${chunkIndex}`,
      knowledgeId,
      chunkIndex,
      embedding,
      text
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['embeddings'], 'readwrite');
      const store = transaction.objectStore('embeddings');
      const request = store.put(record);
      
      request.onsuccess = () => {
        this.logger.info(`Stored embedding for ${knowledgeId}, chunk ${chunkIndex}`);
        resolve();
      };
      
      request.onerror = () => {
        this.logger.error('Error storing embedding:', request.error);
        reject(request.error);
      };
    });
  }

  async storeEmbeddings(knowledgeId: string, embeddings: number[][], texts: string[]): Promise<void> {
    if (embeddings.length !== texts.length) {
      throw new Error('Embeddings and texts arrays must have the same length');
    }

    const promises = embeddings.map((embedding, index) => 
      this.storeEmbedding(knowledgeId, index, embedding, texts[index])
    );

    await Promise.all(promises);
    this.logger.success(`Stored ${embeddings.length} embeddings for ${knowledgeId}`);
  }

  async searchSimilar(queryEmbedding: number[], limit: number = 5): Promise<KnowledgeSource[]> {
    if (!this.db) {
      throw new Error('EmbeddingStorage not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['embeddings'], 'readonly');
      const store = transaction.objectStore('embeddings');
      const request = store.getAll();
      
      request.onsuccess = async () => {
        const records: EmbeddingRecord[] = request.result;
        
        // OPTIMIZATION: Early exit if no embeddings exist
        if (records.length === 0) {
          this.logger.info('Found 0 similar embeddings (empty database)');
          resolve([]);
          return;
        }
        
        try {
          // OPTIMIZATION: Calculate similarities in batches to avoid blocking the UI
          const similarities = await this.calculateSimilaritiesInBatches(records, queryEmbedding);
          
          // Sort by similarity and take top results
          const topResults = similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit)
            .map(record => ({
              knowledgeId: record.knowledgeId,
              title: '', // Will be filled by KnowledgeManager
              chunkIndex: record.chunkIndex,
              text: record.text,
              similarity: record.similarity
            }));
          
          this.logger.info(`Found ${topResults.length} similar embeddings`);
          resolve(topResults);
        } catch (error) {
          this.logger.error('Error calculating similarities:', error);
          reject(error);
        }
      };
      
      request.onerror = () => {
        this.logger.error('Error searching embeddings:', request.error);
        reject(request.error);
      };
    });
  }

  // OPTIMIZATION: Process similarity calculations in batches to avoid blocking the UI
  private async calculateSimilaritiesInBatches(
    records: EmbeddingRecord[], 
    queryEmbedding: number[]
  ): Promise<Array<EmbeddingRecord & { similarity: number }>> {
    const batchSize = 50; // Process 50 embeddings at a time
    const results: Array<EmbeddingRecord & { similarity: number }> = [];
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      // Calculate similarities for this batch
      const batchResults = batch.map(record => ({
        ...record,
        similarity: cosineSimilarity(queryEmbedding, record.embedding)
      }));
      
      results.push(...batchResults);
      
      // Yield to the main thread to keep UI responsive
      if (i + batchSize < records.length) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    return results;
  }

  // OPTIMIZATION: Fast check to see if any embeddings exist
  async hasAnyEmbeddings(): Promise<boolean> {
    if (!this.db) {
      return false;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['embeddings'], 'readonly');
      const store = transaction.objectStore('embeddings');
      const request = store.count();
      
      request.onsuccess = () => {
        const count = request.result;
        resolve(count > 0);
      };
      
      request.onerror = () => {
        this.logger.error('Error checking embeddings count:', request.error);
        reject(request.error);
      };
    });
  }

  async deleteEmbeddingsByKnowledgeId(knowledgeId: string): Promise<void> {
    if (!this.db) {
      throw new Error('EmbeddingStorage not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['embeddings'], 'readwrite');
      const store = transaction.objectStore('embeddings');
      const index = store.index('knowledgeId');
      const request = index.openCursor(IDBKeyRange.only(knowledgeId));
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          this.logger.info(`Deleted all embeddings for ${knowledgeId}`);
          resolve();
        }
      };
      
      request.onerror = () => {
        this.logger.error('Error deleting embeddings:', request.error);
        reject(request.error);
      };
    });
  }

  async clearAll(): Promise<void> {
    if (!this.db) {
      throw new Error('EmbeddingStorage not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['embeddings'], 'readwrite');
      const store = transaction.objectStore('embeddings');
      const request = store.clear();
      
      request.onsuccess = () => {
        this.logger.info('Cleared all embeddings');
        resolve();
      };
      
      request.onerror = () => {
        this.logger.error('Error clearing embeddings:', request.error);
        reject(request.error);
      };
    });
  }
}
