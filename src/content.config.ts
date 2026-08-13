import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
	loader: glob({
		pattern: '**/*.{md,mdx}',
		base: './src/content/posts'
	}),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			publishedAt: z.coerce.date(),
			updatedAt: z.coerce.date().optional(),
			tags: z.array(z.string()).optional(),
			heroImage: image().optional(),
			draft: z.boolean().default(false)
		})
});

export const collections = { posts };
