/**
 * UUID utility functions
 */

/**
 * Generate a random UUID v4 using the browser's built-in crypto.randomUUID()
 * This extension targets modern Chrome browsers with Local AI capabilities,
 * so we can rely on crypto.randomUUID() being available (Chrome 92+)
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Generate a prefixed UUID for specific entity types
 */
export function generatePrefixedUUID(prefix: string): string {
  return `${prefix}_${generateUUID()}`;
}
