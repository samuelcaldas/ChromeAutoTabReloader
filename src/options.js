'use strict';

import { applyI18n } from './ui/i18n.js';

// --- DOM References ---
const DOM = {
    defaultInterval: () => document.getElementById('default-interval'),
    bypassCache: () => document.getElementById('bypass-cache'),
    showBadge: () => document.getElementById('show-badge'),
    saveButton: () => document.getElementById('save-btn'),
    statusDiv: () => document.getElementById('status'),
};

/**
 * Shows a status message on the options page.
 * @param {string} message - The message to display.
 * @param {boolean} [isError=false] - Whether this is an error message.
 */
function showStatus(message, isError = false) {
    const statusDiv = DOM.statusDiv();
    statusDiv.textContent = message;
    statusDiv.classList.toggle('status--error', isError);

    setTimeout(() => {
        if (statusDiv.textContent === message) {
            statusDiv.textContent = '';
        }
    }, 3000);
}

/**
 * Loads the current options from storage and populates the form.
 */
async function loadOptions() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'getOptions' });

        if (response?.success && response.options) {
            const { defaultInterval, bypassCache, showBadge } = response.options;
            DOM.defaultInterval().value = defaultInterval;
            DOM.bypassCache().checked = bypassCache;
            DOM.showBadge().checked = showBadge;
        }
    } catch (error) {
        console.error('Error loading options:', error);
        showStatus('Failed to load options.', true);
    }
}

/**
 * Saves the current form values to storage.
 */
async function saveOptions() {
    try {
        const defaultInterval = parseInt(DOM.defaultInterval().value, 10);

        if (!Number.isInteger(defaultInterval) || defaultInterval < 1) {
            showStatus('Default interval must be a positive integer.', true);
            return;
        }

        const options = {
            defaultInterval,
            bypassCache: DOM.bypassCache().checked,
            showBadge: DOM.showBadge().checked,
        };

        const response = await chrome.runtime.sendMessage({ action: 'saveOptions', options });

        if (response?.success) {
            showStatus('Options saved successfully!');
        } else {
            throw new Error(response?.error || 'Unknown error');
        }
    } catch (error) {
        console.error('Error saving options:', error);
        showStatus('Failed to save options.', true);
    }
}

// --- Initialization ---

document.addEventListener('DOMContentLoaded', async () => {
    applyI18n();
    await loadOptions();

    DOM.saveButton().addEventListener('click', saveOptions);
});
