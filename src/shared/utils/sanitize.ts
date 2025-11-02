/**
 * Utility functions for sanitizing user input to prevent injection attacks
 */

/**
 * Sanitize string input to prevent MongoDB injection
 * Removes potentially dangerous operators and characters
 */
export function sanitizeMongoInput(input: string): string {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove MongoDB operators ($, ., etc.)
  return input
    .replace(/\$/g, '') // Remove $ sign (MongoDB operators)
    .replace(/\./g, '') // Remove dots (nested field access)
    .replace(/\{/g, '') // Remove opening braces
    .replace(/\}/g, '') // Remove closing braces
    .trim();
}

/**
 * Sanitize object input to prevent MongoDB injection
 * Recursively removes dangerous keys and values
 */
export function sanitizeMongoObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeMongoInput(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeMongoObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // Skip keys that start with $ (MongoDB operators)
        if (key.startsWith('$')) {
          continue;
        }

        // Skip keys that contain dots (nested field access)
        if (key.includes('.')) {
          continue;
        }

        // Recursively sanitize the value
        sanitized[key] = sanitizeMongoObject(obj[key]);
      }
    }

    return sanitized;
  }

  return obj;
}

/**
 * Sanitize HTML to prevent XSS attacks
 * Basic implementation - for production use a library like DOMPurify
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') {
    return input;
  }

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') {
    return '';
  }

  // Only allow http and https protocols
  if (!url.match(/^https?:\/\//)) {
    return '';
  }

  // Remove any javascript: or data: protocols
  if (url.match(/^(javascript|data|vbscript):/i)) {
    return '';
  }

  return url.trim();
}

/**
 * Sanitize file path to prevent directory traversal attacks
 */
export function sanitizeFilePath(path: string): string {
  if (typeof path !== 'string') {
    return '';
  }

  // Remove directory traversal patterns
  return path
    .replace(/\.\./g, '') // Remove ..
    .replace(/\\/g, '/') // Normalize slashes
    .replace(/\/+/g, '/') // Remove duplicate slashes
    .replace(/^\//, '') // Remove leading slash
    .trim();
}
