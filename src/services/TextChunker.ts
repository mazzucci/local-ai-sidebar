import nlp from 'compromise';
import { logger } from '../utils/logger';

export class TextChunker {
  private chunkSize: number;
  private chunkOverlap: number;

  constructor(chunkSize: number = 1000, chunkOverlap: number = 200) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
  }

  updateParameters(chunkSize: number, chunkOverlap: number): void {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
  }

  chunkText(text: string): string[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    // Clean the text
    const cleanedText = text.trim();
    
    // If text is smaller than chunk size, return as single chunk
    if (cleanedText.length <= this.chunkSize) {
      return [cleanedText];
    }

    // Split into sentences first
    const sentences = this.splitIntoSentences(cleanedText);
    
    if (sentences.length === 0) {
      return [cleanedText];
    }

    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let currentLength = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const sentenceLength = sentence.length;

      // If adding this sentence would exceed chunk size, finalize current chunk
      if (currentLength + sentenceLength > this.chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.join(' ').trim());
        
        // Start new chunk with overlap
        const overlapSentences = this.getOverlapSentences(currentChunk);
        currentChunk = [...overlapSentences, sentence];
        currentLength = overlapSentences.reduce((sum, s) => sum + s.length, 0) + sentenceLength;
      } else {
        currentChunk.push(sentence);
        currentLength += sentenceLength;
      }
    }

    // Add the last chunk if it has content
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' ').trim());
    }

    // Filter out empty chunks
    return chunks.filter(chunk => chunk.length > 0);
  }

  private splitIntoSentences(text: string): string[] {
    try {
      // Use compromise for better sentence boundary detection
      // It handles abbreviations, titles, edge cases much better than regex
      const doc = nlp(text);
      const sentences = doc.sentences().out('array');
      
      // If no sentences found, fallback to paragraph splitting
      if (sentences.length === 0) {
        return text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      }
      
      return sentences;
    } catch (error) {
      logger.warn('Failed to parse sentences with compromise, falling back to paragraph splitting:', error);
      // Fallback to simple paragraph splitting on error
      return text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    }
  }

  private getOverlapSentences(sentences: string[]): string[] {
    if (sentences.length === 0) return [];
    
    // Calculate how many sentences we need for overlap
    const targetOverlapLength = this.chunkOverlap;
    const overlapSentences: string[] = [];
    let currentLength = 0;

    // Start from the end and work backwards
    for (let i = sentences.length - 1; i >= 0; i--) {
      const sentence = sentences[i];
      if (currentLength + sentence.length <= targetOverlapLength) {
        overlapSentences.unshift(sentence);
        currentLength += sentence.length;
      } else {
        break;
      }
    }

    return overlapSentences;
  }

  // Utility method to get chunk statistics
  getChunkStats(text: string): { totalChunks: number; avgChunkSize: number; minChunkSize: number; maxChunkSize: number } {
    const chunks = this.chunkText(text);
    
    if (chunks.length === 0) {
      return { totalChunks: 0, avgChunkSize: 0, minChunkSize: 0, maxChunkSize: 0 };
    }

    const sizes = chunks.map(chunk => chunk.length);
    const avgChunkSize = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
    const minChunkSize = Math.min(...sizes);
    const maxChunkSize = Math.max(...sizes);

    return {
      totalChunks: chunks.length,
      avgChunkSize: Math.round(avgChunkSize),
      minChunkSize,
      maxChunkSize
    };
  }

  // Method to validate chunk parameters
  validateParameters(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.chunkSize <= 0) {
      errors.push('Chunk size must be greater than 0');
    }

    if (this.chunkOverlap < 0) {
      errors.push('Chunk overlap cannot be negative');
    }

    if (this.chunkOverlap >= this.chunkSize) {
      errors.push('Chunk overlap must be less than chunk size');
    }

    if (this.chunkSize > 10000) {
      errors.push('Chunk size should not exceed 10,000 characters for optimal performance');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
