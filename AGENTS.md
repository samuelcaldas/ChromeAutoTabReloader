# Repository Guidelines

## Project Structure & Module Organization
- `manifest.json` is the Chrome Extension (MV3) entry point and declares permissions, icons, locale, popup, and background service worker.
- `src/background.js` contains timer/alarm logic and tab reload behavior.
- `src/popup.html`, `src/popup.js`, and `src/style.css` define the popup UI and interactions.
- `_locales/en/messages.json` and `_locales/pt/messages.json` store localized strings.
- `icons/` contains extension icons (`16`, `32`, `48`, `128` px).
- There is currently no dedicated automated test directory.

## Build, Test, and Development Commands
- This project has no build step or package manager; run it directly as an unpacked extension.
- Load locally in Chrome:
  - Open `chrome://extensions`
  - Enable **Developer mode**
  - Click **Load unpacked** and select this repository root
- Quick manifest validation (PowerShell):
  - `Get-Content manifest.json | ConvertFrom-Json | Out-Null`
- Keep a clean branch before submitting:
  - `git status`

## Coding Style & Naming Conventions
- JavaScript: keep `'use strict';`, semicolons, and clear async/await flow.
- Indentation: follow existing file style (`4` spaces in JS/HTML, `2` spaces in CSS).
- Naming: `camelCase` for variables/functions, `UPPER_SNAKE_CASE` for constants (for example, `ALARM_NAME_PREFIX`).
- Use lowercase file names in `src/` and keep action/message keys explicit (for example, `setTimer`, `getTimer`).
- No formatter/linter is configured; keep changes minimal and consistent with nearby code.

## Testing Guidelines
- Testing is manual smoke testing in a Chromium browser.
- Validate at least:
  - Set a timer on a normal webpage and confirm periodic reload.
  - Clear the timer and confirm reload stops.
  - Reopen popup and confirm interval state is read correctly.
  - Confirm restricted pages (`chrome://`, `file://`, Chrome Web Store) are blocked.
- Document manual test results in each PR.

## Commit & Pull Request Guidelines
- Existing history uses short, imperative subjects (for example, `Update README.md`, `Include icons`).
- Recommended commit format: `<Verb> <short summary>` (about 72 chars max).
- PRs should include:
  - What changed and why
  - Manual test notes
  - Screenshots/GIFs for popup UI changes
  - Any `manifest.json` permission or locale updates

## Security & Configuration Tips
- Keep `manifest.json` permissions minimal; avoid adding broad permissions without justification.
- Do not store secrets/tokens in `chrome.storage.local` or locale files.
