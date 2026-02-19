'use strict';

import { applyI18n, getMessage } from './ui/i18n.js';

// --- DOM References ---
const DOM = {
    intervalInput: () => document.getElementById('interval'),
    setButton: () => document.getElementById('set'),
    clearButton: () => document.getElementById('clear'),
    statusDiv: () => document.getElementById('status'),
    timerList: () => document.getElementById('timer-list'),
    clearAllButton: () => document.getElementById('clear-all'),
    exportButton: () => document.getElementById('export-btn'),
    importButton: () => document.getElementById('import-btn'),
    importFile: () => document.getElementById('import-file'),
    optionsButton: () => document.getElementById('options-btn'),
    currentTabSection: () => document.getElementById('current-tab-section'),
};

let currentTabId = null;

// --- Status Display ---

/**
 * Displays a status message with appropriate styling.
 * Auto-clears after 3 seconds.
 * @param {string} message - The message to display.
 * @param {boolean} [isError=false] - Whether this is an error message.
 */
function showStatus(message, isError = false) {
    const statusDiv = DOM.statusDiv();
    if (!statusDiv) return;

    statusDiv.textContent = message;
    statusDiv.classList.remove('status--success', 'status--error');
    statusDiv.classList.add(isError ? 'status--error' : 'status--success');

    setTimeout(() => {
        if (statusDiv.textContent === message) {
            statusDiv.textContent = '';
            statusDiv.classList.remove('status--success', 'status--error');
        }
    }, 3000);
}

// --- Background Communication ---

/**
 * Sends a message to the background service worker.
 * @param {object} message - The message payload.
 * @returns {Promise<object>} The response from the background.
 * @throws {Error} If the response indicates failure.
 */
async function sendMessage(message) {
    const response = await chrome.runtime.sendMessage(message);
    if (!response?.success) {
        throw new Error(response?.error || 'Unknown error');
    }
    return response;
}

/**
 * Fetches and displays the current interval for the active tab.
 * @param {number} tabId - The active tab ID.
 */
async function loadCurrentInterval(tabId) {
    try {
        const response = await sendMessage({ action: 'getTimer', tabId });
        const interval = response.interval;

        DOM.intervalInput().value = interval > 0 ? interval : '';

        if (interval > 0) {
            showStatus(getMessage('currentIntervalStatus').replace('{interval}', interval));
        } else {
            showStatus(getMessage('noActiveTimerStatus'));
        }
    } catch (error) {
        console.error('Error getting current interval:', error);
        showStatus(getMessage('errorGettingTimer'), true);
        disableControls();
    }
}

/**
 * Sets the reload interval for the active tab.
 * @param {number} tabId - The active tab ID.
 * @param {number} intervalMinutes - The interval (0 to disable).
 */
async function setTimer(tabId, intervalMinutes) {
    try {
        if (!Number.isInteger(intervalMinutes) || intervalMinutes < 0) {
            showStatus(getMessage('invalidInterval'), true);
            return;
        }

        await sendMessage({ action: 'setTimer', tabId, interval: intervalMinutes });

        if (intervalMinutes > 0) {
            showStatus(getMessage('timerSetStatus').replace('{interval}', intervalMinutes));
        } else {
            showStatus(getMessage('timerClearedStatus'));
        }

        await loadTimerList();
    } catch (error) {
        console.error('Error setting timer:', error);
        showStatus(getMessage('errorSettingTimer'), true);
    }
}

// --- Timer List ---

/**
 * Loads and renders the list of all active timers across all tabs.
 */
async function loadTimerList() {
    const timerList = DOM.timerList();
    if (!timerList) return;

    try {
        const response = await sendMessage({ action: 'getAllTimers' });
        const timers = response.timers || [];

        if (timers.length === 0) {
            timerList.innerHTML = `<div class="timer-empty" data-i18n="noActiveTimers">${getMessage('noActiveTimers')}</div>`;
            return;
        }

        timerList.innerHTML = timers.map(timer => `
            <div class="timer-item" data-tab-id="${timer.tabId}">
                <div class="timer-item-info">
                    <div class="timer-item-title" title="${escapeHtml(timer.url)}">${escapeHtml(timer.title)}</div>
                    <div class="timer-item-interval">${timer.interval} min</div>
                </div>
                <button class="timer-item-clear" data-tab-id="${timer.tabId}">✕</button>
            </div>
        `).join('');

        // Attach clear handlers
        timerList.querySelectorAll('.timer-item-clear').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const tabId = parseInt(btn.dataset.tabId, 10);
                await sendMessage({ action: 'setTimer', tabId, interval: 0 });

                // If it's the current tab, reset the input
                if (tabId === currentTabId) {
                    DOM.intervalInput().value = '';
                    showStatus(getMessage('timerClearedStatus'));
                }

                await loadTimerList();
            });
        });
    } catch (error) {
        console.error('Error loading timer list:', error);
        timerList.innerHTML = `<div class="timer-empty">Error loading timers</div>`;
    }
}

// --- Export / Import ---

/**
 * Exports all extension settings as a JSON file download.
 */
async function exportSettings() {
    try {
        const response = await sendMessage({ action: 'exportSettings' });
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'auto-tab-reloader-settings.json';
        link.click();

        URL.revokeObjectURL(url);
        showStatus('Settings exported successfully.');
    } catch (error) {
        console.error('Export failed:', error);
        showStatus('Export failed.', true);
    }
}

/**
 * Imports extension settings from a JSON file.
 * @param {File} file - The JSON file to import.
 */
async function importSettings(file) {
    try {
        const text = await file.text();
        const data = JSON.parse(text);

        await sendMessage({ action: 'importSettings', data });
        showStatus('Settings imported successfully.');

        // Refresh the UI
        if (currentTabId) {
            await loadCurrentInterval(currentTabId);
        }
        await loadTimerList();
    } catch (error) {
        console.error('Import failed:', error);
        showStatus('Import failed: invalid file.', true);
    }
}

// --- Utilities ---

/**
 * Escapes HTML entities to prevent XSS in rendered content.
 * @param {string} text - The text to escape.
 * @returns {string} The escaped text.
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Disables the interval controls when the tab is restricted.
 */
function disableControls() {
    DOM.intervalInput().disabled = true;
    DOM.setButton().disabled = true;
    DOM.clearButton().disabled = true;
    DOM.currentTabSection()?.classList.add('disabled');
}

// --- Initialization ---

document.addEventListener('DOMContentLoaded', async () => {
    // Apply i18n translations
    applyI18n();

    try {
        // Get the current active tab (async/await instead of callback)
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab?.id) {
            showStatus(getMessage('errorGettingTab'), true);
            disableControls();
            return;
        }

        currentTabId = tab.id;

        // Check for restricted URLs
        if (tab.url && isRestrictedUrl(tab.url)) {
            showStatus(getMessage('cannotSetOnPage'), true);
            disableControls();
        } else {
            await loadCurrentInterval(currentTabId);
        }

        // Load active timer list
        await loadTimerList();
    } catch (error) {
        console.error('Initialization error:', error);
        showStatus(getMessage('errorGettingTab'), true);
        disableControls();
    }

    // --- Event Listeners ---

    DOM.setButton().addEventListener('click', () => {
        if (currentTabId === null) {
            showStatus(getMessage('errorGettingTab'), true);
            return;
        }

        const rawValue = DOM.intervalInput().value.trim();

        if (rawValue === '') {
            setTimer(currentTabId, 0);
            return;
        }

        const interval = parseInt(rawValue, 10);

        if (!Number.isInteger(interval) || interval <= 0) {
            showStatus(getMessage('invalidInterval'), true);
            return;
        }

        setTimer(currentTabId, interval);
    });

    DOM.clearButton().addEventListener('click', () => {
        if (currentTabId === null) {
            showStatus(getMessage('errorGettingTab'), true);
            return;
        }
        DOM.intervalInput().value = '';
        setTimer(currentTabId, 0);
    });

    DOM.clearAllButton()?.addEventListener('click', async () => {
        try {
            const response = await sendMessage({ action: 'getAllTimers' });
            for (const timer of (response.timers || [])) {
                await sendMessage({ action: 'setTimer', tabId: timer.tabId, interval: 0 });
            }
            DOM.intervalInput().value = '';
            showStatus(getMessage('timerClearedStatus'));
            await loadTimerList();
        } catch (error) {
            console.error('Clear all failed:', error);
            showStatus('Failed to clear all timers.', true);
        }
    });

    DOM.exportButton()?.addEventListener('click', exportSettings);

    DOM.importButton()?.addEventListener('click', () => {
        DOM.importFile()?.click();
    });

    DOM.importFile()?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) {
            importSettings(file);
            e.target.value = ''; // Reset for re-import
        }
    });

    DOM.optionsButton()?.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
});

/**
 * Checks if a URL is restricted from timer assignment.
 * @param {string} url - The URL to check.
 * @returns {boolean}
 */
function isRestrictedUrl(url) {
    const restricted = [
        'chrome://',
        'chrome-extension://',
        'file://',
        'https://chrome.google.com/webstore',
        'edge://',
        'about:',
    ];
    return restricted.some(prefix => url.startsWith(prefix));
}