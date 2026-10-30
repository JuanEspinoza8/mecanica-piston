import { defineConfig } from 'vitest/config'

// Config aparte de vite.config.js para no cargar el plugin de la PWA en los tests.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
    setupFiles: ['./src/test/setup.js'],
  },
})
