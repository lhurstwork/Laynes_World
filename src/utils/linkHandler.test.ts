import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isValidUrl, openInNewTab } from './linkHandler';

describe('linkHandler', () => {
  describe('isValidUrl', () => {
    it('should return true for valid HTTP URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('http://example.com/path')).toBe(true);
      expect(isValidUrl('http://example.com/path?query=value')).toBe(true);
    });

    it('should return true for valid HTTPS URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('https://example.com/path')).toBe(true);
      expect(isValidUrl('https://example.com/path?query=value')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidUrl('not a url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
    });

    it('should return false for relative URLs', () => {
      expect(isValidUrl('/path/to/page')).toBe(false);
      expect(isValidUrl('./relative')).toBe(false);
      expect(isValidUrl('../parent')).toBe(false);
    });
  });

  describe('openInNewTab', () => {
    beforeEach(() => {
      // Mock window.open
      vi.stubGlobal('open', vi.fn(() => ({ opener: {} })));
    });

    it('should open valid HTTPS URL in new tab', () => {
      const url = 'https://example.com';
      openInNewTab(url);

      expect(window.open).toHaveBeenCalledWith(url, '_blank', 'noopener,noreferrer');
    });

    it('should open valid HTTP URL in new tab', () => {
      const url = 'http://example.com';
      openInNewTab(url);

      expect(window.open).toHaveBeenCalledWith(url, '_blank', 'noopener,noreferrer');
    });

    it('should throw error for invalid URL', () => {
      expect(() => openInNewTab('not a url')).toThrow('Invalid URL');
    });

    it('should throw error for non-HTTP(S) protocols', () => {
      expect(() => openInNewTab('ftp://example.com')).toThrow('Invalid URL');
      expect(() => openInNewTab('javascript:alert(1)')).toThrow('Invalid URL');
    });

    it('should set opener to null for security', () => {
      const mockWindow = { opener: {} };
      vi.stubGlobal('open', vi.fn(() => mockWindow));

      openInNewTab('https://example.com');

      expect(mockWindow.opener).toBeNull();
    });
  });
});
