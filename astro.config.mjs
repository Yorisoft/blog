// @ts-check

import tailwindcss from '@tailwindcss/vite';
import remarkDirective from 'remark-directive';
import remarkAlert from 'remark-github-beta-blockquote-admonitions';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: "http://blog.yorisoft.dev/",
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    remarkPlugins: [
      remarkDirective,
      remarkAlert,
    ],
  },
  integrations: [react()],
});