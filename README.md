# IdeTracker

IdeTracker is a Chrome extension that helps you track real estate listings on Idealista.  
Save properties, keep a record of price changes, and keep your own history of the listings you are interested in.

## The problem

Property listings change constantly and it is easy to lose track of what happened.

- Price drops are visible, but price increases are not clearly tracked
- When a property is removed or sold, the listing disappears completely
- There is no simple way to remember the previous price of a property you were following

If you are comparing properties or negotiating a purchase, having that history can be useful.

## What IdeTracker does

IdeTracker lets you save a listing and keep a local record of its information.

- Save property details with one click: title, price, address, photo, features and description
- Track price history over time
- Keep your own record of listings even if they change or disappear later

All data is stored locally in your browser, so no account or backend is required.

## Features

- One click save from any Idealista property page
- High resolution cover photo saved locally
- Property features stored as tags
- Full price history per property with visual indicators
- Duplicate detection. Saving the same property again updates the price instead of creating duplicates
- Collapsible full description stored locally
- Data stored locally using `chrome.storage.local`
- Remove individual properties or clear the entire list

## Installation (Developer Mode)

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer Mode** (top right)
4. Click **Load unpacked**
5. Select the `extension/` folder from this repository

The IdeTracker icon will appear in your Chrome toolbar.

## How to use

1. Navigate to any property listing on `idealista.com`
2. Click the IdeTracker icon in the browser toolbar
3. Click **Guardar vivienda** to save the property

To track price changes:

- Revisit the listing later
- Click **Guardar vivienda** again
- If the price changed, it will be added to the property's price history

## Project structure
extension/
├── manifest.json # Extension configuration (Manifest V3)
├── content.js # Scrapes property data from Idealista pages
├── popup.html # Extension popup UI
├── popup.js # Popup logic and storage management
└── styles.css # Popup styles

## Roadmap

- Automatic price checks for saved properties
- Browser notifications when a price changes
- Detection of removed or sold listings
- Dashboard with price evolution charts
- Export to CSV or JSON
- Support for other portals (Fotocasa, Habitaclia)

## Tech stack

- Vanilla JavaScript
- Chrome Extensions API (Manifest V3)
- `chrome.storage.local` for persistence

No dependencies. No build step.

## License

MIT. See the `LICENSE` file for details.