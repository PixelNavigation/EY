import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Run dev server on port 3000
    open: true, // Automatically open the browser
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000', // Proxy API requests to the backend
        changeOrigin: true, // Change the origin of the request to match the target
      },
    },
  },
})