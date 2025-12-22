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
		proxy: {
			'/api': {
				target: 'http://localhost:4241',
				changeOrigin: true,
				secure: false
			},
			'/ws': {
				target: 'ws://localhost:4241',
				ws: true,
				changeOrigin: true,
				secure: false
			}
	},
    host: '0.0.0.0',
    port: 8080,
	},
	preview: {
		port: 8080
	},
	publicDir: "public"
})
