// Centralized settings and text templates for Local AI Sidebar

// LLM API role types (used for chat messages and LLM communication)
export const LLM_ROLE = {
  SYSTEM: 'system' as const,
  USER: 'user' as const,
  ASSISTANT: 'assistant' as const
};

// Default settings for all user-configurable parameters
export const DEFAULT_SETTINGS = {
  // LLM generation parameters
  temperature: 0.7,
  topK: 40,
  maxTemperature: 2.0,     // UI read-only, used for validation
  maxTopK: 100,            // UI read-only, used for validation
  maxRecentMessages: 10,   // UI read-only, limits conversation context
  
  // RAG search parameters
  maxSources: 3,
  minSimilarityThreshold: 0.3
};

// Text Templates Configuration
export const TEXT_TEMPLATES = {
  // System message for AI assistant
  systemMessage: 'You are a helpful AI assistant. Provide informative and helpful responses about the content they share.',

  // RAG prompt template
  ragPrompt: `Answer the user's question comprehensively and accurately. Use the provided knowledge base information to enhance your response when relevant, but also draw from your general knowledge.

KNOWLEDGE BASE CONTEXT:
{{contextSections}}

USER QUESTION: {{query}}

INSTRUCTIONS:
1. Answer the question using your general knowledge
2. If the knowledge base contains relevant information, incorporate it seamlessly into your response
3. If the knowledge base doesn't contain relevant information, answer using only your general knowledge
4. Do NOT mention the knowledge base, RAG system, or that information is/isn't available
5. Do NOT explain why you're using general knowledge vs knowledge base information
6. Be specific and cite the relevant sources when using knowledge base information
7. If you're uncertain about something, say so rather than guessing
8. When referencing knowledge base information, use the format: (Document Name) or (Document Name - page X) if page number is mentioned
9. Always include the document name, and include page numbers only when they are explicitly mentioned in the source text
10. Do NOT use generic references like "Source 1" or "Page 10" without the document name

Please provide a helpful and accurate response.`,

  // Generic response template (when no RAG sources found)
  genericPrompt: `Answer the following question to the best of your ability. If you don't know something, say so rather than making it up.

Question: {{query}}

Please provide a helpful response.`,

  // Error response template
  errorResponse: 'I apologize, but I encountered an error while processing your request. Please try again.',

  // PDF failure message template
  pdfFailureMessage: `PDF Text Extraction Failed

This PDF could not be processed for automatic text extraction. This commonly happens with:
- Scanned documents (image-based PDFs)
- PDFs with complex layouts or formatting
- Password-protected or encrypted PDFs
- PDFs with custom fonts or encoding

Recommended Actions:
1. Try copying important text from the PDF and adding it as text knowledge
2. Use the PDF filename for reference in your knowledge base
3. Consider converting the PDF to a text document first

The PDF has been added to your knowledge base for reference, but the content is not searchable through the chat interface.`,

  // Welcome message
  welcomeMessage: 'Local AI: Hello! I can help you with any content. Type your message below or use the quick prompts below for quick access.',

  // Default prompts
  defaultPrompts: [
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
  ]
};
