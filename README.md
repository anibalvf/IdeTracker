# IdeTracker

Chrome extension to track and monitor real estate listings on Idealista Save properties, record price history, and never lose track of a listing again.

---

## The problem

- Property prices change frequently with no notification
- When a listing is sold or removed, it disappears completely — no trace left
- There's no way to know if a price went up or down since you last checked

## What IdeTracker does

- **Save any listing** with one click: title, price, address, cover photo, features and description
- **Track price history**: every time you re-save a listing, if the price changed it gets recorded with date and direction (▼ down, ▲ up)
- **Access your saved properties** directly from the extension popup, with all data available offline

---

## Features

- One-click save from any Idealista property page
- Cover photo saved in high resolution
- Collapsible description (full text, shown on demand)
- Property features stored as tags
- Full price history per property with visual indicators
- Duplicate detection — re-saving updates the price instead of creating duplicates
- All data stored locally in the browser (`chrome.storage.local`) — no backend, no account needed
- Remove individual properties or clear all at once

---

## Installation (Developer Mode — no store required)

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer Mode** (top right toggle)
4. Click **Load unpacked**
5. Select the `extension/` folder inside this repository
6. The IdeTracker icon will appear in your Chrome toolbar

---

## How to use

1. Navigate to any property listing on [idealista.com](https://www.idealista.com)
2. Click the IdeTracker icon in the toolbar
3. Click **Guardar vivienda** to save the listing
4. To check for price changes: revisit the listing later and click **Guardar vivienda** again — if the price changed, it will be recorded in the history

---

## Project structure

```
extension/
├── manifest.json   # Extension config (Manifest V3)
├── content.js      # DOM scraper — runs on Idealista pages
├── popup.html      # Extension popup UI
├── popup.js        # Popup logic and storage management
└── styles.css      # Popup styles
```

---

## Roadmap

- [ ] Automatic price check on saved properties (without manual re-save)
- [ ] Browser notifications on price change
- [ ] Detection of removed/sold listings
- [ ] Full dashboard page with price evolution charts
- [ ] Export to CSV / JSON
- [ ] Support for other portals (Fotocasa, Habitaclia)

---

## Tech stack

- Vanilla JavaScript
- Chrome Extensions API — Manifest V3
- `chrome.storage.local` for persistence
- No dependencies, no build step

---

## License

MIT — see [LICENSE](LICENSE)
