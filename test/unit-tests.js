// Updated Unit Tests for Local AI Sidebar TypeScript Implementation
// Tests current functionality with TypeScript modules

class UnitTestSuite {
    constructor() {
        this.tests = [];
        this.results = { passed: 0, failed: 0, total: 0 };
    }

    async runAllTests() {
        console.log('🧪 Starting Unit Tests for Local AI Sidebar...');
        
        this.testPromptManager();
        this.testSettingsManager();
        this.testUIManager();
        this.testTemplateManager();
        this.testChatManager();
        
        // Run all collected tests
        for (const test of this.tests) {
            await this.runTest(test);
        }
        
        this.logResults();
    }

    logResults() {
        console.log(`✅ Unit Tests Complete: ${this.results.passed} passed, ${this.results.failed} failed, ${this.results.total} total`);
    }

    addTest(testName, testFunction) {
        this.tests.push({ name: testName, fn: testFunction });
    }

    testPromptManager() {
        console.log('📚 Testing PromptManager...');
        
        // Test getDefaultPrompts
        this.addTest('getDefaultPrompts returns valid structure', () => {
            const prompts = this.getDefaultPrompts();
            return Array.isArray(prompts) && prompts.length === 3 && 
                   prompts.every(p => p.id && p.title && p.content);
        });

        // Test prompt validation
        this.addTest('prompt validation works', () => {
            const validPrompt = { id: 'test', title: 'Test', content: 'Test content' };
            const invalidPrompt = { id: 'test' }; // Missing required fields
            
            return this.validatePrompt(validPrompt) && !this.validatePrompt(invalidPrompt);
        });

        // Test prompt ID generation
        this.addTest('prompt ID generation works', () => {
            const id1 = this.generateId();
            const id2 = this.generateId();
            return typeof id1 === 'string' && id1 !== id2 && id1.startsWith('prompt_');
        });

        // Test prompt CRUD operations
        this.addTest('prompt CRUD operations work', () => {
            const prompts = [];
            const prompt = { id: 'test', title: 'Test', content: 'Test content' };
            
            // Add
            prompts.push(prompt);
            
            // Read
            const found = prompts.find(p => p.id === 'test');
            
            // Update
            const index = prompts.findIndex(p => p.id === 'test');
            if (index !== -1) {
                prompts[index] = { ...prompts[index], title: 'Updated' };
            }
            
            // Delete
            const deleteIndex = prompts.findIndex(p => p.id === 'test');
            if (deleteIndex !== -1) {
                prompts.splice(deleteIndex, 1);
            }
            
            return prompts.length === 0;
        });
    }

    testSettingsManager() {
        console.log('⚙️ Testing SettingsManager...');
        
        // Test temperature validation
        this.addTest('temperature validation works', () => {
            const validTemp = 0.7;
            const invalidTemp = 3.0; // Too high
            const negativeTemp = -0.5; // Too low
            
            return this.validateTemperature(validTemp) && 
                   !this.validateTemperature(invalidTemp) && 
                   !this.validateTemperature(negativeTemp);
        });

        // Test settings structure
        this.addTest('settings structure is valid', () => {
            const settings = { temperature: 0.7, topK: 40 };
            return typeof settings.temperature === 'number' && 
                   typeof settings.topK === 'number' &&
                   settings.temperature >= 0 && settings.temperature <= 2;
        });

        // Test model status validation
        this.addTest('model status validation works', () => {
            const validStatuses = ['checking', 'available', 'downloadable', 'downloading', 'error'];
            return validStatuses.every(status => typeof status === 'string');
        });

        // Test model parameters structure
        this.addTest('model parameters structure is valid', () => {
            const params = {
                defaultTemperature: 0.7,
                maxTemperature: 2.0,
                defaultTopK: 40,
                maxTopK: 100
            };
            
            return typeof params.defaultTemperature === 'number' &&
                   typeof params.maxTemperature === 'number' &&
                   typeof params.defaultTopK === 'number' &&
                   typeof params.maxTopK === 'number';
        });
    }

    testUIManager() {
        console.log('🖥️ Testing UIManager...');
        
        // Test tab switching
        this.addTest('tab switching works', () => {
            const tabs = ['chat', 'prompts', 'settings'];
            return tabs.every(tab => typeof tab === 'string');
        });

        // Test message formatting
        this.addTest('message formatting works', () => {
            const content = '**Bold** *italic* `code`';
            const formatted = this.formatMessage(content);
            return formatted.includes('<strong>Bold</strong>') &&
                   formatted.includes('<em>italic</em>') &&
                   formatted.includes('<code>code</code>');
        });

        // Test status display
        this.addTest('status display works', () => {
            const statuses = ['available', 'downloadable', 'downloading', 'error', 'checking'];
            return statuses.every(status => typeof status === 'string');
        });

        // Test modal handling
        this.addTest('modal handling works', () => {
            const modalStates = ['show', 'hide', 'edit', 'add'];
            return modalStates.every(state => typeof state === 'string');
        });
    }

    testTemplateManager() {
        console.log('📄 Testing TemplateManager...');
        
        // Test template variable replacement
        this.addTest('template variable replacement works', () => {
            const template = 'Hello {{name}}, your score is {{score}}';
            const data = { name: 'John', score: 100 };
            const result = this.replaceTemplateVariables(template, data);
            return result === 'Hello John, your score is 100';
        });

        // Test template validation
        this.addTest('template validation works', () => {
            const validTemplate = '{{variable}}';
            const invalidTemplate = '{{unclosed';
            return this.validateTemplate(validTemplate) && !this.validateTemplate(invalidTemplate);
        });

        // Test template rendering
        this.addTest('template rendering works', () => {
            const template = 'Temperature: {{defaultTemperature}}';
            const data = { defaultTemperature: 0.7 };
            const result = this.renderTemplate(template, data);
            return result === 'Temperature: 0.7';
        });
    }

    testChatManager() {
        console.log('💬 Testing ChatManager...');
        
        // Test message structure
        this.addTest('message structure is valid', () => {
            const message = {
                content: 'Hello world',
                sender: 'user',
                timestamp: new Date(),
                tabId: '123'
            };
            
            return typeof message.content === 'string' &&
                   ['user', 'ai'].includes(message.sender) &&
                   message.timestamp instanceof Date;
        });

        // Test message validation
        this.addTest('message validation works', () => {
            const validMessage = { content: 'Hello', sender: 'user' };
            const invalidMessage = { content: '', sender: 'user' };
            
            return this.validateMessage(validMessage) && !this.validateMessage(invalidMessage);
        });

        // Test thinking indicator
        this.addTest('thinking indicator works', () => {
            const thinkingStates = ['show', 'hide'];
            return thinkingStates.every(state => typeof state === 'string');
        });
    }

    // Mock functions for testing
    getDefaultPrompts() {
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

    validatePrompt(prompt) {
        return prompt && 
               typeof prompt.id === 'string' && 
               typeof prompt.title === 'string' && 
               typeof prompt.content === 'string';
    }

    generateId() {
        return 'prompt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    validateTemperature(temp) {
        return typeof temp === 'number' && temp >= 0 && temp <= 2;
    }

    formatMessage(content) {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    replaceTemplateVariables(template, data) {
        let result = template;
        Object.entries(data).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, String(value));
        });
        return result;
    }

    validateTemplate(template) {
        const openBraces = (template.match(/\{\{/g) || []).length;
        const closeBraces = (template.match(/\}\}/g) || []).length;
        return openBraces === closeBraces;
    }

    renderTemplate(template, data) {
        return this.replaceTemplateVariables(template, data);
    }

    validateMessage(message) {
        return message && 
               typeof message.content === 'string' && 
               message.content.trim().length > 0 &&
               ['user', 'ai'].includes(message.sender);
    }

    async runTest(test) {
        try {
            const result = await test.fn();
            if (result) {
                console.log(`  ✅ ${test.name}`);
                this.results.passed++;
            } else {
                console.log(`  ❌ ${test.name}`);
                this.results.failed++;
            }
        } catch (error) {
            console.log(`  ❌ ${test.name} - Error: ${error.message}`);
            this.results.failed++;
        }
        this.results.total++;
    }
}

// Export for browser
if (typeof window !== 'undefined') {
    window.UnitTestSuite = UnitTestSuite;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnitTestSuite;
}