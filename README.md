# Bitcoin Price Tracker - Chrome Extension

A Chrome extension that displays real-time Bitcoin price information with visual indicators for price movements.

## Features

- Shows current Bitcoin price directly on the extension icon
- Color-coded badge background indicates price movement:
  - **Green**: Price up more than 0.5% in the last hour
  - **Red**: Price down more than 0.5% in the last hour  
  - **Grey**: Price relatively flat (within ±0.5%)
- Detailed popup with exact price and hourly percentage change
- Auto-updates every 5 minutes (icon) and 30 seconds (popup when open)

## How to Install

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked" and select the downloaded folder
5. The extension will appear in your browser toolbar

## Data Source

Price data is provided by the [CoinGecko API](https://www.coingecko.com/api/documentations/v3).

## License

MIT License
