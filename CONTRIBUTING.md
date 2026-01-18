# Contributing

Contributions are welcomed! 
Concider opening an issue for questions or feature request.  
  
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

## 🔀 Forking & Contributing

This site is primarily personal, but you’re welcome to fork it for learning or experimentation.

### Recommended workflow for contributing

1. **Fork** this repository on GitHub
2. Clone your fork locally:

   ```bash
   git clone git@github.com:your-username/yorisoft.github.io.git
   ```
3. Add the original repo as `upstream`:

   ```bash
   git remote add upstream git@github.com:Yorisoft/yorisoft.github.io.git
   ```
4. Create a feature branch, commit your changes, and push to **your fork**
5. Open a Pull Request targeting `yorisoft.github.io/main`

This keeps your fork in sync while letting you experiment freely.

---

## 🚀 Local Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

The site will be available at:

```
http://localhost:4321
```
