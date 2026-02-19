'use strict';

/**
 * Applies internationalization to all DOM elements with `data-i18n` attributes.
 * Sets the element's `textContent` to the localized message from `chrome.i18n.getMessage()`.
 *
 * Usage: Add `data-i18n="messageKey"` to any HTML element.
 * Optionally add `data-i18n-placeholder="messageKey"` for input placeholders.
 * Optionally add `data-i18n-title="messageKey"` for title attributes.
 */
export function applyI18n() {
    // Text content
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const message = chrome.i18n.getMessage(key);
        if (message) {
            element.textContent = message;
        }
    });

    // Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        const message = chrome.i18n.getMessage(key);
        if (message) {
            element.placeholder = message;
        }
    });

    // Title attributes
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        const message = chrome.i18n.getMessage(key);
        if (message) {
            element.title = message;
        }
    });
}

/**
 * Gets a localized message by key, with optional substitutions.
 * @param {string} key - The message key from _locales.
 * @param {string|string[]} [substitutions] - Optional substitutions.
 * @returns {string} The localized message, or the key if not found.
 */
export function getMessage(key, substitutions) {
    return chrome.i18n.getMessage(key, substitutions) || key;
}
