import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const POST_TYPES = ['essay', 'note', 'til', 'link'] as const;

const posts = defineCollection({
  // SAMPLE_POSTS points a build at a folder of sample posts (design/sample-posts for the
  // screenshots); deploy builds never set it, so samples cannot reach the live site.
  loader: glob({ pattern: '**/*.md', base: process.env.SAMPLE_POSTS ?? './src/content/posts' }),
  schema: z
    .object({
      type: z.enum(POST_TYPES),
      title: z.string(),
      subtitle: z.string().optional(),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      epistemic: z.string().optional(),
      tags: z.array(z.string()).default([]),
      // Adds the post to the full-content feed that LessWrong imports.
      lesswrong: z.boolean().default(false),
      // Marks a report-style essay: adds citation_* meta tags so Google Scholar can index it.
      report: z.boolean().default(false),
      // The page a link post points at.
      url: z.url().optional(),
      syndication: z
        .object({
          lesswrong: z.url().optional(),
          substack: z.url().optional(),
          x: z.url().optional(),
          linkedin: z.url().optional(),
        })
        .strict()
        .default({}),
    })
    .strict()
    .refine((post) => post.type !== 'link' || post.url, {
      message: 'link posts need a `url`',
      path: ['url'],
    }),
});

export const collections = { posts };
