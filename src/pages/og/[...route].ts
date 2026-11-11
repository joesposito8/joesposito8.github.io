// Social card images at /og/<slug>.png, one per post plus one for the home page.
import { OGImageRoute } from 'astro-og-canvas';
import { SITE } from '../../config';
import { getPosts } from '../../lib/posts';

const posts = await getPosts();
const pages: Record<string, { title: string; description: string }> = {
  index: { title: SITE.name, description: SITE.description },
  ...Object.fromEntries(posts.map((p) => [p.id, { title: p.data.title, description: `${SITE.name} · joesposito.com` }])),
};

// The card uses the light theme's paper, navy ink and sunflower edge.
const PAPER: [number, number, number] = [252, 252, 254];
const INK: [number, number, number] = [27, 36, 54];
const MUTED: [number, number, number] = [90, 100, 119];
const SUN: [number, number, number] = [242, 182, 0];

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  getImageOptions: (_path, page) => ({
    title: page.title,
    description: page.description,
    bgGradient: [PAPER],
    border: { color: SUN, width: 24, side: 'inline-start' },
    padding: 80,
    // The avatar placeholder, rendered from the same sunflower disc the site header uses.
    logo: { path: './src/assets/og-mark.png', size: [104] },
    // The card renderer loads font files directly, so it uses static Alegreya weights.
    fonts: ['./node_modules/@fontsource/alegreya/files/alegreya-latin-500-normal.woff', './node_modules/@fontsource/alegreya/files/alegreya-latin-400-normal.woff'],
    font: {
      title: { color: INK, size: 76, weight: 'Medium', lineHeight: 1.1, families: ['Alegreya'] },
      description: { color: MUTED, size: 38, weight: 'Normal', families: ['Alegreya'] },
    },
  }),
});
