# ImageDownloader

A browser-based tool for restaurant and food business teams to search menu item names, select high-quality stock food images, and download them with clean filenames.

## What it does

- Accepts one menu item per line.
- Searches Pexels first.
- Falls back to Unsplash when Pexels has no usable result or fails.
- Shows selectable image cards for each menu item.
- Auto-selects the first result for every item.
- Downloads one selected image per item.
- Downloads all selected images as a ZIP.
- Stores API keys only in the user's browser localStorage.

## Files

```text
ImageDownloader/
├── index.html
├── styles.css
├── app.js
├── REQUIREMENTS.md
└── README.md
```

## Setup

1. Get a Pexels API key from https://www.pexels.com/api/
2. Optionally get an Unsplash access key from https://unsplash.com/developers
3. Open the app in a browser.
4. Click Settings.
5. Paste the keys.
6. Save settings.
7. Paste menu items and click Search All Images.


## Notes

- API keys are not stored in the code.
- API keys are saved per browser/device in localStorage.
- The app has no backend.
- Running from GitHub Pages is preferred over opening with `file://` because some browser/API behavior can be stricter locally.
