// Validation utilities for data models

/**
 * Validates if a string is a valid YouTube URL
 * Supports formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export function isValidYouTubeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Check for youtube.com domains
    if (hostname === 'www.youtube.com' || hostname === 'youtube.com') {
      // Check for /watch?v= or /embed/ patterns
      return (
        (urlObj.pathname === '/watch' && urlObj.searchParams.has('v')) ||
        urlObj.pathname.startsWith('/embed/')
      );
    }
    
    // Check for youtu.be short URLs
    if (hostname === 'youtu.be') {
      return urlObj.pathname.length > 1; // Has a video ID in path
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * Validates a YouTubeVideo object
 */
export function validateYouTubeVideo(video: any): boolean {
  if (!video || typeof video !== 'object') {
    return false;
  }

  return (
    typeof video.id === 'string' &&
    video.id.length > 0 &&
    typeof video.title === 'string' &&
    video.title.length > 0 &&
    typeof video.channelName === 'string' &&
    video.channelName.length > 0 &&
    typeof video.channelId === 'string' &&
    video.channelId.length > 0 &&
    typeof video.thumbnail === 'string' &&
    isValidUrl(video.thumbnail) &&
    video.uploadDate instanceof Date &&
    typeof video.url === 'string' &&
    isValidYouTubeUrl(video.url) &&
    (video.type === 'new_release' || video.type === 'recommended')
  );
}

/**
 * Validates if a string is a valid HTTP/HTTPS URL
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates price and discount values for a TechDeal
 * Rules:
 * - originalPrice must be positive
 * - salePrice must be positive
 * - salePrice must be less than originalPrice
 * - discountPercentage must be between 0 and 100
 * - discountPercentage should match calculated discount
 */
export function validateDealPricing(
  originalPrice: number,
  salePrice: number,
  discountPercentage: number
): { valid: boolean; error?: string } {
  if (typeof originalPrice !== 'number' || originalPrice <= 0) {
    return { valid: false, error: 'Original price must be a positive number' };
  }

  if (typeof salePrice !== 'number' || salePrice <= 0) {
    return { valid: false, error: 'Sale price must be a positive number' };
  }

  if (salePrice >= originalPrice) {
    return { valid: false, error: 'Sale price must be less than original price' };
  }

  if (typeof discountPercentage !== 'number' || discountPercentage < 0 || discountPercentage > 100) {
    return { valid: false, error: 'Discount percentage must be between 0 and 100' };
  }

  // Validate discount calculation (allow 1% tolerance for rounding)
  const calculatedDiscount = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  if (Math.abs(calculatedDiscount - discountPercentage) > 1) {
    return { 
      valid: false, 
      error: `Discount percentage (${discountPercentage}%) doesn't match calculated discount (${calculatedDiscount}%)` 
    };
  }

  return { valid: true };
}

/**
 * Validates a TechDeal object
 */
export function validateTechDeal(deal: any): boolean {
  if (!deal || typeof deal !== 'object') {
    return false;
  }

  // Validate basic fields
  if (
    typeof deal.id !== 'string' ||
    deal.id.length === 0 ||
    typeof deal.productName !== 'string' ||
    deal.productName.length === 0 ||
    typeof deal.source !== 'string' ||
    deal.source.length === 0 ||
    typeof deal.url !== 'string' ||
    !isValidUrl(deal.url) ||
    !(deal.expirationDate instanceof Date) ||
    !['current', 'upcoming', 'expired'].includes(deal.status)
  ) {
    return false;
  }

  // Validate pricing
  const pricingValidation = validateDealPricing(
    deal.originalPrice,
    deal.salePrice,
    deal.discountPercentage
  );

  if (!pricingValidation.valid) {
    return false;
  }

  // Validate optional imageUrl if present
  if (deal.imageUrl !== undefined && deal.imageUrl !== null) {
    if (typeof deal.imageUrl !== 'string' || !isValidUrl(deal.imageUrl)) {
      return false;
    }
  }

  return true;
}
