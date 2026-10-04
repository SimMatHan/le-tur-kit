/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Én selvstændig dist/index.html: JS, CSS, billeder og fonte inlines,
// så filen virker ved dobbeltklik (file://) uden internet.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile({ removeViteModuleLoader: true })],
  build: {
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    chunkSizeWarningLimit: 8000,
    cssCodeSplit: false,
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    // Testene er rene funktioner uden delt tilstand – genbrug workers.
    isolate: false,
  },
});
