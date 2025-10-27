// Template Manager for HTML templates
import { logger } from "../utils/logger.js";

export class TemplateManager {
  private static templates: Map<string, HTMLTemplateElement> = new Map();

  static loadTemplates(): void {
    const templateElements = document.querySelectorAll('template[id]');
    templateElements.forEach(template => {
      const id = template.getAttribute('id');
      if (id) {
        this.templates.set(id, template as HTMLTemplateElement);
      }
    });
  }

  static getTemplate(id: string): HTMLTemplateElement | null {
    return this.templates.get(id) || null;
  }

  static cloneTemplate(id: string): DocumentFragment | null {
    const template = this.getTemplate(id);
    if (!template) {
      logger.warn(`Template with id "${id}" not found`);
      return null;
    }
    return template.content.cloneNode(true) as DocumentFragment;
  }

  static renderTemplate(id: string, data: Record<string, any> = {}): string {
    const template = this.getTemplate(id);
    if (!template) {
      logger.warn(`Template with id "${id}" not found`);
      return '';
    }

    let html = template.innerHTML;
    
    // Simple template variable replacement
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, String(value));
    });

    return html;
  }

  static createElementFromTemplate(id: string, data: Record<string, any> = {}): HTMLElement | null {
    const html = this.renderTemplate(id, data);
    if (!html) return null;

    const container = document.createElement('div');
    container.innerHTML = html;
    return container.firstElementChild as HTMLElement;
  }
}
