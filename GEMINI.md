# Chrome Auto Tab Reloader - Project Context

This document provides instructional context for the Chrome Auto Tab Reloader project.

## Project Overview
Chrome Auto Tab Reloader is a browser extension (Manifest V3) designed to automatically refresh specific tabs at user-defined intervals. It uses the `chrome.alarms` API for precision and the `chrome.storage.local` API for persistence.

### Key Technologies
- **Extension API:** Chrome Extension Manifest V3
- **Background Logic:** Service Worker (`src/background.js`) utilizing `chrome.alarms`.
- **UI:** HTML/CSS popup (`src/popup.html`, `src/style.css`) with DOM-driven logic (`src/popup.js`).
- **Localization:** Support for multiple languages via `_locales/`.

### Architecture
- **Popup (`src/popup.js`):** Interacts with the user to set/get intervals. Communicates with the background service worker using `chrome.runtime.sendMessage`.
- **Background (`src/background.js`):** Manages the lifecycle of alarms. Listens for messages from the popup, schedules reloads, and cleans up storage/alarms when tabs are closed.

## Building and Running
As a vanilla JavaScript extension, there is no compilation step.

### Installation / Development
1. Open a Chrome-based browser and navigate to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the project root directory (`ChromeAutoTabReloader`).

### Testing
- **Manual Verification:** Open the popup, set a 1-minute timer, and verify the tab reloads after 60 seconds.
- **Background Logs:** Inspect the Service Worker from the `chrome://extensions` page to view console logs for alarm triggers.

## Development Conventions
- **Asynchronous Patterns:** Use `async/await` for Chrome API calls (which return Promises in MV3).
- **Naming:** Alarms are prefixed with `tab-reloader-alarm-` followed by the `tabId`.
- **Cleanup:** Always listen to `chrome.tabs.onRemoved` to prevent storage leaks.
- **UI Feedback:** Provide visual status updates in the popup for user actions (Success/Error).
- **Documentation:** Use JSDoc for function headers to maintain clarity.
- **Strict Mode:** All JavaScript files should start with `'use strict';`.

## Key Files
- `manifest.json`: Extension configuration and permissions (`tabs`, `storage`, `alarms`).
- `src/background.js`: Core logic for managing alarms and reloads.
- `src/popup.js`: Frontend logic for the extension menu.
- `_locales/`: i18n message definitions.
