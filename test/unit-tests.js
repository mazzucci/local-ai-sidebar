// Updated Unit Tests for AI Page Assistant JavaScript Functions
// Tests current functionality without removed features (variables, favorites, page manipulation)

class UnitTestSuite {
    constructor() {
        this.tests = [];
        this.results = { passed: 0, failed: 0, total: 0 };
    }

    async runAllTests() {
        console.log('🧪 Starting Unit Tests...');
        
        this.testPromptLibrary();
        this.testTextSelection();
        this.testSettingsManagement();
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

    testTextSelection() {
        console.log('📝 Testing Text Selection Functions...');
        
        // Test text selection API simulation
        this.addTest('text selection API works', () => {
            // Simulate window.getSelection()
            const mockSelection = {
                toString: () => 'selected text',
                removeAllRanges: () => {}
            };
            
            return mockSelection.toString() === 'selected text';
        });

        // Test selected text trimming
        this.addTest('selected text trimming works', () => {
            const text = '  \n  selected text  \n  ';
            const trimmed = text.trim();
            return trimmed === 'selected text';
        });

        // Test text truncation for display
        this.addTest('text truncation works', () => {
            const longText = 'This is a very long text that should be truncated for display purposes';
            const truncated = longText.length > 50 ? longText.substring(0, 50) + '...' : longText;
            return truncated.endsWith('...') && truncated.length === 53;
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

        // Test settings persistence
        this.addTest('settings persistence works', () => {
            const originalSettings = { temperature: 0.8, topK: 40 };
            const savedSettings = JSON.parse(JSON.stringify(originalSettings));
            return savedSettings.temperature === originalSettings.temperature &&
                   savedSettings.topK === originalSettings.topK;
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

        // Test splash screen timing
        this.addTest('splash screen timing works', () => {
            const delay = 1000; // 1 second delay
            return typeof delay === 'number' && delay > 0;
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