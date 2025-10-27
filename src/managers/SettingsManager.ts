import { Settings } from '../types/index.js';
import { DEFAULT_SETTINGS } from '../config/settings.js';
import { logger } from "../utils/logger.js";

export class SettingsManager {
  private settings: Settings = DEFAULT_SETTINGS;

  constructor() {
    this.loadSettings();
  }

  async loadSettings(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['settings']);
      if (result.settings) {
        this.settings = { ...DEFAULT_SETTINGS, ...result.settings };
      }
    } catch (error) {
      logger.error('Error loading settings:', error);
    }
  }

  async saveSettings(): Promise<void> {
    try {
      await chrome.storage.local.set({ settings: this.settings });
    } catch (error) {
      logger.error('Error saving settings:', error);
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
}
