import { Settings, ModelParameters, ModelStatus, SettingsState } from '../types/index.js';
import { debugLog, debugError } from '../utils/debug.js';

export class SettingsManager {
  private settings: Settings = {
    temperature: 0.7,
    topK: 40
  };
  private modelParams: ModelParameters | null = null;
  private modelStatus: ModelStatus = 'checking';

  constructor() {
    this.loadSettings();
  }

  async loadSettings(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get(['temperature', 'topK']);
      this.settings = {
        temperature: result.temperature || 0.7,
        topK: result.topK || 40
      };
    } catch (error) {
      debugError('Error loading settings:', error);
    }
  }

  async saveSettings(): Promise<void> {
    try {
      await chrome.storage.sync.set(this.settings);
    } catch (error) {
      debugError('Error saving settings:', error);
    }
  }

  getSettings(): Settings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<Settings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
  }

  setTemperature(temperature: number): void {
    this.settings.temperature = temperature;
    this.saveSettings();
  }

  setTopK(topK: number): void {
    this.settings.topK = topK;
    this.saveSettings();
  }

  getTemperature(): number {
    return this.settings.temperature;
  }

  getTopK(): number {
    return this.settings.topK;
  }

  setModelParameters(params: ModelParameters): void {
    this.modelParams = params;
  }

  getModelParameters(): ModelParameters | null {
    return this.modelParams;
  }

  setModelStatus(status: ModelStatus): void {
    this.modelStatus = status;
  }

  getModelStatus(): ModelStatus {
    return this.modelStatus;
  }

  getSettingsState(): SettingsState {
    return {
      settings: this.getSettings(),
      modelParams: this.modelParams,
      modelStatus: this.modelStatus,
      isDownloading: this.modelStatus === 'downloading'
    };
  }

  async loadModelParameters(): Promise<ModelParameters | null> {
    try {
      if (!this.isModelAvailable()) {
        return null;
      }

      const params = await (window as any).LanguageModel.params();
      debugLog('Raw model parameters from LanguageModel.params():', params);
      if (params) {
        // Normalize the parameter names to match our template
        const normalizedParams = {
          defaultTemperature: params.defaultTemperature || params.temperature?.default || params.temperatureDefault || 0.7,
          maxTemperature: params.maxTemperature || params.temperature?.max || params.temperatureMax || 2.0,
          defaultTopK: params.defaultTopK || params.topK?.default || params.topKDefault || 40,
          maxTopK: params.maxTopK || params.topK?.max || params.topKMax || 100
        };
        
        debugLog('Normalized model parameters:', normalizedParams);
        this.setModelParameters(normalizedParams);
        debugLog('Model parameters set:', this.modelParams);
        return normalizedParams;
      } else {
        debugLog('LanguageModel.params() returned null/undefined, using defaults');
        
        // Use default parameters when API returns null
        const defaultParams = {
          defaultTemperature: 0.7,
          maxTemperature: 2.0,
          defaultTopK: 40,
          maxTopK: 100
        };
        
        this.setModelParameters(defaultParams);
        return defaultParams;
      }
    } catch (error) {
      debugError('Error loading model parameters:', error);
      debugLog('Using default model parameters due to error');
      
      // Use default parameters as fallback
      const defaultParams = {
        defaultTemperature: 0.7,
        maxTemperature: 2.0,
        defaultTopK: 40,
        maxTopK: 100
      };
      
      this.setModelParameters(defaultParams);
      return defaultParams;
    }
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

  async checkModelAvailability(): Promise<ModelStatus> {
    try {
      debugLog('Checking Prompt API availability...');
      
      // Check if LanguageModel is available in global scope (not chrome.ai)
      if (!('LanguageModel' in window)) {
        debugError('LanguageModel is not available in window');
        this.modelStatus = 'error';
        return 'error';
      }
      
      debugLog('LanguageModel is available, checking model availability...');

      const modelOptions = {
        language: 'en' as const,
        outputLanguage: 'en' as const
      };

      // Use global LanguageModel, not chrome.ai.LanguageModel
      // IMPORTANT: Use the same options that will be used in create() call
      const availability = await (window as any).LanguageModel.availability(modelOptions);
      debugLog('Model availability result:', availability);
      
      switch (availability) {
        case 'available':
          this.modelStatus = 'available';
          debugLog('Model is available');
          break;
        case 'downloadable':
          this.modelStatus = 'downloadable';
          debugLog('Model is downloadable');
          break;
        case 'downloading':
          this.modelStatus = 'downloading';
          debugLog('Model is downloading');
          break;
        case 'unavailable':
          this.modelStatus = 'error';
          debugLog('Model is unavailable');
          break;
        default:
          debugError('Unknown availability status:', availability);
          this.modelStatus = 'error';
      }

      return this.modelStatus;
    } catch (error) {
      debugError('Error checking model availability:', error);
      this.modelStatus = 'error';
      return 'error';
    }
  }

  async downloadModel(): Promise<boolean> {
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
            debugLog(`Download progress: ${progress}% (${e.loaded}/${e.total})`);
            
            // Dispatch custom event to update UI
            const event = new CustomEvent('downloadProgressUpdate', {
              detail: { progress, loaded: e.loaded, total: e.total }
            });
            document.dispatchEvent(event);
          });
        }
      };

      await (window as any).LanguageModel.create(modelOptions);
      this.modelStatus = 'available';
      return true;
    } catch (error) {
      debugError('Error downloading model:', error);
      this.modelStatus = 'error';
      return false;
    }
  }
}
