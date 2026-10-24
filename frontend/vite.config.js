import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'vendor-leaflet';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
          }
          if (
            id.includes('VerificationQueue') ||
            id.includes('Analytics') ||
            id.includes('Registry') ||
            id.includes('/components/registry/') ||
            id.includes('\\components\\registry\\')
          ) {
            return 'chunk-registry-admin';
          }
          if (id.includes('/src/data/') || id.includes('\\src\\data\\')) {
            return 'chunk-data';
          }
        },
      },
    },
  },
})
