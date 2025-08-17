import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@services': path.resolve(__dirname, './src/services'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        ws: true,
      },
      '/n8n-api': {
        target: 'http://localhost:5679',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/n8n-api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          flow: ['@reactflow/core', '@reactflow/controls', '@reactflow/background'],
          editor: ['@monaco-editor/react'],
          utils: ['lodash-es', 'date-fns', 'clsx'],
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@reactflow/core',
      '@monaco-editor/react',
      'zustand',
      'axios',
      'socket.io-client',
    ],
  },
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  },
})
