'use strict';

import { RESTRICTED_URL_PREFIXES } from '../shared/constants.js';

/**
 * Service for Chrome tab operations.
 * Provides helpers for querying, reloading, and validating tabs.
 */
export class TabService {
    /**
     * Gets the currently active tab in the focused window.
     * @returns {Promise<chrome.tabs.Tab|null>} The active tab, or null if unavailable.
     */
    static async getActiveTab() {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        return tabs.length > 0 ? tabs[0] : null;
    }

    /**
     * Reloads a tab by its ID.
     * @param {number} tabId - The tab ID.
     * @param {boolean} [bypassCache=true] - Whether to bypass the browser cache.
     */
    static async reloadTab(tabId, bypassCache = true) {
        await chrome.tabs.reload(tabId, { bypassCache });
    }

    /**
     * Gets the Set of all currently open tab IDs.
     * @returns {Promise<Set<number>>}
     */
    static async getAllOpenTabIds() {
        const tabs = await chrome.tabs.query({});
        return new Set(tabs.map(t => t.id));
    }

    /**
     * Retrieves basic info for a tab by ID.
     * @param {number} tabId - The tab ID.
     * @returns {Promise<{title: string, url: string}|null>}
     */
    static async getTabInfo(tabId) {
        try {
            const tab = await chrome.tabs.get(tabId);
            return { title: tab.title || `Tab ${tabId}`, url: tab.url || '' };
        } catch {
            return null;
        }
    }

    /**
     * Checks if a URL is restricted from having timers set.
     * @param {string} url - The URL to check.
     * @returns {boolean} True if the URL is restricted.
     */
    static isRestrictedUrl(url) {
        if (!url) return true;
        return RESTRICTED_URL_PREFIXES.some(prefix => url.startsWith(prefix));
    }
}
