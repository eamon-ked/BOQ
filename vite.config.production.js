import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  base: './',
  plugins: [
    react({
      // Enable React optimizations for production
      babel: {
        plugins: [
          // Remove console.log statements in production
          ['transform-remove-console', { exclude: ['error', 'warn'] }]
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: ['sql.js'],
    include: [
      'react',
      'react-dom',
      'zustand',
      'immer',
      'react-hot-toast',
      'lucide-react'
    ]
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
    // Production-specific build optimizations
    target: 'es2020',
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false, // Disable source maps in production for smaller bundle
    
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        // Aggressive chunk splitting for better caching
        manualChunks: (id) => {
          // Core React libraries
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          
          // State management
          if (id.includes('zustand') || id.includes('immer')) {
            return 'state-management';
          }
          
          // UI components and icons
          if (id.includes('lucide-react') || id.includes('react-hot-toast')) {
            return 'ui-components';
          }
          
          // Data processing libraries
          if (id.includes('xlsx') || id.includes('papaparse') || 
              id.includes('jspdf') || id.includes('jspdf-autotable')) {
            return 'data-processing';
          }
          
          // Validation
          if (id.includes('zod')) {
            return 'validation';
          }
          
          // Virtual scrolling
          if (id.includes('react-window')) {
            return 'virtualization';
          }
          
          // Database
          if (id.includes('sql.js') || id.includes('better-sqlite3')) {
            return 'database';
          }
          
          // Other vendor libraries
          if (id.includes('node_modules')) {
            return 'vendor-utils';
          }
        },
        
        // Optimize asset naming for better caching
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
        entryFileNames: 'assets/js/[name]-[hash].js',
        
        // Optimize chunk size
        maxParallelFileOps: 5
      },
      
      // Tree shaking optimizations
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false
      }
    },
    
    // Compression and optimization settings
    reportCompressedSize: true,
    chunkSizeWarningLimit: 500, // 500KB warning limit
    assetsInlineLimit: 4096, // 4KB inline limit
    
    // CSS optimization
    cssCodeSplit: true,
    
    // Enable advanced optimizations
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
    
    // Optimize for production
    emptyOutDir: true,
    
    // Advanced esbuild options
    esbuild: {
      drop: ['console', 'debugger'], // Remove console.log and debugger in production
      legalComments: 'none',
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true
    }
  },
  
  // Define environment variables
  define: {
    __DEV__: false,
    __PROD__: true,
    'process.env.NODE_ENV': '"production"'
  },
  
  // Resolve optimizations
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})