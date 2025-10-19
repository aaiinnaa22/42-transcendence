//add host and port to be able to access the website from outside container 

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: { postcss: './postcss.config.js' },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
})