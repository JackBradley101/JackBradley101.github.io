# Quick Start Guide

## ✅ What's Been Set Up

Your website is now ready! Here's what you have:

1. **Home Page** (`index.html`) - Shows your bio, photo, and project cards
2. **About Page** (`about.md`) - Detailed bio and skills
3. **Blog Posts** (`_posts/`) - Two example project posts to show you the format
4. **Clean Design** (`style.css`) - Modern, responsive styling with a purple gradient header
5. **Social Links** - Email, GitHub, and LinkedIn already configured

## 📋 Next Steps

### 1. Customize Your Content

**Edit `_config.yml`:**
- ✅ Name is already set to "Jack Bradley"
- ✅ Description is added
- ✅ Avatar is set to your GitHub profile pic
- ✅ Email, GitHub, and LinkedIn are configured
- 📝 Add Twitter/Instagram if you want (uncomment those lines)

**Edit `about.md`:**
- Fill in your detailed bio
- Add your skills and expertise
- Tell your story!

### 2. Add Your Profile Photo (Optional)

The site currently uses your GitHub profile picture. To use a custom photo:

1. Add your photo to the `images` folder (e.g., `images/profile.jpg`)
2. In `_config.yml`, change: `avatar: /images/profile.jpg`

### 3. Create Your First Real Project Post

1. Delete or modify the example posts in `_posts/`
2. Create a new file: `_posts/2025-11-04-my-first-project.md`
3. Copy this template:

```markdown
---
layout: post
title: "My Awesome Robot Project"
date: 2025-11-04
tags: [robotics, mechanical engineering, simulation]
image: /images/robot-project.jpg
---

## Overview
Describe your project...

## Technical Details
What technologies did you use?

## Results
Show photos and videos!

![Project Image](/images/robot-project.jpg)
```

### 4. Add Project Images

1. Save your project photos to the `images/` folder
2. Reference them in your posts: `![Description](/images/filename.jpg)`
3. Or use external URLs: `![Description](https://example.com/image.jpg)`

### 5. Push to GitHub

```bash
git add .
git commit -m "Set up personal website"
git push origin main
```

Your site will automatically build and be live at:
- https://jackbradley101.github.io
- https://jackbradleyis.me (if DNS is configured)

## 🎨 Customization Tips

### Change the Header Colors

Edit `style.css`, find `.home-header` and change the gradient:

```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

Try these alternatives:
- Blue: `linear-gradient(135deg, #667eea 0%, #4facfe 100%)`
- Green: `linear-gradient(135deg, #11998e 0%, #38ef7d 100%)`
- Orange: `linear-gradient(135deg, #f093fb 0%, #f5576c 100%)`

### Add More Social Links

In `_config.yml`, uncomment and fill in any of these:
- twitter
- instagram
- youtube
- stackoverflow
- facebook

## 🧪 Testing Locally

To preview changes before pushing:

1. Install Ruby: https://rubyinstaller.org/
2. Open PowerShell in this folder
3. Run:
   ```powershell
   bundle install
   bundle exec jekyll serve
   ```
4. Open http://localhost:4000

## 📚 Markdown Cheatsheet

For writing project posts:

```markdown
# Heading 1
## Heading 2
### Heading 3

**bold text**
*italic text*

[Link text](https://example.com)
![Image](path/to/image.jpg)

- Bullet point
- Another bullet

1. Numbered list
2. Another item

`inline code`

```python
# Code block
def hello():
    print("Hello!")
```

> Blockquote
```

## 🎥 Adding Videos

For YouTube videos:

```html
<iframe width="100%" height="400" 
  src="https://www.youtube.com/embed/VIDEO_ID" 
  frameborder="0" allowfullscreen>
</iframe>
```

For local videos:

```html
<video width="100%" controls>
  <source src="/images/my-video.mp4" type="video/mp4">
</video>
```

## 🆘 Troubleshooting

**Site not updating?**
- GitHub Pages can take 1-2 minutes to rebuild
- Check the Actions tab in your GitHub repo for build status

**Images not showing?**
- Make sure the path starts with `/` (e.g., `/images/photo.jpg`)
- Check that the image file is committed to the repo

**Styling looks broken?**
- Clear your browser cache (Ctrl+Shift+R)
- Check that `style.css` is in the root directory

## 📞 Need Help?

- Jekyll Documentation: https://jekyllrb.com/docs/
- GitHub Pages Guide: https://docs.github.com/en/pages
- Markdown Guide: https://www.markdownguide.org/

---

**You're all set! Start adding your amazing projects! 🚀**
