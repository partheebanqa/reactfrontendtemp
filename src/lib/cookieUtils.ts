import { Buffer } from 'buffer';

// Simple encryption/decryption for cookies
// In a production environment, consider using a more robust solution

const ENCRYPTION_KEY = 'optraflow-secure-key-2025'; // In production, this should be an environment variable

/**
 * Encrypts data for storage in cookies
 */
export function encryptData(data: any): string {
  try {
    const jsonString = JSON.stringify(data);
    // Simple XOR encryption with the key
    const encrypted = Array.from(jsonString).map((char, index) => {
      return String.fromCharCode(
        char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(index % ENCRYPTION_KEY.length)
      );
    }).join('');
    
    // Convert to base64 for safe cookie storage
    return Buffer.from(encrypted).toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    return '';
  }
}

/**
 * Decrypts data from cookies
 */
export function decryptData(encryptedString: string): any {
  try {
    if (!encryptedString) return null;
    
    // Convert from base64
    const encrypted = Buffer.from(encryptedString, 'base64').toString();
    
    // XOR decrypt with the key
    const decrypted = Array.from(encrypted).map((char, index) => {
      return String.fromCharCode(
        char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(index % ENCRYPTION_KEY.length)
      );
    }).join('');
    
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

/**
 * Sets an encrypted cookie
 */
export function setEncryptedCookie(name: string, value: any, days = 7): void {
  try {
    const encrypted = encryptData(value);
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `; expires=${date.toUTCString()}`;
    document.cookie = `${name}=${encrypted}${expires}; path=/; secure; samesite=strict`;
  } catch (error) {
    console.error('Error setting cookie:', error);
  }
}

/**
 * Gets and decrypts a cookie by name
 */
export function getEncryptedCookie(name: string): any {
  try {
    const nameEQ = `${name}=`;
    const cookies = document.cookie.split(';');
    
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i];
      while (cookie.charAt(0) === ' ') {
        cookie = cookie.substring(1, cookie.length);
      }
      
      if (cookie.indexOf(nameEQ) === 0) {
        const encryptedValue = cookie.substring(nameEQ.length, cookie.length);
        return decryptData(encryptedValue);
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting cookie:', error);
    return null;
  }
}

/**
 * Removes a cookie by name
 */
export function removeCookie(name: string): void {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}
