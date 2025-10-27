// Ultra-simplified logging utility for Local AI Extension
// DEBUG_MODE is set at build time via environment variable
// Defaults to false (production) - must explicitly enable debugging

// Build-time configuration - set by build scripts
// Production: DEBUG_MODE = false (default)
// Development: DEBUG_MODE = true (explicitly set)
declare const DEBUG_MODE: boolean;

// No-op function for production
const noOp = (..._args: any[]): void => {};

// Single logger object with all methods
export const logger = {
  debug: DEBUG_MODE ? console.log.bind(console) : noOp,
  info: DEBUG_MODE ? console.info.bind(console) : noOp,
  warn: DEBUG_MODE ? console.warn.bind(console) : noOp,
  error: DEBUG_MODE ? (...args: any[]) => {
    // Smart error handling: if last argument is an Error, extract additional info
    if (args.length > 0 && args[args.length - 1] instanceof Error) {
      const error = args[args.length - 1] as Error;
      const otherArgs = args.slice(0, -1);
      
      // Log the main message with other arguments
      console.error(...otherArgs, error.message);
      
      // Log stack trace separately for better readability
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    } else {
      // Normal logging for non-Error arguments
      console.error(...args);
    }
  } : noOp,
  
  // Success logging with green styling
  success: DEBUG_MODE ? (message: string, context?: string) => {
    const prefix = context ? `[${context}]` : '';
    console.log(`%c${prefix} SUCCESS: ${message}`, 'color: green; font-weight: bold');
  } : noOp,
  
  // Create module-specific logger
  createModuleLogger: (moduleName: string) => ({
    debug: DEBUG_MODE ? (...args: any[]) => console.log(`[${moduleName}]`, ...args) : noOp,
    info: DEBUG_MODE ? (...args: any[]) => console.info(`[${moduleName}]`, ...args) : noOp,
    warn: DEBUG_MODE ? (...args: any[]) => console.warn(`[${moduleName}]`, ...args) : noOp,
    error: DEBUG_MODE ? (...args: any[]) => {
      // Smart error handling: if last argument is an Error, extract additional info
      if (args.length > 0 && args[args.length - 1] instanceof Error) {
        const error = args[args.length - 1] as Error;
        const otherArgs = args.slice(0, -1);
        
        // Log the main message with other arguments
        console.error(`[${moduleName}]`, ...otherArgs, error.message);
        
        // Log stack trace separately for better readability
        if (error.stack) {
          console.error(`[${moduleName}] Stack trace:`, error.stack);
        }
      } else {
        // Normal logging for non-Error arguments
        console.error(`[${moduleName}]`, ...args);
      }
    } : noOp,
    success: DEBUG_MODE ? (message: string) => {
      console.log(`%c[${moduleName}] SUCCESS: ${message}`, 'color: green; font-weight: bold');
    } : noOp
  }),
  
  // Utility methods
  isEnabled: (): boolean => DEBUG_MODE,
  
  setEnabled: (_enabled: boolean): void => {
    console.warn('Debug mode cannot be changed at runtime. Rebuild with DEBUG_MODE=true for development.');
  }
};
