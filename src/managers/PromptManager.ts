import { Prompt, TEXT_TEMPLATES } from '../types/index.js';
import { logger } from "../utils/logger.js";
import { generatePrefixedUUID } from '../utils/uuid.js';

export class PromptManager {
  private prompts: Prompt[] = [];

  constructor() {
    this.loadPrompts();
  }

  async loadPrompts(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['prompts']);
      
      if (result.prompts) {
        this.prompts = result.prompts;
      } else {
        this.prompts = this.getDefaultPrompts();
      }
    } catch (error) {
      logger.error('Error loading prompts:', error);
      this.prompts = this.getDefaultPrompts();
    }
  }

  async savePrompts(): Promise<void> {
    try {
      await chrome.storage.local.set({ 
        prompts: this.prompts
      });
    } catch (error) {
      logger.error('Error saving prompts:', error);
    }
  }

  getDefaultPrompts(): Prompt[] {
    return TEXT_TEMPLATES.defaultPrompts;
  }

  getAllPrompts(): Prompt[] {
    return [...this.prompts];
  }


  getPromptById(id: string): Prompt | undefined {
    return this.prompts.find(prompt => prompt.id === id);
  }

  addPrompt(title: string, content: string): string {
    const id = this.generateId();
    const prompt: Prompt = {
      id,
      title,
      content
    };

    this.prompts.push(prompt);
    this.savePrompts();
    return id;
  }

  updatePrompt(id: string, updates: Partial<Prompt>): boolean {
    const index = this.prompts.findIndex(prompt => prompt.id === id);
    if (index === -1) return false;

    this.prompts[index] = { ...this.prompts[index], ...updates };
    this.savePrompts();
    return true;
  }

  deletePrompt(id: string): boolean {
    const index = this.prompts.findIndex(prompt => prompt.id === id);
    if (index === -1) return false;

    this.prompts.splice(index, 1);
    this.savePrompts();
    return true;
  }

  private generateId(): string {
    return generatePrefixedUUID('prompt');
  }
}
