import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'anthropic-key-reminder',
      closeBundle() {
        console.log('\n\x1b[33m' +
          '╔══════════════════════════════════════════════════════════╗\n' +
          '║  IMPORTANT: Add ANTHROPIC_API_KEY to Vercel             ║\n' +
          '║  environment variables in your project settings         ║\n' +
          '╚══════════════════════════════════════════════════════════╝' +
          '\x1b[0m\n')
      }
    }
  ],
})
