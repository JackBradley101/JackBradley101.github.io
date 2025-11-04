# Jack Bradley

Personal website and project portfolio built with Jekyll and GitHub Pages.

**Live Site:** [jackbradleyis.me](https://jackbradleyis.me) | [jackbradley101.github.io](https://jackbradley101.github.io)

## About

I'm a third-year Engineering Physics student at UBC exploring the intersection of software, robotics, and simulation. This site showcases my projects in autonomous systems, vehicle dynamics, and machine learning.

## Adding New Posts

1. Create a markdown file in `_posts/` named `YYYY-MM-DD-project-name.md`
2. Add front matter:

```yaml
---
layout: post
title: "Your Project Title"
date: 2025-11-04
tags: [robotics, simulation, machine-learning]
image: /images/project-thumbnail.jpg
---
```

3. Write your content in Markdown
4. Add images to `/images/` folder
5. Commit and push - GitHub Pages auto-deploys

## Local Development

```bash
bundle install
bundle exec jekyll serve
```

Visit `http://localhost:4000`

## Customization

- **Bio & Links:** Edit `_config.yml`
- **Styling:** Edit `style.css`
- **Colors:** Currently using Deep Blue & Teal theme

## Tech Stack

- Jekyll static site generator
- GitHub Pages hosting
- Custom CSS (no frameworks)
- Responsive design
