'use strict';

import { ALARM_NAME_PREFIX, OPTIONS_KEY, DEFAULT_OPTIONS } from '../shared/constants.js';

/**
 * Repository pattern wrapper for chrome.storage.local.
 * Encapsulates all persistence logic for tab intervals and user options.
 */
export class StorageService {
    /**
     * Generates the storage key for a given tab ID.
     * @param {number} tabId - The tab ID.
     * @returns {string} The storage key.
     */
    static getKey(tabId) {
        return `${ALARM_NAME_PREFIX}${tabId}`;
    }

    /**
     * Persists a tab's reload interval.
     * @param {number} tabId - The tab ID.
     * @param {number} intervalMinutes - The interval in minutes.
     */
    static async saveInterval(tabId, intervalMinutes) {
        const key = StorageService.getKey(tabId);
        await chrome.storage.local.set({ [key]: { interval: intervalMinutes } });
    }

    /**
     * Retrieves a tab's reload interval.
     * @param {number} tabId - The tab ID.
     * @returns {Promise<number>} The interval in minutes, or 0 if not set.
     */
    static async getInterval(tabId) {
        const key = StorageService.getKey(tabId);
        const result = await chrome.storage.local.get(key);
        return result[key]?.interval ?? 0;
    }

    /**
     * Removes a tab's stored interval.
     * @param {number} tabId - The tab ID.
     */
    static async removeInterval(tabId) {
        const key = StorageService.getKey(tabId);
        await chrome.storage.local.remove(key);
    }

    /**
     * Retrieves all stored tab intervals.
     * Filters storage entries to only return alarm-prefixed items.
     * @returns {Promise<Array<{tabId: number, interval: number}>>}
     */
    static async getAllIntervals() {
        const allData = await chrome.storage.local.get(null);
        const intervals = [];

        for (const [key, value] of Object.entries(allData)) {
            if (!key.startsWith(ALARM_NAME_PREFIX)) continue;
            const tabId = parseInt(key.substring(ALARM_NAME_PREFIX.length), 10);
            if (!isNaN(tabId) && value?.interval > 0) {
                intervals.push({ tabId, interval: value.interval });
            }
        }

        return intervals;
    }

    /**
     * Retrieves the user's options/preferences.
     * @returns {Promise<{defaultInterval: number, bypassCache: boolean, showBadge: boolean}>}
     */
    static async getOptions() {
        const result = await chrome.storage.local.get(OPTIONS_KEY);
        return { ...DEFAULT_OPTIONS, ...(result[OPTIONS_KEY] ?? {}) };
    }

    /**
     * Saves user options/preferences.
     * @param {Partial<{defaultInterval: number, bypassCache: boolean, showBadge: boolean}>} options
     */
    static async saveOptions(options) {
        const current = await StorageService.getOptions();
        const merged = { ...current, ...options };
        await chrome.storage.local.set({ [OPTIONS_KEY]: merged });
    }

    /**
     * Exports all extension data (intervals + options) as a serializable object.
     * @returns {Promise<object>}
     */
    static async exportAll() {
        const allData = await chrome.storage.local.get(null);
        return allData;
    }

    /**
     * Imports extension data, merging with or replacing existing data.
     * @param {object} data - The data object to import.
     */
    static async importAll(data) {
        await chrome.storage.local.clear();
        await chrome.storage.local.set(data);
    }
}
