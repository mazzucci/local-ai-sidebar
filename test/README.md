# 🧪 Local AI Sidebar Test Suite

Reliable command-line testing suite for the Local AI Sidebar Chrome Extension with TypeScript implementation.

## 📋 Overview

This streamlined test suite focuses on reliable automated testing for the TypeScript implementation:

- **Unit Tests** - Test individual TypeScript modules and functions
- **Integration Tests** - Test component interactions and Chrome APIs
- **End-to-End Tests** - Test complete user workflows
- **Manual Testing** - Interactive test page for hands-on verification

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- Chrome browser
- Local AI Sidebar extension loaded
- TypeScript support

### Installation

```bash
cd test
npm install
```

### Running Tests

```bash
# Run all automated tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration

# Run with TypeScript compilation
npm run test:typescript

# Run with coverage
npm run test:coverage

# Watch mode (re-runs on file changes)
npm run test:watch

# Manual testing instructions
npm run manual
```

## 📁 Test Structure

```
test/
├── test-runner.js           # Main test runner
├── unit-tests.js            # Unit tests for TypeScript modules
├── integration-tests.js     # Integration tests
├── extension-test-page.html # Manual testing page
├── package.json             # Test dependencies with TypeScript support
└── README.md               # This file
```

## 🧪 Test Categories

### 1. TypeScript Module Tests
- ✅ PromptManager validation and CRUD operations
- ✅ SettingsManager temperature and model status validation
- ✅ UIManager tab switching and message formatting
- ✅ TemplateManager variable replacement and rendering
- ✅ ChatManager message structure and validation

### 2. Extension Setup Tests
- ✅ Manifest file validation
- ✅ Required files existence
- ✅ Chrome APIs availability
- ✅ LanguageModel API integration
- ✅ Sidebar iframe loading

### 3. Prompt Library Tests
- ✅ Prompt storage and retrieval
- ✅ Prompt CRUD operations (Create, Read, Update, Delete)
- ✅ Prompt validation with title and content
- ✅ Default prompts validation
- ✅ Modal form integration

### 4. Settings & Storage Tests
- ✅ Settings persistence
- ✅ Temperature validation (0-2 range)
- ✅ Model status integration
- ✅ Model parameters structure
- ✅ Tab change detection

### 5. Chat & AI Tests
- ✅ Chat input functionality
- ✅ Send button behavior
- ✅ Message display and formatting
- ✅ AI response handling
- ✅ Thinking indicator

### 6. Modal Integration Tests
- ✅ Modal show/hide functionality
- ✅ Form validation
- ✅ Event handling
- ✅ Data binding
- ✅ Add/Edit prompt workflows

## 🎯 Manual Testing

### Extension Test Page
For hands-on testing of the extension features:

1. **Load the extension** in Chrome
2. **Open `extension-test-page.html`** in your browser
3. **Follow the test instructions** on the page
4. **Test all features** interactively

The test page includes:
- **Text selection examples** for testing AI features
- **Sample content** for summarization and analysis
- **Interactive elements** for comprehensive testing

## 🔧 Configuration

### Test Environment Setup

1. **Load Extension**:
   ```bash
   # Load unpacked extension in Chrome
   chrome://extensions/ → Load unpacked → Select project folder
   ```

2. **Enable Developer Mode**:
   ```bash
   # Enable experimental APIs
   chrome://flags/#enable-experimental-web-platform-features
   ```

3. **Run Test Server**:
   ```bash
   # Start local server for testing
   python3 -m http.server 8000
   ```

### TypeScript Configuration

```javascript
// test-config.js
const config = {
  // TypeScript compilation
  typescript: {
    target: 'ES2020',
    module: 'ESNext',
    moduleResolution: 'node',
    strict: true
  },
  
  // Test URLs
  testUrls: [
    'http://localhost:8000/test-page.html',
    'https://example.com'
  ],
  
  // Test timeouts
  timeouts: {
    unit: 5000,
    integration: 10000,
    e2e: 30000
  },
  
  // Test data
  testData: {
    prompts: [
      { id: 'explain-text', title: 'Explain Text', content: 'Explain the following text in simple terms:' },
      { id: 'summarize', title: 'Summarize', content: 'Provide a concise summary of the following content:' },
      { id: 'fix-grammar', title: 'Fix Grammar', content: 'Fix any grammar and spelling errors in the following text:' }
    ],
    settings: { temperature: 0.7, topK: 40 },
    modelParams: {
      defaultTemperature: 0.7,
      maxTemperature: 2.0,
      defaultTopK: 40,
      maxTopK: 100
    }
  }
};
```

## 📊 Test Reports

### HTML Report
- **Visual Dashboard** - Color-coded test results
- **TypeScript Badge** - Indicates TypeScript implementation
- **Detailed Breakdown** - Per-category test results
- **Performance Metrics** - Test execution times
- **Error Analysis** - Failed test details

### Console Output
```bash
🧪 Starting Local AI Sidebar Test Suite...

📝 Running Unit Tests...
  ✅ PromptManager validation
  ✅ SettingsManager validation
  ✅ UIManager functionality
  ✅ TemplateManager rendering
  ✅ ChatManager message handling
  Unit Tests: 8 passed, 0 failed

🔗 Running Integration Tests...
  ✅ Extension loading with TypeScript
  ✅ Sidebar functionality integration
  ✅ Prompt library CRUD operations
  ✅ Settings persistence integration
  ✅ Chat integration with AI
  ✅ Modal integration
  Integration Tests: 9 passed, 0 failed

📊 Test Report
==================================================
Total Tests: 25
Passed: 25
Failed: 0
Duration: 1250ms
Success Rate: 100.0%
==================================================
🎉 All tests passed!
```

## 🐛 Debugging Tests

### Common Issues

1. **TypeScript Compilation Errors**:
   ```bash
   # Check TypeScript compilation
   npm run build
   ```

2. **Extension Not Loaded**:
   ```bash
   # Check if extension is loaded
   chrome://extensions/ → Verify Local AI Sidebar is enabled
   ```

3. **Chrome APIs Not Available**:
   ```bash
   # Verify manifest permissions
   Check manifest.json for required permissions
   ```

### Debug Mode

```bash
# Run tests with debug output
DEBUG=true npm test

# Run specific test with verbose output
npm test -- --verbose --testNamePattern="PromptManager"
```

## 🔄 Continuous Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: cd test && npm install
      - run: cd test && npm run test:typescript
```

### Pre-commit Hooks

```bash
# Install pre-commit hook
npm install --save-dev husky
npx husky add .husky/pre-commit "cd test && npm test"
```

## 📈 Coverage Reports

### Coverage Metrics
- **Line Coverage** - Percentage of code lines executed
- **Function Coverage** - Percentage of functions called
- **Branch Coverage** - Percentage of code branches tested
- **Statement Coverage** - Percentage of statements executed

### Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

## 🎯 Best Practices

### Writing Tests
1. **Test One Thing** - Each test should verify one specific behavior
2. **Use Descriptive Names** - Test names should clearly describe what's being tested
3. **Arrange-Act-Assert** - Structure tests with clear setup, execution, and verification
4. **Clean Up** - Always clean up test data and DOM modifications

### Test Organization
1. **Group Related Tests** - Organize tests by TypeScript module or component
2. **Use Setup/Teardown** - Common test setup and cleanup
3. **Mock External Dependencies** - Isolate units under test
4. **Test Edge Cases** - Include boundary conditions and error cases

## 🤝 Contributing

### Adding New Tests
1. **Identify Test Category** - Unit, Integration, or E2E
2. **Write Test Function** - Follow existing patterns
3. **Add to Test Suite** - Include in appropriate test runner
4. **Update Documentation** - Document new test coverage

### Test Maintenance
1. **Keep Tests Updated** - Update tests when TypeScript modules change
2. **Remove Obsolete Tests** - Clean up tests for removed features
3. **Optimize Performance** - Keep test execution time reasonable
4. **Review Coverage** - Ensure adequate test coverage

## 📞 Support

### Getting Help
- **Check Console** - Look for error messages in browser console
- **Review Logs** - Check test execution logs for details
- **Test Documentation** - Refer to test comments and documentation
- **Issue Reporting** - Report test failures with detailed information

### Troubleshooting
1. **Extension Issues** - Verify extension is properly loaded
2. **Permission Issues** - Check Chrome extension permissions
3. **API Issues** - Verify Chrome APIs are available
4. **Environment Issues** - Check test environment setup
5. **TypeScript Issues** - Verify TypeScript compilation

---

## 📊 Test Summary

### ✅ Reliable Command-Line Tests
- **Unit Tests** - TypeScript modules and functions (8 tests)
- **Integration Tests** - Chrome API interactions (9 tests)  
- **End-to-End Tests** - Complete workflows (8 tests)
- **Total: 25 automated tests** with 100% reliability

### 🎯 Manual Testing
- **Extension Test Page** - Interactive feature testing
- **Real Browser Context** - Test with actual extension loaded
- **User Experience** - Verify UI and interactions work correctly

### 🚀 Quick Start
```bash
cd test
npm install
npm test          # Run all automated tests
npm run test:typescript  # Run with TypeScript compilation
npm run manual    # Get manual testing instructions
```

**Happy Testing! 🎉**
