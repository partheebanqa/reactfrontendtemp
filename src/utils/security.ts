// Security utilities for input sanitization and validation

/**
 * Sanitizes HTML content by removing potentially dangerous elements and attributes
 */
export const sanitizeHtml = (input: string): string => {
  // Remove HTML tags and decode HTML entities
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<link\b[^>]*>/gi, '')
    .replace(/<meta\b[^>]*>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

/**
 * Sanitizes text input by removing dangerous characters and limiting length
 */
export const sanitizeText = (input: string, maxLength: number = 1000): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
};

/**
 * Validates and sanitizes email input
 */
export const sanitizeEmail = (email: string): string => {
  if (!email || typeof email !== 'string') return '';
  
  return email
    .trim()
    .toLowerCase()
    .slice(0, 254) // RFC 5321 limit
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/[\x00-\x1F\x7F]/g, '');
};

/**
 * Validates and sanitizes phone number input
 */
export const sanitizePhone = (phone: string): string => {
  if (!phone || typeof phone !== 'string') return '';
  
  return phone
    .trim()
    .slice(0, 20)
    .replace(/[^+\d\s\-\(\)]/g, '') // Only allow digits, spaces, hyphens, parentheses, and plus
    .replace(/javascript:/gi, '');
};

/**
 * Rate limiting utility for form submissions
 */
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];
    
    // Remove old attempts outside the time window
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    // Add current attempt
    recentAttempts.push(now);
    this.attempts.set(identifier, recentAttempts);
    
    return true;
  }

  getRemainingTime(identifier: string): number {
    const attempts = this.attempts.get(identifier) || [];
    if (attempts.length === 0) return 0;
    
    const oldestAttempt = Math.min(...attempts);
    const timeLeft = this.windowMs - (Date.now() - oldestAttempt);
    
    return Math.max(0, timeLeft);
  }
}

export const formRateLimiter = new RateLimiter(3, 10 * 60 * 1000); // 3 attempts per 10 minutes

/**
 * Generates a simple client-side fingerprint for rate limiting
 */
export const getClientFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Security fingerprint', 2, 2);
  }
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
};

/**
 * Content Security Policy validation
 */
export const validateCSP = (content: string): boolean => {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /data:text\/html/i,
    /data:application\/javascript/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /on\w+\s*=/i,
    /expression\s*\(/i,
    /url\s*\(/i
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(content));
};

/**
 * SQL injection prevention for any backend integration
 */
export const preventSQLInjection = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/['";\\]/g, '') // Remove quotes and backslashes
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove SQL block comments start
    .replace(/\*\//g, '') // Remove SQL block comments end
    .replace(/\bUNION\b/gi, '')
    .replace(/\bSELECT\b/gi, '')
    .replace(/\bINSERT\b/gi, '')
    .replace(/\bUPDATE\b/gi, '')
    .replace(/\bDELETE\b/gi, '')
    .replace(/\bDROP\b/gi, '')
    .replace(/\bCREATE\b/gi, '')
    .replace(/\bALTER\b/gi, '')
    .replace(/\bEXEC\b/gi, '')
    .replace(/\bEXECUTE\b/gi, '');
};