import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // ⬇️ THIS IS THE CRITICAL FIX FOR BOLT ⬇️
  define: {
    // REPLACE THESE STRINGS WITH YOUR REAL KEYS FROM .ENV
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify("https://pnxglgezelwtkgceysvw.supabase.co"),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBueGdsZ2V6ZWx3dGtnY2V5c3Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMDgwMTAsImV4cCI6MjA5NDY4NDAxMH0.yXf8i7xbengm0OdMeRMEyKMMyJS-aIwCZDjz6O-B8kk"),
    
    // Keeps your existing global define
    global: 'globalThis',
  },

  server: {
    port: 5173,
    host: true,
    strictPort: false
  },
  preview: {
    port: 4173,
    host: true,
    strictPort: false
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    assetsDir: 'assets',
    minify: 'terser',
    target: 'es2015',
    cssTarget: 'chrome80',
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['framer-motion', 'lucide-react'],
          supabase: ['@supabase/supabase-js'],
          utils: ['zustand']
        },
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
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },
    // Asset size warnings
    assetsInlineLimit: 4096, // 4kb
  },
  base: '/',
  publicDir: 'public',
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js']
  }
});