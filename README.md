# Yorisoft.dev

This repository contains the source for **Yorisoft.dev**, my personal blog and portfolio site.

The design of this site is inspired by [W3’s free portfolio website](https://www.w3schools.com/howto/howto_website_create_portfolio.asp), which served as an early reference for layout and information hierarchy. From there, the design was adapted and reworked to better support support my needs, such as cheap hosting, SGG, and SEO.

The site is built with **Astro** and **Tailwind CSS**, and is primarily used for technical blogging, project logs, and gaming related escapades.

🌐 **Live site:** [http://yorisoft.github.io/](http://yorisoft.github.io/)

---

## ✨ Tech Stack

* <img src="https://go-skill-icons.vercel.app/api/icons?i=md" />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;  Written in GitHub style Markdown via `.md` or `.mdx`
* <img src="https://go-skill-icons.vercel.app/api/icons?i=tailwind" />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;  Tailwind CSS and tailwindprose plugin
* <img src="https://go-skill-icons.vercel.app/api/icons?i=astro" />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;  Astro 5
* <img src="https://go-skill-icons.vercel.app/api/icons?i=react" />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;  React islands components - interactive UI components only where needed
* <img src="https://go-skill-icons.vercel.app/api/icons?i=shadcn" />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;  Shadcn
* <img src="https://go-skill-icons.vercel.app/api/icons?i=typescript" />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;  TypeScript

---

## 📁 Project Structure

```text
src/
├── components/        # Reusable UI components
├── layouts/           # Page and content layouts
├── pages/             # Route-based pages
├── content/
│   └── blog/          # Markdown blog posts
├── styles/            # Global styles
public/
└── images/            # Static assets (thumbnails, media)
```

* Blog content lives in `src/content/blog/`
* Static assets are served from `public/`
* Image assets are served from `public/images`

---

## 📝 Writing Blog Posts

Blog posts are written in Markdown and managed using **Astro Content Collections**. 

### frontmatter

```yaml
---
title: string
authors: array
pubDate: ISO date
description: string 
thumbnail: string
url: string
---

// Example

---
title: "GSoC’25 KWin Project Blog Post: Week 3–4"
authors: ["yorisoft"]
pubDate: 2025-09-15
description: "Turning research into real KWin logic"
url: "https://external-link-if-needed"
thumbnail: "/images/kwin-week-3-4.png"
---

```

**Required**

* `title`
* `pubDate`
* `authors`

**Optional**

* `description`
* `thumbnail`
* `url` 

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

The requirements for my blog are simple:

- Cost efficient hosting
- Static Site Generation
- Ability to generate good SEO
  
These requirements feed into one another. For cost efficiency, I focused on inexpensive hosting options. At the top of my list were **GitHub Pages (`github.io`)** and **AWS S3**. Both are affordable because they serve **static files directly to the client**—there’s no server-side compute or worker doing runtime rendering.

Because of this, **static site generation (SSG)** became a key requirement. An SSG allows me to build the site using modern languages and frameworks—not just raw HTML and CSS—while still producing static HTML and CSS at the end. Those outputs can then be hosted easily on static hosting platforms.

My website doesn’t currently have the best SEO 😅, which is something I plan to improve over time. That said, generating real HTML and CSS is already a significant improvement over what I would have had using a purely client-rendered React.js site.

This is where **Astro** really shines. It meets all of these requirements while remaining simple and flexible to work with.

Check it out: **[https://astro.build](https://astro.build)**

---
## Contribute  

Check [CONTRIBUTING.md](https://github.com/Yorisoft/yorisoft.github.io/blob/main/CONTRIBUTING.md) for info on how to contribute. 

---
## ❤️ Support Me

If you find this site, the writing, or the open-source work behind it useful, consider supporting me.  
[Support](https://github.com/sponsors/Yorisoft)


