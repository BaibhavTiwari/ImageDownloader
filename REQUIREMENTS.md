# 📋 Menu Image Downloader — Requirements Document

## Project Overview
A browser-based web tool that allows restaurant/food business teams to search and
batch-download high-quality images of menu items, saved with the exact name used
to search. Zero backend, deployable on GitHub Pages, accessible via shared URL.

---

## 🎯 Core Goals
- Input menu item names → get real food images → download with correct filenames
- No server required (pure client-side)
- Team-shareable via GitHub Pages URL
- Clean, professional UI

---

## 🔌 Image Sources (Dual-Source Fallback)

### Primary: Pexels API
- **Signup**: https://www.pexels.com/api/
- **Key type**: Free, instant, no credit card
- **Rate limit**: 200 req/hour (free tier)
- **Image quality**: High (up to 4K originals)
- **Download permission**: ✅ Allowed
- **Attribution**: Not required

### Fallback: Unsplash API
- **Signup**: https://unsplash.com/developers
- **Key type**: Free, instant, no credit card
- **Rate limit**: 50 req/hour (demo), 5000/hr (production after approval)
- **Image quality**: Very High (professional photography)
- **Download permission**: ✅ Allowed
- **Attribution**: Required in API mode (handled in UI)

---

## ✅ Features — MVP (Phase 1)

### Input
- [ ] Multi-line text area: one menu item name per line
- [ ] Example: `Butter Chicken`, `Caesar Salad`, `Mango Lassi`
- [ ] "Search All" button to trigger batch search
- [ ] Optional: image orientation toggle (landscape / portrait / square)

### Search & Display
- [ ] Fetch top 3 image results per item from Pexels (fallback: Unsplash)
- [ ] Show image previews in a card grid per item
- [ ] Each card shows: item name, image thumbnail, resolution tag
- [ ] User can select preferred image (click to highlight)
- [ ] Default: first result auto-selected

### Download
- [ ] "Download Selected" — downloads one image per item
- [ ] "Download All as ZIP" — packages all selected images into a `.zip`
- [ ] Filename format: `<exact search term>.<ext>` → e.g., `Butter Chicken.jpg`
- [ ] Images saved in original high-resolution (not thumbnail)

### Config
- [ ] API key input section (on first use or settings panel)
- [ ] Keys stored in `localStorage` (no server, no exposure)
- [ ] Indicator showing which source (Pexels/Unsplash) was used

---

## ✅ Features — Nice-to-Have (Phase 2)

- [ ] Drag-to-reorder items
- [ ] Search history (last 10 sessions, stored in localStorage)
- [ ] "Regenerate" button per item to fetch next set of results
- [ ] Image resolution filter (HD / Full HD / 4K)
- [ ] Dark/Light mode toggle
- [ ] Export image metadata (name, source URL, photographer) as CSV

---

## 🏗️ Technical Stack

| Layer | Technology | Reason |
|---|---|---|
| Language | HTML5 + CSS3 + Vanilla JS | No build step, works on GitHub Pages |
| Image API 1 | Pexels REST API | Free, fast, food images, direct download |
| Image API 2 | Unsplash REST API | Fallback, premium quality |
| ZIP creation | JSZip (CDN) | Client-side ZIP, no backend |
| File download | FileSaver.js (CDN) | Cross-browser download support |
| Fonts | Google Fonts CDN | Free, no install |
| Deployment | GitHub Pages | Free, sharable team URL |

**Dependencies (all via CDN, no npm needed):**
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>
```

---

## 📁 File Structure

```
menu-image-downloader/
├── index.html          ← Main app (all-in-one)
├── REQUIREMENTS.md     ← This file
└── README.md           ← GitHub README with setup instructions
```

---

## 🚀 Deployment — GitHub Pages

### Steps
1. Create a new GitHub repo: `menu-image-downloader`
2. Upload `index.html` (and optionally README.md)
3. Go to repo Settings → Pages → Source: `main` branch, `/ (root)`
4. GitHub publishes it at: `https://<your-username>.github.io/menu-image-downloader`
5. Share URL with team

### API Key Setup for Team
- Each team member opens the tool URL
- On first load, a settings panel prompts for API keys
- Keys are saved in browser `localStorage` — private per device
- No keys are shared, no server stores them

---

## 🔑 Getting API Keys (One-time Setup)

### Pexels (Primary)
1. Go to https://www.pexels.com/api/
2. Click "Get Started" → sign up free
3. Your API key appears instantly on the dashboard
4. Paste it in the tool's Settings panel

### Unsplash (Fallback)
1. Go to https://unsplash.com/developers
2. Click "Register as a developer"
3. Create a new application (name: "Menu Image Tool")
4. Copy the "Access Key"
5. Paste it in the tool's Settings panel

---

## 🔒 Security Notes
- API keys stored only in browser localStorage (client-side only)
- No data sent to any server other than Pexels/Unsplash
- Keys never appear in the GitHub repo source code
- Each team member manages their own keys

---

## 📐 UI Wireframe (Text)

```
┌─────────────────────────────────────────────────────────┐
│  🍽️  Menu Image Downloader            [⚙ Settings]     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Paste menu items (one per line):                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Butter Chicken                                    │  │
│  │ Caesar Salad                                      │  │
│  │ Mango Lassi                                       │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  [🔍 Search All Images]   [↓ Download All as ZIP]      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Butter Chicken                              [Pexels ✓] │
│  ┌──────┐  ┌──────┐  ┌──────┐                         │
│  │  ✓   │  │      │  │      │   [↓ Download]           │
│  │ img1 │  │ img2 │  │ img3 │                          │
│  └──────┘  └──────┘  └──────┘                         │
│                                                         │
│  Caesar Salad                               [Pexels ✓] │
│  ┌──────┐  ┌──────┐  ┌──────┐                         │
│  │  ✓   │  │      │  │      │   [↓ Download]           │
│  │ img1 │  │ img2 │  │ img3 │                          │
│  └──────┘  └──────┘  └──────┘                         │
└─────────────────────────────────────────────────────────┘
```

---

## ⚠️ Limitations
- Pexels/Unsplash are stock photo libraries — images are generic food photography,
  not photos of your specific restaurant's dishes
- For exact dish photos, you'd need a custom image upload workflow (Phase 3 idea)
- Rate limits apply: ~200 items/hour on free Pexels tier (more than enough for teams)
- Some CORS restrictions may apply if running locally from `file://` — use GitHub Pages

---

*Document version: 1.0 | Created: April 2026*
