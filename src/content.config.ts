import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    authors: z.string().array(),
    date: z.coerce.date(),
    description: z.string().optional(),
    url: z.string().optional(),
    thumbnail: z.string().optional(),
  }),
});

const project = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    url: z.string(),
    thumbnail: z.string(),
    technologies: z.string().array(),
  }),
});

export const collections = {
  blog, project
};
