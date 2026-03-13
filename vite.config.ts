import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { cspPlugin } from './src/security/cspPlugin';

export default defineConfig({
  plugins: [react(), cspPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@shared': path.resolve(import.meta.dirname, 'shared'),
      '@assets': path.resolve(import.meta.dirname, 'attached_assets'),
    },
  },
  optimizeDeps: {
    exclude: ['react18-json-view'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'wouter'],
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            'lucide-react',
            'framer-motion',
          ],
          editor: ['ace-builds', 'react-ace'],
        },
      },
    },
  },
  server: {
    hmr: {
      overlay: false,
    },
  },
});
