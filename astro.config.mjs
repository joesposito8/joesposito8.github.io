// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import sitemap from '@astrojs/sitemap';

// Fontsource's CSS declares `font-display: swap`, so a first visit paints in a fallback serif
// (small caps as plain lowercase) and then redraws in Alegreya. `block` holds the text for
// the moment the fonts take, which Base.astro shortens by preloading the two used up top.
const fontDisplayBlock = {
  name: 'font-display-block',
  transform(code, id) {
    if (id.includes('@fontsource') && id.endsWith('.css')) return code.replaceAll('font-display: swap', 'font-display: block');
  },
};

// A list typed on the paragraph's next line belongs to it; HTML can't show that, so mark the paragraph.
const remarkListLead = () => function mark(node) {
  node.children?.forEach((child, i) => {
    const prev = node.children[i - 1];
    if (child.type === 'list' && prev?.type === 'paragraph' && child.position.start.line === prev.position.end.line + 1) {
      prev.data = { ...prev.data, hProperties: { ...prev.data?.hProperties, className: ['list-lead'] } };
    }
    mark(child);
  });
};

export default defineConfig({
  site: 'https://joesposito.com',
  integrations: [sitemap()],
  // Dev and preview listen on localhost; pass --host and --allowed-hosts to serve elsewhere.
  server: { port: 7578 },
  vite: { plugins: [fontDisplayBlock] },
  markdown: {
    // Astro 7's default processor (Satteri) cannot run remark/rehype plugins, and KaTeX
    // math needs them, so posts render through the unified pipeline.
    processor: unified({ remarkPlugins: [remarkMath, remarkListLead], rehypePlugins: [rehypeKatex] }),
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
    },
  },
});
