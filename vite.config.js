import { defineConfig } from 'vite';
import { sites } from '@openai/sites-vite-plugin';

export default defineConfig({
  base: './',
  plugins: [sites()],
});
