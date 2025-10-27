import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import { logger } from "../utils/logger.js";

export class TensorFlowEmbeddingService {
  private model: use.UniversalSentenceEncoder | null = null;
  private isInitialized = false;
  private logger = logger.createModuleLogger('TensorFlowEmbeddingService');

  async init(): Promise<void> {
    try {
      // Set backend preference (WebGL for performance, CPU as fallback)
      await tf.setBackend('webgl');
      await tf.ready();
      
      this.logger.info(`TensorFlow.js backend: ${tf.getBackend()}`);
      
      this.model = await use.load();
      
      this.isInitialized = true;
    } catch (error) {
      this.logger.error('Error during initialization:', error);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.isInitialized || !this.model) {
      throw new Error('TensorFlowEmbeddingService not initialized');
    }

    try {
      // Generate embedding using Universal Sentence Encoder
      const embedding = await this.model.embed([text]);
      
      // Convert tensor to array
      const embeddingArray = await embedding.data();
      
      // Clean up tensor to prevent memory leaks
      embedding.dispose();
      return Array.from(embeddingArray);
    } catch (error) {
      this.logger.error(`Error generating embedding for "${text.substring(0, 50)}...":`, error);
      throw error;
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!this.isInitialized || !this.model) {
      throw new Error('TensorFlowEmbeddingService not initialized');
    }

    try {
      // Generate embeddings for multiple texts
      const embeddings = await this.model.embed(texts);
      
      // Convert tensor to array
      const embeddingArray = await embeddings.data();
      
      // Clean up tensor to prevent memory leaks
      embeddings.dispose();
      
      // Reshape array into 2D array
      const dimensionSize = embeddingArray.length / texts.length;
      const result: number[][] = [];
      
      for (let i = 0; i < texts.length; i++) {
        const start = i * dimensionSize;
        const end = start + dimensionSize;
        result.push(Array.from(embeddingArray.slice(start, end)));
      }
      return result;
    } catch (error) {
      this.logger.error(`Error generating embeddings for ${texts.length} texts:`, error);
      throw error;
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.model !== null;
  }

  getModelInfo(): { backend: string; isReady: boolean; modelName: string } {
    return {
      backend: tf.getBackend(),
      isReady: this.isReady(),
      modelName: 'Universal Sentence Encoder Lite'
    };
  }
}

