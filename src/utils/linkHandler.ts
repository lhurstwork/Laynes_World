/**
 * Utility for handling external links with security and validation
 */

/**
 * Validates if a string is a valid HTTP or HTTPS URL
 * @param url - The URL string to validate
 * @returns true if the URL is valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObject = new URL(url);
    return urlObject.protocol === 'http:' || urlObject.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Opens a URL in a new browser tab with security attributes
 * @param url - The URL to open
 * @throws Error if the URL is invalid
 */
export function openInNewTab(url: string): void {
  if (!isValidUrl(url)) {
    throw new Error('Invalid URL: URL must be a valid HTTP or HTTPS address');
  }

  // Open in new tab with security attributes to prevent:
  // - noopener: prevents the new page from accessing window.opener
  // - noreferrer: prevents the browser from sending the referrer header
  const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
  
  // Fallback for browsers that don't support the features parameter
  if (newWindow) {
    newWindow.opener = null;
  }
}
