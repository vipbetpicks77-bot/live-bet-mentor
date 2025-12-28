import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api-sofascore': {
        target: 'https://api.sofascore.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-sofascore/, ''),
        headers: {
          'Referer': 'https://www.sofascore.com/',
          'x-requested-with': 'ede1af'
        }
      },
      '/api-mackolik-data': {
        target: 'https://www.mackolik.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-mackolik-data/, ''),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Referer': 'https://www.mackolik.com/canli-sonuclar',
          'Origin': 'https://www.mackolik.com',
          'x-requested-with': 'XMLHttpRequest'
        }
      },
      '/api-apifootball': {
        target: 'https://apiv3.apifootball.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-apifootball/, '/')
      }
    }
  }
})
