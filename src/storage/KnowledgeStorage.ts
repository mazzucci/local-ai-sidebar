import { KnowledgeItem } from '../types/index.js';
import { logger } from "../utils/logger.js";

export class KnowledgeStorage {
  private dbName = 'LocalAIKnowledge';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private logger = logger.createModuleLogger('KnowledgeStorage');

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create knowledge store
        if (!db.objectStoreNames.contains('knowledge')) {
          const store = db.createObjectStore('knowledge', { keyPath: 'id' });
          store.createIndex('title', 'title', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        this.logger.success('KnowledgeStorage initialized successfully');
        resolve();
      };
      
      request.onerror = () => {
        this.logger.error('Error during initialization:', request.error);
        reject(request.error);
      };
    });
  }

  async storeDocument(item: KnowledgeItem): Promise<string> {
    if (!this.db) {
      throw new Error('KnowledgeStorage not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['knowledge'], 'readwrite');
      const store = transaction.objectStore('knowledge');
      const request = store.put(item);
      
      request.onsuccess = () => {
        this.logger.info(`Stored knowledge document: ${item.title}`);
        resolve(item.id);
      };
      
      request.onerror = () => {
        this.logger.error('Error storing document:', request.error);
        reject(request.error);
      };
    });
  }

  async getDocument(knowledgeId: string): Promise<KnowledgeItem | null> {
    if (!this.db) {
      throw new Error('KnowledgeStorage not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['knowledge'], 'readonly');
      const store = transaction.objectStore('knowledge');
      const request = store.get(knowledgeId);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result || null);
      };
      
      request.onerror = () => {
        this.logger.error('Error getting document:', request.error);
        reject(request.error);
      };
    });
  }

  async getAllDocuments(): Promise<KnowledgeItem[]> {
    if (!this.db) {
      throw new Error('KnowledgeStorage not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['knowledge'], 'readonly');
      const store = transaction.objectStore('knowledge');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const documents: KnowledgeItem[] = request.result;
        this.logger.info(`Retrieved ${documents.length} knowledge documents`);
        resolve(documents);
      };
      
      request.onerror = () => {
        this.logger.error('Error getting all documents:', request.error);
        reject(request.error);
      };
    });
  }

  async hasAnyDocuments(): Promise<boolean> {
    if (!this.db) {
      return false;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['knowledge'], 'readonly');
      const store = transaction.objectStore('knowledge');
      // OPTIMIZATION: Use count() instead of openCursor() for faster check
      const request = store.count();
      
      request.onsuccess = () => {
        const count = request.result;
        resolve(count > 0);
      };
      
      request.onerror = () => {
        this.logger.error('Error checking documents:', request.error);
        reject(request.error);
      };
    });
  }

  async deleteDocument(knowledgeId: string): Promise<void> {
    if (!this.db) {
      throw new Error('KnowledgeStorage not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['knowledge'], 'readwrite');
      const store = transaction.objectStore('knowledge');
      const request = store.delete(knowledgeId);
      
      request.onsuccess = () => {
        this.logger.info(`Deleted knowledge document: ${knowledgeId}`);
        resolve();
      };
      
      request.onerror = () => {
        this.logger.error('Error deleting document:', request.error);
        reject(request.error);
      };
    });
  }

  async searchDocuments(query: string): Promise<KnowledgeItem[]> {
    if (!this.db) {
      throw new Error('KnowledgeStorage not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['knowledge'], 'readonly');
      const store = transaction.objectStore('knowledge');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const allDocuments: KnowledgeItem[] = request.result;
        
        // Simple text search (case-insensitive)
        const searchTerm = query.toLowerCase();
        const filteredDocuments = allDocuments.filter(doc => 
          doc.title.toLowerCase().includes(searchTerm) ||
          doc.content.toLowerCase().includes(searchTerm)
        );
        
        this.logger.info(`Found ${filteredDocuments.length} documents matching "${query}"`);
        resolve(filteredDocuments);
      };
      
      request.onerror = () => {
        this.logger.error('Error searching documents:', request.error);
        reject(request.error);
      };
    });
  }

  async clearAll(): Promise<void> {
    if (!this.db) {
      throw new Error('KnowledgeStorage not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['knowledge'], 'readwrite');
      const store = transaction.objectStore('knowledge');
      const request = store.clear();
      
      request.onsuccess = () => {
        this.logger.info('Cleared all knowledge documents');
        resolve();
      };
      
      request.onerror = () => {
        this.logger.error('Error clearing knowledge documents:', request.error);
        reject(request.error);
      };
    });
  }
}
