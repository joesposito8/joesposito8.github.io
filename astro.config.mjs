// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  site: 'https://joesposito.com',
  // Design previews are served on this box's Tailscale address only. Vite rejects
  // unknown Host headers, so the MagicDNS name is allowed alongside the IP.
  server: {
    host: 'localhost',
    port: 7578,
    allowedHosts: ['localhost'],
  },
  markdown: {
    // Astro 7's default processor (Satteri) cannot run remark/rehype plugins, and KaTeX
    // math needs them, so posts render through the unified pipeline.
    processor: unified({ remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] }),
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
    },
  },
});
