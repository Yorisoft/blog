# Yorisoft.dev

This repository contains the source for Yorisoft.dev, my personal blog and portfolio site.
It’s used for technical blogging, project write-ups, and long-form engineering notes.

The design of this site is inspired by [W3’s free portfolio website](https://themes.3rdwavemedia.com/devcard/bs5/index.html), which served as an early reference for layout and information hierarchy. From there, the design was adapted and reworked to better support my needs, such as cheap hosting, SGG, and SEO.

🌐 **Live site:** [http://yorisoft.github.io/](http://yorisoft.github.io/)

---

## ✨ Tech Stack
### Content & Authoring
* <img src="https://go-skill-icons.vercel.app/api/icons?i=md" height="18" /> **Markdown / MDX** — Written in GitHub-style Markdown via `.md` or `.mdx`
### Framework and Rendering
* <img src="https://go-skill-icons.vercel.app/api/icons?i=astro" height="18" /> **Astro 5** — Static-first framework with partial hydration
### Styling & UI
* <img src="https://go-skill-icons.vercel.app/api/icons?i=tailwind" height="18" /> **Tailwind CSS** — Utility-first styling with `@tailwindcss/typography`
* <img src="https://go-skill-icons.vercel.app/api/icons?i=shadcn" height="18" /> **shadcn/ui** — Reusable, accessible component primitives
### Interactivity
* <img src="https://go-skill-icons.vercel.app/api/icons?i=react" height="18" /> **React (Islands)** — Interactive components only where needed
### Language
* <img src="https://go-skill-icons.vercel.app/api/icons?i=typescript" height="18" /> **TypeScript** — Type-safe UI and content logic

---

## 📁 Project Structure

```text
src/
├── components/        # Reusable UI components
├── layouts/           # Page and content layouts
├── pages/             # Route-based pages
├── content/
│   └── blog/          # Markdown blog posts
│   └── project/       # Markdown project page
├── styles/            # Global styles
public/
└── images/            # Static assets (thumbnails, media)
```

* Blog content lives in `src/content/blog/.`
* Static assets (including images) are served from `public/`

---

## 📝 Writing Blog Posts

Blog posts are written in Markdown and validated using Astro Content Collections, which enforce required frontmatter fields at build time. 

### frontmatter

```yaml
// Blogs
---
title: string
authors: array
pubDate: ISO date
description: string 
thumbnail: string
url: string


// Projects
title: string
authors: array
date: ISO date
description: string
url: string
thumbnail: string
technologies: array 
---

// Example

---
title: "Blog Title: foo"
authors: ["yorisoft"]
pubDate: 2025-09-15
description: "foo"
url: "https://foo.co"
thumbnail: "/images/foo.png"



title: "Project Title: foo"
authors: ["yorisoft"]
date: 2025-01-10
description: "foo"
url: "foo.co"
thumbnail: "/images/foo.png"
technologies: 
    - js
    - nodejs
    - docker
---

```

Each post automatically:

* Appears on the homepage
* Is sorted by publish date
* Gets its own route
* Is included in the RSS feed

---

## 📰 RSS Feed

You can subscribe to this blog using any RSS reader with the following URL:

```
https://yorisoft.github.io/rss.xml
```

Popular RSS readers include:

- [Feedly](https://feedly.com/)
- [Inoreader](https://www.inoreader.com/)
- [NetNewsWire](https://netnewswire.com/)
- [Thunderbird](https://www.thunderbird.net/)

Once subscribed, new posts will appear automatically in your reader.

---

## 🎨 Design Notes

This site prioritizes cost efficiency, static generation, and SEO.
  
These requirements feed into one another. For cost efficiency, I focused on inexpensive hosting options. At the top of my list were **GitHub Pages (`github.io`)** and **AWS S3**. Both are affordable because they serve **static files directly to the client**—there’s no server-side compute or worker doing runtime rendering.

Because of this, **static site generation (SSG)** became a key requirement. An SSG allows me to build the site using modern languages and frameworks—not just raw HTML and CSS—while still producing static HTML and CSS at the end. Those outputs can then be hosted easily on static hosting platforms.

My website doesn’t currently have the best SEO 😅, which is something I plan to improve over time. That said, generating real HTML and CSS is already a significant improvement over what I would have had using a purely client-rendered React.js site.

This is where **Astro** really shines. It meets all of these requirements while remaining simple and flexible to work with.

Check it out: **[https://astro.build](https://astro.build)**

---
## ❤️ Support Me

If you find this site, the writing, or the open-source work behind it useful, consider supporting me.  
[Support](https://github.com/sponsors/Yorisoft)
