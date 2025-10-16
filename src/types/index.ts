// Type definitions for Local AI Sidebar

export interface ChatMessage {
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
}

export interface Settings {
  temperature: number;
  topK: number;
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
