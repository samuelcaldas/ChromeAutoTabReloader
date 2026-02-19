# Auto Tab Reloader

Auto Tab Reloader is a Chrome extension that automatically reloads tabs at user-defined intervals.

## Features

- **Per-tab timers** — Set a custom reload interval for each tab
- **Timer persistence** — Intervals survive popup close and are restored on browser startup
- **Active timer list** — View and manage all running timers from the popup
- **Badge indicator** — See the number of active timers on the extension icon
- **Options page** — Configure default interval, cache bypass, and badge visibility
- **Export / Import** — Back up and restore timer configurations as JSON
- **Localization** — Available in English and Portuguese

## Installation

1. Clone this repository or download the source code as a ZIP file and extract it.
2. Open a Chrome-based browser and go to `chrome://extensions`.
3. Enable **Developer mode** by clicking the toggle in the top right corner.
4. Click **Load unpacked** and select the `ChromeAutoTabReloader` folder.

## Usage

1. Click on the extension icon in the toolbar to open the popup.
2. Enter the desired reload interval (in minutes) in the input field.
3. Click **Set Timer** to start auto-reloading the current tab.
4. Click **Clear** to stop reloading the current tab.
5. Use the **Active Timers** section to see and manage all running timers.
6. Use the footer buttons to **Export**, **Import** settings, or open **Options**.

## Development

### Running Tests

```bash
npm install
npm test
```

### Loading for Development

1. Make code changes.
2. Go to `chrome://extensions` → click the **reload** button on the extension card.
3. Reopen the popup to see your changes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
