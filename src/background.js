'use strict';

import { AlarmService } from './services/AlarmService.js';
import { StorageService } from './services/StorageService.js';
import { TabService } from './services/TabService.js';
import { BadgeService } from './services/BadgeService.js';

// --- Message Handlers (Command Pattern) ---

/**
 * Handles the 'setTimer' action. Sets or clears a tab's reload interval.
 * @param {object} request - The message request with tabId and interval.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function handleSetTimer(request) {
    const { tabId, interval } = request;

    if (!tabId || typeof interval === 'undefined') {
        return { success: false, error: 'Missing tabId or interval' };
    }

    await StorageService.saveInterval(tabId, interval);
    await AlarmService.schedule(tabId, interval);
    await BadgeService.updateBadge();

    const action = interval > 0 ? 'set' : 'cleared';
    console.log(`Timer ${action} for tab ${tabId} (${interval} min).`);

    return { success: true };
}

/**
 * Handles the 'getTimer' action. Retrieves a tab's current interval.
 * @param {object} request - The message request with tabId.
 * @returns {Promise<{success: boolean, interval?: number, error?: string}>}
 */
async function handleGetTimer(request) {
    const { tabId } = request;

    if (!tabId) {
        return { success: false, error: 'Missing tabId' };
    }

    const interval = await StorageService.getInterval(tabId);
    return { success: true, interval };
}

/**
 * Handles the 'getAllTimers' action. Returns all active timer entries with tab info.
 * @returns {Promise<{success: boolean, timers: Array}>}
 */
async function handleGetAllTimers() {
    const intervals = await StorageService.getAllIntervals();
    const openTabIds = await TabService.getAllOpenTabIds();

    const timers = [];
    for (const { tabId, interval } of intervals) {
        if (!openTabIds.has(tabId)) continue;
        const tabInfo = await TabService.getTabInfo(tabId);
        timers.push({
            tabId,
            interval,
            title: tabInfo?.title || `Tab ${tabId}`,
            url: tabInfo?.url || '',
        });
    }

    return { success: true, timers };
}

/**
 * Handles the 'exportSettings' action. Exports all extension data.
 * @returns {Promise<{success: boolean, data: object}>}
 */
async function handleExportSettings() {
    const data = await StorageService.exportAll();
    return { success: true, data };
}

/**
 * Handles the 'importSettings' action. Imports extension data and restores alarms.
 * @param {object} request - The message request with data.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function handleImportSettings(request) {
    const { data } = request;

    if (!data || typeof data !== 'object') {
        return { success: false, error: 'Invalid import data' };
    }

    await AlarmService.clearAll();
    await StorageService.importAll(data);
    await restoreAlarmsFromStorage();
    await BadgeService.updateBadge();

    console.log('Settings imported and alarms restored.');
    return { success: true };
}

/**
 * Handles the 'getOptions' action. Returns user options.
 * @returns {Promise<{success: boolean, options: object}>}
 */
async function handleGetOptions() {
    const options = await StorageService.getOptions();
    return { success: true, options };
}

/**
 * Handles the 'saveOptions' action. Saves user options.
 * @param {object} request - The message request with options.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function handleSaveOptions(request) {
    const { options } = request;

    if (!options || typeof options !== 'object') {
        return { success: false, error: 'Invalid options data' };
    }

    await StorageService.saveOptions(options);
    await BadgeService.updateBadge();

    console.log('Options saved:', options);
    return { success: true };
}

/**
 * Handler map: maps action names to handler functions.
 * Adding a new action only requires a new entry here (Open/Closed Principle).
 * @type {Record<string, (request: object) => Promise<object>>}
 */
const messageHandlers = {
    setTimer: handleSetTimer,
    getTimer: handleGetTimer,
    getAllTimers: handleGetAllTimers,
    exportSettings: handleExportSettings,
    importSettings: handleImportSettings,
    getOptions: handleGetOptions,
    saveOptions: handleSaveOptions,
};

// --- Alarm Restore ---

/**
 * Restores alarms from storage for tabs that are still open.
 * Cleans up orphaned storage entries for tabs that no longer exist.
 */
async function restoreAlarmsFromStorage() {
    try {
        const intervals = await StorageService.getAllIntervals();
        const openTabIds = await TabService.getAllOpenTabIds();

        for (const { tabId, interval } of intervals) {
            if (openTabIds.has(tabId) && interval > 0) {
                await AlarmService.schedule(tabId, interval);
                console.log(`Restored alarm for tab ${tabId} (${interval} min).`);
            } else {
                await StorageService.removeInterval(tabId);
                console.log(`Cleaned orphaned entry for tab ${tabId}.`);
            }
        }
    } catch (error) {
        console.error('Error restoring alarms from storage:', error);
    }
}

// --- Event Listeners ---

/**
 * Handles alarm events. Reloads the corresponding tab.
 * If the tab no longer exists, clears the alarm and storage entry (SRP: cleanup at caller level).
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
    const tabId = AlarmService.parseTabId(alarm.name);
    if (tabId === null) return;

    try {
        const options = await StorageService.getOptions();
        await TabService.reloadTab(tabId, options.bypassCache);
        console.log(`Tab ${tabId} reloaded successfully.`);
    } catch (error) {
        console.error(`Failed to reload tab ${tabId}, clearing alarm:`, error);
        await AlarmService.clear(tabId);
        await StorageService.removeInterval(tabId);
        await BadgeService.updateBadge();
    }
});

/**
 * Routes messages from the popup/options to the appropriate handler.
 * Uses the handler map pattern for extensibility.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const handler = messageHandlers[request.action];

    if (!handler) {
        console.warn(`Unknown message action: ${request.action}`);
        return false;
    }

    handler(request)
        .then(sendResponse)
        .catch(error => {
            console.error(`Error handling '${request.action}':`, error);
            sendResponse({ success: false, error: error.message });
        });

    return true; // Indicates asynchronous response
});

/**
 * Cleans up alarms and storage when a tab is removed.
 */
chrome.tabs.onRemoved.addListener(async (tabId) => {
    console.log(`Tab ${tabId} removed. Clearing associated alarm and settings.`);
    await AlarmService.clear(tabId);
    await StorageService.removeInterval(tabId);
    await BadgeService.updateBadge();
});

/**
 * Restores alarms from persistent storage on browser startup.
 * Cross-references with currently open tabs and prunes orphans.
 */
chrome.runtime.onStartup.addListener(async () => {
    console.log('Browser startup detected. Restoring alarms from storage...');
    await restoreAlarmsFromStorage();
    await BadgeService.updateBadge();
});

/**
 * Handles extension install/update events.
 * Restores alarms on update and initializes defaults on fresh install.
 */
chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        console.log('Extension installed. Initializing default options.');
        await StorageService.saveOptions({});
    } else if (details.reason === 'update') {
        console.log('Extension updated. Restoring alarms...');
        await restoreAlarmsFromStorage();
    }
    await BadgeService.updateBadge();
});

console.log('Auto Tab Reloader service worker started (v2.0 — modular).');