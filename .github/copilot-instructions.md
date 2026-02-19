# Copilot Instructions — Chrome Auto Tab Reloader

## Architecture

Chrome Extension (Manifest V3) with two runtime contexts that communicate via message passing:

- **Service Worker** ([src/background.js](../src/background.js)) — manages `chrome.alarms` lifecycle and reloads tabs. Persists per-tab interval in `chrome.storage.local` keyed by `tab-reloader-alarm-{tabId}`.
- **Popup UI** ([src/popup.html](../src/popup.html), [src/popup.js](../src/popup.js), [src/style.css](../src/style.css)) — reads/writes timer state through `chrome.runtime.sendMessage` with actions `getTimer` and `setTimer`.

Data flow: **Popup → `sendMessage({action, tabId, interval})` → Background → `chrome.alarms` + `chrome.storage.local`**.

Cleanup: `chrome.tabs.onRemoved` clears alarm + storage; `chrome.runtime.onStartup` wipes stale alarms.

## Development Setup

No build step, no package manager. Load as unpacked extension:
1. `chrome://extensions` → Developer mode → Load unpacked → select repo root.
2. Inspect Service Worker logs from the same page.

Validate manifest: `Get-Content manifest.json | ConvertFrom-Json | Out-Null`

## Coding Conventions

- Start every JS file with `'use strict';`.
- Indentation: 4 spaces in JS/HTML, 2 spaces in CSS.
- `camelCase` for variables/functions, `UPPER_SNAKE_CASE` for constants (e.g. `ALARM_NAME_PREFIX`).
- Use `async/await` for all Chrome API calls (MV3 returns Promises).
- JSDoc headers on every function.
- Alarm names follow the pattern: `tab-reloader-alarm-{tabId}`.

## Localization (i18n)

Two locales: `_locales/en/messages.json` and `_locales/pt/messages.json`. Default locale is `en`.
- Use `__MSG_keyName__` in `manifest.json` and `chrome.i18n.getMessage('keyName')` in JS.
- Every new user-facing string must be added to **both** locale files with a `description` field.

## Restricted Pages

The popup disables controls for URLs starting with `chrome://`, `file://`, or `https://chrome.google.com/webstore`. Maintain this guard when adding new features.

## Testing

Manual smoke tests only (no test framework). Verify:
1. Set a timer on a normal page → tab reloads at the interval.
2. Clear the timer → reload stops.
3. Close and reopen popup → interval value is restored.
4. Restricted pages → controls disabled, error message shown.
5. Close a tab with an active timer → alarm and storage are cleaned up.

## Permissions

Keep `manifest.json` permissions (`tabs`, `storage`, `alarms`) minimal. Any new permission requires justification in the PR.

## Commits

Short imperative subject: `<Verb> <summary>` (≤72 chars). PRs include manual test notes and screenshots for UI changes.
