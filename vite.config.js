const { defineConfig } = require('vite')
const react = require('@vitejs/plugin-react')

module.exports = defineConfig({
  base: './',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['sql.js']
  },
  server: {
    fs: {
      allow: ['..']
    },
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  assetsInclude: ['**/*.wasm'],
  worker: {
    format: 'es'
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunk for React ecosystem
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          
          // UI components chunk
          if (id.includes('lucide-react') || id.includes('react-hot-toast')) {
            return 'ui-components';
          }
          
          // Data processing chunk
          if (id.includes('xlsx') || id.includes('papaparse') || 
              id.includes('jspdf') || id.includes('jspdf-autotable')) {
            return 'data-processing';
          }
          
          // State management chunk
          if (id.includes('zustand') || id.includes('immer')) {
            return 'state-management';
          }
          
          // Validation chunk
          if (id.includes('zod')) {
            return 'validation';
          }
          
          // Virtual scrolling chunk
          if (id.includes('react-window')) {
            return 'virtualization';
          }
          
          // Database chunk
          if (id.includes('sql.js') || id.includes('better-sqlite3')) {
            return 'database';
          }
          
          // Utilities chunk for smaller utilities
          if (id.includes('node_modules') && 
              !id.includes('react') && 
              !id.includes('lucide') && 
              !id.includes('xlsx') && 
              !id.includes('jspdf') && 
              !id.includes('zustand') && 
              !id.includes('zod') && 
              !id.includes('sql')) {
            return 'vendor-utils';
          }
        },
        // Optimize asset naming
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      },
      // External dependencies that should not be bundled
      external: (id) => {
        // Keep sql.js external for web workers
        return id.includes('sql.js') && id.includes('worker');
      }
    },
    // Enable source maps for production debugging
    sourcemap: process.env.NODE_ENV === 'development' ? true : 'hidden',
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 500,
    // Enhanced minification
    minify: 'esbuild',
    // Target modern browsers for better optimization
    target: 'es2022',
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Optimize assets
    assetsInlineLimit: 4096, // 4kb inline limit
    // Enable compression
    reportCompressedSize: true,
    // Optimize dependencies
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  }
})