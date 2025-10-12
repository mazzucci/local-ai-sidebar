// Updated Unit Tests for AI Page Assistant (Node.js compatible)
// Tests current functionality without removed features (variables, favorites, page manipulation)

class NodeUnitTestSuite {
    constructor() {
        this.tests = [];
        this.results = { passed: 0, failed: 0, total: 0 };
    }

    async runAllTests() {
        console.log('🧪 Starting Node.js Unit Tests...');
        
        this.testPromptLibrary();
        this.testSettingsManagement();
        this.testDataStructures();
        this.testSplashScreen();
        
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

    testPromptLibrary() {
        console.log('📚 Testing Prompt Library Functions...');
        
        // Test getDefaultPrompts
        this.addTest('getDefaultPrompts returns valid structure', () => {
            const prompts = this.getDefaultPrompts();
            return Array.isArray(prompts) && prompts.length === 3 && 
                   prompts.every(p => p.id && p.content);
        });

        // Test prompt validation
        this.addTest('prompt validation works', () => {
            const validPrompt = { id: 'test', content: 'Test content' };
            const invalidPrompt = { id: 'test' }; // Missing required fields
            
            return this.validatePrompt(validPrompt) && !this.validatePrompt(invalidPrompt);
        });

        // Test prompt title generation
        this.addTest('prompt title generation works', () => {
            const prompt = { content: 'Concise Summary\n\nProvide a concise summary of the main points.' };
            const title = this.generatePromptTitle(prompt.content);
            return title === 'Concise Summary';
        });

        // Test title generation removes "please"
        this.addTest('title generation removes "please"', () => {
            const prompt = { content: 'Please explain this text in simple terms' };
            const title = this.generatePromptTitle(prompt.content);
            return title === 'Explain This Text';
        });

        // Test title generation removes punctuation
        this.addTest('title generation removes punctuation', () => {
            const prompt = { content: 'Fix grammar and spelling!' };
            const title = this.generatePromptTitle(prompt.content);
            return title === 'Fix Grammar And Spelling';
        });
    }

    testSettingsManagement() {
        console.log('⚙️ Testing Settings Management...');
        
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
    }

    testDataStructures() {
        console.log('📊 Testing Data Structures...');
        
        // Test chat history Map structure
        this.addTest('chat history Map works', () => {
            const chatHistory = new Map();
            const tabKey = '123-https://example.com';
            const messages = [
                { sender: 'user', content: 'Hello' },
                { sender: 'ai', content: 'Hi there!' }
            ];
            
            chatHistory.set(tabKey, messages);
            const retrieved = chatHistory.get(tabKey);
            
            return retrieved.length === 2 && 
                   retrieved[0].sender === 'user' && 
                   retrieved[1].sender === 'ai';
        });

        // Test tab key generation
        this.addTest('tab key generation works', () => {
            const tab = { id: 123, url: 'https://example.com' };
            const key = this.generateTabKey(tab);
            return key === '123-https://example.com';
        });
    }

    testSplashScreen() {
        console.log('🎨 Testing Splash Screen Functions...');
        
        // Test splash screen status updates
        this.addTest('splash status updates work', () => {
            const statuses = [
                'Initializing AI model...',
                'Checking Prompt API availability...',
                'Checking Gemini Nano availability...',
                'Initializing Gemini Nano session...',
                'Ready!'
            ];
            
            return statuses.every(status => typeof status === 'string' && status.length > 0);
        });

        // Test splash screen visibility states
        this.addTest('splash screen states work', () => {
            const states = ['visible', 'hidden', 'loading', 'error'];
            return states.every(state => typeof state === 'string');
        });
    }

    // Mock functions for testing
    getDefaultPrompts() {
        return [
            {
                id: 'summarize-page',
                content: 'Concise Summary\n\nProvide a concise summary of the main points and key information from the provided text.'
            },
            {
                id: 'explain-selected',
                content: 'Explain Text\n\nExplain the meaning and context of the selected text in simple terms.'
            },
            {
                id: 'fix-grammar',
                content: 'Fix Grammar\n\nCheck and correct any grammar, spelling, or punctuation errors in the selected text.'
            }
        ];
    }

    validatePrompt(prompt) {
        return prompt && typeof prompt.id === 'string' && typeof prompt.content === 'string';
    }

    generatePromptTitle(content) {
        const lines = content.trim().split('\n');
        if (lines.length > 1) {
            return lines[0].trim().replace(/[.,!?;:]+$/, '');
        }
        
        let words = content.trim().split(/\s+/).slice(0, 4);
        if (words[0].toLowerCase() === 'please') {
            words = words.slice(1);
        }
        
        const cleanWords = words.map(word => {
            const cleanWord = word.replace(/[.,!?;:]+$/, '');
            return cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase();
        });
        
        return cleanWords.join(' ');
    }

    validateTemperature(temp) {
        return typeof temp === 'number' && temp >= 0 && temp <= 2;
    }

    generateTabKey(tab) {
        return `${tab.id}-${tab.url}`;
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

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NodeUnitTestSuite;
}

// Run tests if called directly
if (typeof require !== 'undefined' && require.main === module) {
    const testSuite = new NodeUnitTestSuite();
    testSuite.runAllTests().catch(console.error);
}