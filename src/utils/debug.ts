// Debug logging utility for Local AI Extension

// Debug mode - set to true for local development
const DEBUG_MODE = true;

// Debug logging helper
export const debugLog = (...args: any[]): void => {
  if (DEBUG_MODE) {
    console.log(...args);
  }
};

export const debugError = (...args: any[]): void => {
  if (DEBUG_MODE) {
    console.error(...args);
  }
};

export const debugWarn = (...args: any[]): void => {
  if (DEBUG_MODE) {
    console.warn(...args);
  }
};

export const debugInfo = (...args: any[]): void => {
  if (DEBUG_MODE) {
    console.info(...args);
  }
};

// Utility to check if debug mode is enabled
export const isDebugMode = (): boolean => {
  return DEBUG_MODE;
};

// Utility to set debug mode (useful for runtime control)
export const setDebugMode = (enabled: boolean): void => {
  // Note: This won't work with const DEBUG_MODE, but provides the interface
  // In a real implementation, you might want to use a different approach
  console.warn('Debug mode cannot be changed at runtime. Modify DEBUG_MODE constant in debug.ts');
};
