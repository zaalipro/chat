import DOMPurify from 'dompurify';

/**
 * Sanitizes user input to prevent XSS attacks
 * @param {string} input - The input string to sanitize
 * @returns {string} - The sanitized input string
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return '';
  }
  
  return DOMPurify.sanitize(input.trim(), {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

/**
 * Validates and sanitizes message text
 * @param {string} message - The message text to validate and sanitize
 * @returns {string} - The sanitized message text
 */
export const sanitizeMessage = (message) => {
  if (!message || typeof message !== 'string') {
    return '';
  }
  
  // Remove any potentially dangerous content
  const sanitized = sanitizeInput(message);
  
  // Additional validation for message content
  // Limit length to prevent abuse
  if (sanitized.length > 5000) {
    throw new Error('Message too long');
  }
  
  return sanitized;
};

/**
 * Validates and sanitizes author name
 * @param {string} author - The author name to validate and sanitize
 * @returns {string} - The sanitized author name
 */
export const sanitizeAuthor = (author) => {
  if (!author || typeof author !== 'string') {
    return 'Anonymous';
  }
  
  // Sanitize the input
  const sanitized = sanitizeInput(author);
  
  // Additional validation for author names
  // Remove any remaining angle brackets and HTML entities
  const cleaned = sanitized
    .replace(/[<>]/g, '') // Remove literal angle brackets
    .replace(/</g, '') // Remove escaped <
    .replace(/>/g, '') // Remove escaped >
    .trim();
  
  if (cleaned.length === 0) {
    return 'Anonymous';
  }
  
  if (cleaned.length > 50) {
    return cleaned.substring(0, 50).trim();
  }
  
  return cleaned;
};