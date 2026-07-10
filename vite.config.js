import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/budget': {
        target: 'http://localhost:8080',
        rewrite: path => path.replace(/^\/api\/budget/, '/api'),
        changeOrigin: true
      },
      '/api/crm': {
        target: 'http://localhost:3000',
        rewrite: path => path.replace(/^\/api\/crm/, '/api'),
        changeOrigin: true
      },
      '/api/export': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  }
})
