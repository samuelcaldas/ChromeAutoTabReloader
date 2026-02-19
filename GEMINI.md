# Chrome Auto Tab Reloader - Project Context

This document provides instructional context for the Chrome Auto Tab Reloader project.

## Project Overview
Chrome Auto Tab Reloader is a browser extension (Manifest V3) designed to automatically refresh specific tabs at user-defined intervals. It uses the `chrome.alarms` API for precision and the `chrome.storage.local` API for persistence.

### Key Technologies
- **Extension API:** Chrome Extension Manifest V3
- **Background Logic:** ES Module Service Worker (`src/background.js`) utilizing `chrome.alarms`.
- **UI:** HTML/CSS popup (`src/popup.html`, `src/style.css`) with DOM-driven logic (`src/popup.js`).
- **Options:** Dedicated options page (`src/options.html`, `src/options.js`).
- **Localization:** Support for multiple languages via `_locales/` (English, Portuguese).
- **Testing:** Vitest with Chrome API mocks.

### Architecture
The project follows a modular ES Module architecture with separated concerns:

- **Services** (`src/services/`):
  - `AlarmService.js` — Facade for `chrome.alarms` API.
  - `StorageService.js` — Repository pattern for `chrome.storage.local`.
  - `TabService.js` — Helpers for querying, reloading, and validating tabs.
  - `BadgeService.js` — Manages the extension badge indicator.
- **UI** (`src/ui/`):
  - `i18n.js` — Internationalization utility using `data-i18n` attributes.
- **Shared** (`src/shared/`):
  - `constants.js` — Centralized constants (alarm prefix, default options, restricted URLs).
- **Background** (`src/background.js`): Entry point that registers event listeners. Uses handler map pattern for message routing.
- **Popup** (`src/popup.js`): Frontend logic for the popup, including active timer list, export/import, and options link.
- **Options** (`src/options.js`): Logic for the settings page (default interval, bypass cache, badge toggle).

## Building and Running
As a vanilla JavaScript extension using ES Modules, there is no compilation step.

### Installation / Development
1. Open a Chrome-based browser and navigate to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the project root directory (`ChromeAutoTabReloader`).

### Testing
```bash
npm install
npm test          # Run all tests once
npm run test:watch  # Watch mode
```

- **Unit Tests:** Vitest with Chrome API mocks in `tests/setup.js`.
- **Manual Verification:** Open the popup, set a 1-minute timer, and verify the tab reloads.
- **Background Logs:** Inspect the Service Worker from `chrome://extensions` to view console logs.

## Development Conventions
- **ES Modules:** All source files use `import/export` syntax. Service worker type is `"module"`.
- **Asynchronous Patterns:** Use `async/await` for all Chrome API calls.
- **Naming:** Alarms are prefixed with `tab-reloader-alarm-` followed by the `tabId`.
- **Handler Map Pattern:** Message routing in `background.js` uses a handler map (Open/Closed Principle).
- **Single Responsibility:** Functions do one thing. Side-effects are handled by callers.
- **Cleanup:** `chrome.tabs.onRemoved` listener prevents storage/alarm leaks.
- **Alarm Restore:** On browser startup, alarms are restored from storage for still-open tabs.
- **UI Feedback:** Status messages use CSS classes (`status--success`, `status--error`).
- **Internationalization:** All user-facing strings use `data-i18n` attributes and `chrome.i18n.getMessage()`.
- **Documentation:** Use JSDoc for function headers.
- **Strict Mode:** All JavaScript files start with `'use strict';`.

## Key Files
- `manifest.json`: Extension configuration (permissions, service worker, options page).
- `src/background.js`: Core logic — alarm scheduling, message handling, startup restoration.
- `src/popup.js`: Frontend logic — timer controls, active timer list, export/import.
- `src/options.js`: Settings page logic.
- `src/services/`: Service classes (Alarm, Storage, Tab, Badge).
- `src/shared/constants.js`: Shared constants and defaults.
- `src/ui/i18n.js`: Internationalization utility.
- `_locales/`: i18n message definitions (en, pt).
- `tests/`: Vitest unit tests with Chrome API mocks.
