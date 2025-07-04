// Example of safely adding dynamic scripts
import { createSecureScript } from '@/security/cspUtils';

export function addAnalyticsScript() {
  const analyticsCode = `
    console.log('Analytics initialized');
    // Analytics tracking code would go here
  `;
  
  // Create a secure script with proper nonce
  const script = createSecureScript(analyticsCode);
  
  // Append to document
  document.head.appendChild(script);
}
