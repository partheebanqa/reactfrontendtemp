import { Plugin } from 'vite';
import { SECURITY_HEADERS } from './cspConfig';

export function cspPlugin(): Plugin {
  return {
    name: 'vite-plugin-csp',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Add security headers to all responses
        Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
        next();
      });
    }
  };
}
