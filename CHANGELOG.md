# Changelog

All notable changes to Local AI Sidebar will be documented in this file.

## [1.0.1] - 2025-10-15

### Added
- Real-time download progress monitoring with MB downloaded/total display
- Scrollable splash screen for better mobile and small screen support
- "New Chat" button to start fresh conversations
- Centralized conversation history across all tabs
- Enhanced splash screen with better user interaction requirements
- Custom scrollbar styling for splash screen

### Changed
- Improved splash screen user experience with real progress updates
- Updated button styling for consistency across all tabs (rounded corners, hover effects)
- Simplified tab functionality by removing per-tab conversation history
- Enhanced download progress display with actual file size information
- Updated documentation to reflect current features and architecture

### Fixed
- Fixed splash screen scrollability on small screens
- Fixed download progress to show real progress instead of fake animation
- Fixed availability check to use same options as model creation
- Fixed button styling consistency across all tabs
- Fixed padding inconsistencies between tabs
- Fixed user interaction requirement for model download

### Technical Improvements
- Proper Chrome Prompt API compliance with user interaction requirements
- Consistent model options between availability check and creation
- Real download progress monitoring with event listeners
- Improved error handling and user feedback
- Cleaner codebase with centralized debug logging
- Updated file structure documentation

## [1.0.0] - 2025-10-12

### Initial Release
- Privacy-first AI sidebar using Chrome's built-in AI
- Local processing with no data sharing
- Custom prompt library
- Manual paste content analysis
- Settings management
- Beautiful splash screen
- Modern UI with consistent styling
