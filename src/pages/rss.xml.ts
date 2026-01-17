import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET(context) {
  const posts = await getCollection("blog");

  return rss({
    title: "Yorisoft.dev",
    description: "Yorisoft.dev RSS Feed",
    site: context.site,
    items: posts.reverse().map((post) => ({
      title: post.data.title,
      authors: post.data.authors,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/blog/${post.id.split('/')[0]}`,
    })),
  });
}
