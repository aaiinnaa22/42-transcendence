//add host and port to be able to access the website from outside container

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  appType: 'spa',
  plugins: [react()],
  css: { postcss: './postcss.config.js' },
  build: {
	outDir: 'dist',
	sourcemap: false,
	minify: 'esbuild'
  },
  server: {
    host: '0.0.0.0',
    port: 8080,
  },
  preview: {
	port: 8080
  }
})
