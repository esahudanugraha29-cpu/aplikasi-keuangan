import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves the project from /aplikasi-keuangan/.
const isCI = Boolean(process.env.GITHUB_ACTIONS)
const base = isCI ? '/aplikasi-keuangan/' : '/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
})
