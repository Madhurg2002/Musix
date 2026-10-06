import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 4321,
    open: true,
  },
  preview: {
    port: 4321,
    allowedHosts: true,
  },
});
