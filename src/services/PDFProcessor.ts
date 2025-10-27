import * as pdfjsLib from 'pdfjs-dist';
import { logger } from "../utils/logger.js";
import { TEXT_TEMPLATES } from '../config/settings.js';

// Configure PDF.js worker for Chrome extension
// Use bundled worker file instead of external CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.js';

export interface PDFPage {
  pageNumber: number;
  text: string;
  wordCount: number;
}

export interface PDFExtractionResult {
  success: boolean;
  pages: PDFPage[];
  totalPages: number;
  totalTextLength: number;
  fileName: string;
  error?: string;
}

export class PDFProcessor {
  private logger = logger.createModuleLogger('PDFProcessor');

  async extractTextFromPDF(file: File): Promise<PDFExtractionResult> {
    try {
      return await this.extractWithPDFJS(file);
    } catch (error) {
      this.logger.error(`Error extracting text from PDF ${file.name}:`, error);
      
      return {
        success: false,
        pages: [],
        totalPages: 0,
        totalTextLength: 0,
        fileName: file.name,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async extractWithPDFJS(file: File): Promise<PDFExtractionResult> {
    // Convert File to ArrayBuffer
    const arrayBuffer = await this.fileToArrayBuffer(file);
    
    // Load PDF document
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    
    this.logger.info(`PDF loaded: ${totalPages} pages`);
    
    const pages: PDFPage[] = [];
    let totalTextLength = 0;
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine all text items into a single string
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .trim();
        
        const wordCount = pageText.split(/\s+/).filter(word => word.length > 0).length;
        
        pages.push({
          pageNumber: pageNum,
          text: pageText,
          wordCount
        });
        
        totalTextLength += pageText.length;
        
        this.logger.debug(`Page ${pageNum}: ${wordCount} words, ${pageText.length} characters`);
      } catch (pageError) {
        this.logger.warn(`Failed to extract text from page ${pageNum}:`, pageError);
        // Continue with other pages even if one fails
        pages.push({
          pageNumber: pageNum,
          text: `[Error extracting text from page ${pageNum}]`,
          wordCount: 0
        });
      }
    }
    
    const result: PDFExtractionResult = {
      success: true,
      pages,
      totalPages,
      totalTextLength,
      fileName: file.name
    };
    
    logger.success(`Successfully extracted text from PDF: ${file.name} (${totalPages} pages, ${totalTextLength} characters)`, 'PDFProcessor');
    return result;
  }


  async extractTextFromPDFWithPageInfo(file: File): Promise<string> {
    const result = await this.extractTextFromPDF(file);
    
    if (!result.success) {
      return TEXT_TEMPLATES.pdfFailureMessage;
    }
    
    // Combine all pages with page markers
    const combinedText = result.pages
      .map(page => `[Page ${page.pageNumber}]\n${page.text}`)
      .join('\n\n');
    
    return combinedText;
  }

  private async fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }


  // Utility method to get PDF statistics
  getPDFStats(result: PDFExtractionResult): {
    totalPages: number;
    totalWords: number;
    totalCharacters: number;
    averageWordsPerPage: number;
    successRate: number;
  } {
    const totalWords = result.pages.reduce((sum, page) => sum + page.wordCount, 0);
    const successRate = result.pages.filter(page => page.wordCount > 0).length / result.totalPages;
    
    return {
      totalPages: result.totalPages,
      totalWords,
      totalCharacters: result.totalTextLength,
      averageWordsPerPage: result.totalPages > 0 ? totalWords / result.totalPages : 0,
      successRate
    };
  }
}
