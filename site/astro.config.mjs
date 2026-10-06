import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://music-theory-reference.example',
  build: {
    output: 'static',
  },
  vite: {
    preview: {
      allowedHosts: true,
    },
  },
});
