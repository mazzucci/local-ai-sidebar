export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'pdf';
  chunks: string[];
  chunkCount: number;
}

export interface KnowledgeChunk {
  id: string;
  knowledgeId: string;
  chunkIndex: number;
  text: string;
  embedding?: number[];
}

export interface KnowledgeSource {
  knowledgeId: string;
  title: string;
  chunkIndex: number;
  text: string;
  similarity: number;
  pageNumber?: number;
}

export interface RAGResponse {
  content: string;
}

export interface KnowledgeSearchResult {
  items: KnowledgeItem[];
  totalCount: number;
  searchTime: number;
}

export interface KnowledgeSettings {
  autoDeleteAfterDays?: number;
  chunkSize: number;
  chunkOverlap: number;
}

export interface EmbeddingRecord {
  id: string;
  knowledgeId: string;
  chunkIndex: number;
  embedding: number[];
  text: string;
}
