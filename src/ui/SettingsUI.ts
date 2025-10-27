import { TemplateManager } from './TemplateManager.js';
import { SettingsManager } from '../managers/SettingsManager.js';
import { logger } from "../utils/logger.js";

export class SettingsUI {
  private settingsManager: SettingsManager;
  private logger = logger.createModuleLogger('SettingsUI');

  constructor(settingsManager: SettingsManager) {
    this.settingsManager = settingsManager;
  }

  async init(): Promise<void> {
    try {
      this.setupEventListeners();
    } catch (error) {
      this.logger.error('SettingsUI initialization failed:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    // Settings controls
    const temperatureSlider = document.getElementById('temperature') as HTMLInputElement;
    const topkSlider = document.getElementById('topk') as HTMLInputElement;

    if (temperatureSlider) {
      temperatureSlider.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        this.updateParameterDisplay('temperature', parseFloat(target.value));
      });
    }

    if (topkSlider) {
      topkSlider.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        this.updateParameterDisplay('topk', parseInt(target.value));
      });
    }

    // Settings controls (RAG + LLM)
    this.setupSettingsControls();
  }

  private setupSettingsControls(): void {
    // Max RAG sources
    const maxRAGSourcesInput = document.getElementById('max-rag-sources') as HTMLInputElement;
    if (maxRAGSourcesInput) {
      maxRAGSourcesInput.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.updateSetting('maxSources', parseInt(target.value));
      });
    }

    // Min similarity threshold
    const minSimilaritySlider = document.getElementById('min-similarity') as HTMLInputElement;
    if (minSimilaritySlider) {
      minSimilaritySlider.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const value = parseFloat(target.value);
        this.updateParameterDisplay('min-similarity', value);
        this.updateSetting('minSimilarityThreshold', value);
      });
    }
  }

  private updateSetting(key: string, value: any): void {
    // Update settings directly through SettingsManager
    this.settingsManager.updateSettings({ [key]: value });
    this.logger.debug(`Updated setting: ${key} = ${value}`);
  }

  updateParameterDisplay(param: string, value: number): void {
    const valueElement = document.getElementById(`${param}-value`);
    if (valueElement) {
      valueElement.textContent = value.toString();
    }
  }

  updateModelStatusDisplay(status: string, message?: string): void {
    const statusInfo = document.getElementById('model-status-info');
    if (!statusInfo) return;

    let statusText = '';
    let statusClass = 'status-secondary';

    switch (status) {
      case 'available':
        statusText = 'AI model is ready and available';
        statusClass = 'status-success';
        break;
      case 'downloadable':
        statusText = 'AI model needs to be downloaded';
        statusClass = 'status-warning';
        break;
      case 'downloading':
        statusText = 'AI model is downloading...';
        statusClass = 'status-info';
        break;
      case 'error':
        statusText = 'AI model is not available';
        statusClass = 'status-error';
        break;
      case 'checking':
        statusText = 'Checking model availability...';
        statusClass = 'status-secondary';
        break;
      default:
        statusText = message || 'Unknown status';
        statusClass = 'status-secondary';
    }

    statusInfo.innerHTML = `<p class="status-text ${statusClass}">${statusText}</p>`;
  }

  updateModelParamsDisplay(params: any): void {
    const paramsInfo = document.getElementById('model-params-info');
    if (!paramsInfo) return;

    if (typeof params === 'string') {
      paramsInfo.innerHTML = `<p class="status-text status-error">${params}</p>`;
      return;
    }

    const html = TemplateManager.renderTemplate('model-params-template', params);
    paramsInfo.innerHTML = html;
  }

  updateStatus(message: string): void {
    const statusElement = document.getElementById('status-message');
    if (statusElement) {
      statusElement.textContent = message;
      
      // Add confirmation animation
      statusElement.style.opacity = '1';
      setTimeout(() => {
        statusElement.style.opacity = '0.7';
      }, 2000);
    }
  }

  loadSettingsIntoUI(): void {
    // Load settings from SettingsManager
    const settings = this.settingsManager.getSettings();
    
    // Update UI elements with current settings
    const maxRAGSourcesInput = document.getElementById('max-rag-sources') as HTMLInputElement;
    if (maxRAGSourcesInput) {
      maxRAGSourcesInput.value = settings.maxSources.toString();
    }
    
    const minSimilaritySlider = document.getElementById('min-similarity') as HTMLInputElement;
    if (minSimilaritySlider) {
      minSimilaritySlider.value = settings.minSimilarityThreshold.toString();
      this.updateParameterDisplay('min-similarity', settings.minSimilarityThreshold);
    }
  }

}
