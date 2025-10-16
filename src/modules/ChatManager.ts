import { ChatMessage, ChatState } from '../types/index.js';
import { debugError } from '../utils/debug.js';

export class ChatManager {
  private chatHistory: ChatMessage[] = [];

  constructor() {
    this.loadChatHistory();
  }

  async loadChatHistory(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['chatHistory']);
      if (result.chatHistory) {
        this.chatHistory = result.chatHistory.map((message: any) => ({
          ...message,
          timestamp: new Date(message.timestamp)
        }));
      }
    } catch (error) {
      debugError('Error loading chat history:', error);
    }
  }

  async saveChatHistory(): Promise<void> {
    try {
      await chrome.storage.local.set({ chatHistory: this.chatHistory });
    } catch (error) {
      debugError('Error saving chat history:', error);
    }
  }

  addMessage(content: string, sender: 'user' | 'ai'): void {
    const message: ChatMessage = {
      content,
      sender,
      timestamp: new Date()
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
}