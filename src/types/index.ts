// Type definitions for Local AI Sidebar

export interface ChatMessage {
  content: string;
  sender: 'user' | 'assistant';
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
}

export interface Settings {
  // LLM generation parameters
  temperature: number;
  topK: number;
  maxTemperature: number;     // UI read-only, used for validation
  maxTopK: number;            // UI read-only, used for validation
  maxRecentMessages: number;  // UI read-only, limits conversation context
  
  // RAG search parameters
  maxSources: number;
  minSimilarityThreshold: number;
}

export interface ModelParameters {
  defaultTemperature: number;
  maxTemperature: number;
  defaultTopK: number;
  maxTopK: number;
}

export type ModelStatus = 'checking' | 'available' | 'downloadable' | 'downloading' | 'error';

export interface DownloadProgress {
  loaded: number;
  total: number;
}

export interface SplashScreenState {
  isVisible: boolean;
  status: ModelStatus;
  message: string;
  showDownloadOption: boolean;
  showProgress: boolean;
  progress: number;
}

export interface ChatState {
  messages: ChatMessage[];
  isThinking: boolean;
  currentInput: string;
}

export interface PromptLibraryState {
  prompts: Prompt[];
  favorites: Prompt[];
  isEditing: boolean;
  editingPrompt: Prompt | null;
}

export interface SettingsState {
  settings: Settings;
  modelParams: ModelParameters | null;
  modelStatus: ModelStatus;
  isDownloading: boolean;
}

// Re-export knowledge types
export * from './knowledge.js';

// Re-export settings
export * from '../config/settings.js';
