// Simple test to verify Jest setup works
describe('Jest Setup Test', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have Chrome API mocked', () => {
    expect(typeof chrome).toBe('object');
    expect(chrome.storage).toBeDefined();
    expect(chrome.runtime).toBeDefined();
  });

  it('should have DOM APIs available', () => {
    expect(typeof document).toBe('object');
    expect(typeof window).toBe('object');
  });

  it('should have localStorage mocked', () => {
    expect(typeof localStorage).toBe('object');
    expect(typeof localStorage.getItem).toBe('function');
  });
});
