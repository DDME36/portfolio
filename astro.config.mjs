import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // One small stylesheet: inline it so first paint never waits on a CSS request
  build: { inlineStylesheets: 'always' },
});
