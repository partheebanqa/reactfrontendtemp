import { validateCSPCompliance, generateNonce } from './cspConfig';

/**
 * Utility to validate URLs before making fetch requests
 * @param url The URL to validate
 * @param options Optional fetch options
 * @returns Promise with fetch result
 */
export async function secureFetch(url: string, options?: RequestInit): Promise<Response> {
  if (!validateCSPCompliance(url)) {
    throw new Error(`URL ${url} does not comply with CSP directives`);
  }
  
  return fetch(url, options);
}

/**
 * Create a secure script element with nonce for inline scripts
 * @param code The JavaScript code to execute
 * @returns A script element that can be appended to the document
 */
export function createSecureScript(code: string): HTMLScriptElement {
  const script = document.createElement('script');
  const nonce = generateNonce();
  script.nonce = nonce;
  script.textContent = code;
  
  // Add the nonce to the CSP meta tag if it exists
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (cspMeta) {
    const content = cspMeta.getAttribute('content') || '';
    if (!content.includes(`'nonce-${nonce}'`)) {
      const newContent = content.replace(
        /(script-src[^;]+)/, 
        `$1 'nonce-${nonce}'`
      );
      cspMeta.setAttribute('content', newContent);
    }
  }
  
  return script;
}

/**
 * Validates if an image URL complies with CSP
 * @param url The image URL to validate
 * @returns boolean indicating if the URL is compliant
 */
export function isImageUrlCompliant(url: string): boolean {
  return validateCSPCompliance(url);
}
