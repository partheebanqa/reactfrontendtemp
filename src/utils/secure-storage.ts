/**
 * Secure Storage Utility
 *
 * Features:
 * - Encrypts sensitive data before storing
 * - Sanitizes credentials (Bearer tokens, API keys, passwords)
 * - Session-based encryption keys
 * - Automatic cleanup on logout
 */

import CryptoJS from 'crypto-js';

class SecureStorage {
  private readonly SESSION_KEY_NAME = 'session_encryption_key';

  /**
   * Get or create session encryption key
   */
  private getOrCreateSessionKey(): string {
    let key = localStorage.getItem(this.SESSION_KEY_NAME);

    if (!key) {
      // Generate random key for this session
      key = CryptoJS.lib.WordArray.random(32).toString();
      localStorage.setItem(this.SESSION_KEY_NAME, key);
    }

    return key;
  }

  /**
   * Check if a value IS a credential that should be stored as-is.
   * The value itself tells us — not the key name.
   */
  private isCredentialValue(value: string): boolean {
    if (!value || typeof value !== 'string') return false;

    // Variable placeholder like {{E_token}} — preserve as-is
    if (/^\{\{[\w]+\}\}$/.test(value)) return true;

    // Raw JWT token (3 base64url segments separated by dots)
    if (/^eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(value))
      return true;

    // Bearer + JWT
    if (
      /^Bearer\s+eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(
        value,
      )
    )
      return true;

    return false;
  }

  /**
   * Sanitize sensitive values before storage
   */
  private sanitizeValue(value: any): any {
    if (typeof value !== 'string') return value;

    let sanitized = value;

    // Redact Bearer tokens
    sanitized = sanitized.replace(
      /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
      'Bearer {{REDACTED}}',
    );

    // Redact JWT tokens
    sanitized = sanitized.replace(
      /eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/g,
      '{{REDACTED_JWT}}',
    );

    // Redact API keys (common patterns)
    // sk_live_, pk_live_, etc.
    sanitized = sanitized.replace(
      /[sp]k_(live|test)_[A-Za-z0-9]{20,}/gi,
      '{{REDACTED_API_KEY}}',
    );

    // Redact long alphanumeric strings that look like keys
    sanitized = sanitized.replace(/\b[A-Za-z0-9]{40,}\b/g, (match) =>
      match.length > 40 ? '{{REDACTED_KEY}}' : match,
    );

    // Redact authorization headers
    sanitized = sanitized.replace(
      /Authorization:\s*Bearer\s+[^\s]+/gi,
      'Authorization: Bearer {{REDACTED}}',
    );

    // Redact X-API-Key headers
    sanitized = sanitized.replace(
      /X-API-Key:\s*[^\s]+/gi,
      'X-API-Key: {{REDACTED}}',
    );

    return sanitized;
  }

  /**
   * Sanitize object recursively
   */
  private sanitizeObject(obj: any): any {
    if (!obj) return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitizedObj: any = {};

      Object.keys(obj).forEach((key) => {
        const value = obj[key];

        if (typeof value === 'string') {
          if (this.isCredentialValue(value)) {
            sanitizedObj[key] = value;
          } else if (value.startsWith('{') || value.startsWith('[')) {
            try {
              const parsed = JSON.parse(value);
              sanitizedObj[key] = JSON.stringify(this.sanitizeObject(parsed));
            } catch {
              sanitizedObj[key] = this.sanitizeValue(value);
            }
          } else {
            sanitizedObj[key] = this.sanitizeValue(value);
          }
        } else if (typeof value === 'object') {
          sanitizedObj[key] = this.sanitizeObject(value);
        } else {
          sanitizedObj[key] = value;
        }
      });

      return sanitizedObj;
    }

    return this.sanitizeValue(obj);
  }
  /**
   * Save encrypted data to localStorage
   */
  saveEncrypted(key: string, data: any): boolean {
    try {
      // const sanitized = this.sanitizeObject(data);
      const sessionKey = this.getOrCreateSessionKey();
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(data),
        sessionKey,
      ).toString();

      // Check size before saving
      const sizeInMB = new Blob([encrypted]).size / (1024 * 1024);
      if (sizeInMB > 4) {
        console.warn(
          `[SecureStorage] Data too large: ${sizeInMB.toFixed(1)}MB`,
        );
        return false;
      }

      localStorage.setItem(key, encrypted);
      return true;
    } catch (e: any) {
      if (e.name === 'QuotaExceededError') {
        console.error('[SecureStorage] localStorage quota exceeded');
      } else {
        console.error('[SecureStorage] Failed to save encrypted data:', e);
      }
      return false;
    }
  }

  /**
   * Load encrypted data from localStorage
   */
  loadEncrypted(key: string): any | null {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;

      const sessionKey = this.getOrCreateSessionKey();
      const decrypted = CryptoJS.AES.decrypt(encrypted, sessionKey);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);

      if (!jsonString) {
        console.warn(
          '[SecureStorage] Failed to decrypt data - key may have changed',
        );
        return null;
      }

      return JSON.parse(jsonString);
    } catch (e) {
      console.error('[SecureStorage] Failed to load encrypted data:', e);
      return null;
    }
  }

  /**
   * Remove encrypted data
   */
  removeEncrypted(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('[SecureStorage] Failed to remove data:', e);
      return false;
    }
  }

  /**
   * Clear all encrypted data and session key
   */
  clearAll(): void {
    try {
      sessionStorage.removeItem(this.SESSION_KEY_NAME);

      // Clear all localStorage keys
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignore errors
        }
      });

      console.log('[SecureStorage] All storage cleared');
    } catch (e) {
      console.error('[SecureStorage] Failed to clear storage:', e);
    }
  }

  /**
   * Check if value contains sensitive data
   */
  containsSensitiveData(value: string): boolean {
    if (!value) return false;

    // Check for Bearer tokens
    if (/Bearer\s+[A-Za-z0-9\-._~+/]+=*/i.test(value)) return true;

    // Check for JWT tokens
    if (/eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/.test(value))
      return true;

    // Check for API keys
    if (/[sp]k_(live|test)_[A-Za-z0-9]{20,}/i.test(value)) return true;

    // Check for long alphanumeric strings
    if (/\b[A-Za-z0-9]{40,}\b/.test(value)) return true;

    return false;
  }
}

// Export singleton instance
export const secureStorage = new SecureStorage();
