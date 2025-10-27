import { ChatMessage, ChatState, TEXT_TEMPLATES } from '../types/index.js';
import { LLM_ROLE } from '../config/settings.js';
import { logger } from "../utils/logger.js";

export class ChatManager {
  private chatHistory: ChatMessage[] = [];

  constructor() {
    this.loadChatHistory();
  }

  async loadChatHistory(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['chatHistory']);
      if (result.chatHistory && Array.isArray(result.chatHistory)) {
        this.chatHistory = result.chatHistory as ChatMessage[];
      }
    } catch (error) {
      logger.error('Error loading chat history:', error);
    }
  }

  async saveChatHistory(): Promise<void> {
    try {
      await chrome.storage.local.set({ chatHistory: this.chatHistory });
    } catch (error) {
      logger.error('Error saving chat history:', error);
    }
  }

  addMessage(content: string, sender: 'user' | 'assistant'): void {
    const message: ChatMessage = {
      content,
      sender
    };

    this.chatHistory.push(message);
    this.saveChatHistory();
  }

  clearChatHistory(): void {
    this.chatHistory = [];
    this.saveChatHistory();
  }

  getAllMessages(): ChatMessage[] {
    return [...this.chatHistory];
  }

  getChatState(): ChatState {
    return {
      messages: this.getAllMessages(),
      isThinking: false,
      currentInput: ''
    };
  }

  formatMessage(content: string): string {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  // Add welcome message if chat history is empty
  addWelcomeMessageIfNeeded(): boolean {
    if (this.chatHistory.length === 0) {
      this.addMessage(TEXT_TEMPLATES.welcomeMessage, LLM_ROLE.ASSISTANT);
      logger.debug('Welcome message added (no existing chat history)');
      return true;
    }
    logger.debug('Skipping welcome message - existing chat history found');
    return false;
  }
}