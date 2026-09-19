import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Must match the GitHub repo name, or assets 404 on GitHub Pages.
  base: '/elden-ring-tracker/',
  plugins: [react()],
  test: {
    include: ['tests/**/*.test.{js,jsx}'],
  },
})
