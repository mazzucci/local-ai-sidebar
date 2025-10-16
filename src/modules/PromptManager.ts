import { Prompt } from '../types/index.js';
import { debugError } from '../utils/debug.js';

export class PromptManager {
  private prompts: Prompt[] = [];

  constructor() {
    this.loadPrompts();
  }

  async loadPrompts(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get(['prompts']);
      
      if (result.prompts) {
        this.prompts = result.prompts;
      } else {
        this.prompts = this.getDefaultPrompts();
      }
    } catch (error) {
      debugError('Error loading prompts:', error);
      this.prompts = this.getDefaultPrompts();
    }
  }

  async savePrompts(): Promise<void> {
    try {
      await chrome.storage.sync.set({ 
        prompts: this.prompts
      });
    } catch (error) {
      debugError('Error saving prompts:', error);
    }
  }

  getDefaultPrompts(): Prompt[] {
    return [
      {
        id: 'explain-text',
        title: 'Explain Text',
        content: 'Explain the following text in simple terms:'
      },
      {
        id: 'summarize',
        title: 'Summarize',
        content: 'Provide a concise summary of the following content:'
      },
      {
        id: 'fix-grammar',
        title: 'Fix Grammar',
        content: 'Fix any grammar and spelling errors in the following text:'
      }
    ];
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
    return 'prompt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}
