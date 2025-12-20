// Content Security Policy configuration for enhanced security

export interface CSPDirectives {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'img-src': string[];
  'font-src': string[];
  'connect-src': string[];
  'frame-src': string[];
  'object-src': string[];
  'media-src': string[];
  'worker-src': string[];
  'child-src': string[];
  'form-action': string[];
  'base-uri': string[];
  'manifest-src': string[];
}

export const CSP_DIRECTIVES: CSPDirectives = {
  'default-src': ["'self'"],

  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Vite in development
    "'unsafe-eval'", // Required for development hot reload
    'https://cdn.jsdelivr.net', // For external libraries
    'https://unpkg.com', // For external libraries
  ],

  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for styled components and CSS-in-JS
    'https://fonts.googleapis.com', // Google Fonts
    'https://cdn.jsdelivr.net',
  ],

  'img-src': [
    "'self'",
    'data:', // Data URLs for inline images
    'blob:', // Blob URLs for generated images
    'https:', // HTTPS images
    'https://avatars.githubusercontent.com', // GitHub avatars
    'https://www.gravatar.com', // Gravatar images
  ],

  'font-src': [
    "'self'",
    'https://fonts.gstatic.com', // Google Fonts
    'data:', // Data URLs for embedded fonts
  ],

  'connect-src': [
    "'self'",
    'https://api.github.com', // GitHub API
    'https://api.gitlab.com', // GitLab API
    'https://apibackenddev.onrender.com/v1', // Backend API
    'https://apibackenddev.onrender.com/v1', // JSONPlaceholder API for testing
    'https://ipapi.co/json/', // IP geolocation API (note the trailing slash)
    'wss:', // WebSocket connections
    'ws:', // WebSocket connections (dev)
  ],

  'frame-src': [
    "'self'",
    'https://www.youtube.com', // YouTube embeds
    'https://player.vimeo.com', // Vimeo embeds
  ],

  'object-src': ["'none'"], // Disable plugins

  'media-src': ["'self'", 'data:', 'blob:'],

  'worker-src': [
    "'self'",
    'blob:', // Required for web workers
  ],

  'child-src': ["'self'", 'blob:'],

  'form-action': ["'self'"],

  'base-uri': ["'self'"],

  'manifest-src': ["'self'"],
};

export function generateCSPHeader(
  directives: Partial<CSPDirectives> = {}
): string {
  const mergedDirectives = { ...CSP_DIRECTIVES, ...directives };

  return Object.entries(mergedDirectives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

export function getCSPForEnvironment(
  env: 'development' | 'production'
): string {
  const baseDirectives = { ...CSP_DIRECTIVES };

  if (env === 'production') {
    // Stricter CSP for production
    baseDirectives['script-src'] = [
      "'self'",
      'https://cdn.jsdelivr.net',
      'https://unpkg.com',
    ];

    baseDirectives['style-src'] = [
      "'self'",
      'https://fonts.googleapis.com',
      'https://cdn.jsdelivr.net',
    ];
  }

  return generateCSPHeader(baseDirectives);
}

// Security headers configuration
export const SECURITY_HEADERS = {
  'Content-Security-Policy': getCSPForEnvironment(
    process.env.NODE_ENV === 'production' ? 'production' : 'development'
  ),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': [
    'accelerometer=()',
    'camera=()',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'payment=()',
    'usb=()',
  ].join(', '),
};

// Function to validate CSP compliance
export function validateCSPCompliance(url: string): boolean {
  try {
    const urlObj = new URL(url);

    // Check if URL is allowed by connect-src
    if (urlObj.protocol === 'https:' || urlObj.protocol === 'http:') {
      return CSP_DIRECTIVES['connect-src'].some((source) => {
        if (source === "'self'") {
          return urlObj.origin === window.location.origin;
        }
        if (source.startsWith('http')) {
          // For explicit domains, match the origin
          return urlObj.origin === source;
        }
        // Handle other directives like wss:, ws:, etc.
        return source.startsWith(urlObj.protocol.slice(0, -1));
      });
    }

    return false;
  } catch (error) {
    console.error('Invalid URL for CSP validation:', url);
    return false;
  }
}

// Nonce generation for inline scripts (if needed)
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);

  // Convert Uint8Array to string without using spread operator
  let result = '';
  for (let i = 0; i < array.length; i++) {
    result += String.fromCharCode(array[i]);
  }

  return btoa(result);
}
