// src/background.js
'use strict';

// --- Constants ---
const ALARM_NAME_PREFIX = 'tab-reloader-alarm-';

// --- Helper Functions ---

/**
 * Creates a unique alarm name for a given tab ID.
 * @param {number} tabId - The ID of the tab.
 * @returns {string} The unique alarm name.
 */
function getAlarmName(tabId) {
    return `${ALARM_NAME_PREFIX}${tabId}`;
}

/**
 * Reloads the specified tab.
 * @param {number} tabId - The ID of the tab to reload.
 */
async function reloadTab(tabId) {
    try {
        await chrome.tabs.reload(tabId, { bypassCache: true });
        console.log(`Tab ${tabId} reloaded successfully.`);
    } catch (error) {
        console.error(`Failed to reload tab ${tabId}:`, error);
        // If tab doesn't exist, maybe clear its alarm?
        await clearTabAlarm(tabId);
    }
}

/**
 * Sets or updates the reload interval for a specific tab.
 * @param {number} tabId - The ID of the tab.
 * @param {number} intervalMinutes - The reload interval in minutes.
 */
async function setTabInterval(tabId, intervalMinutes) {
    const alarmName = getAlarmName(tabId);
    const intervalData = { interval: intervalMinutes };

    try {
        // Save interval to storage, associated with the tab ID
        await chrome.storage.local.set({ [alarmName]: intervalData });

        // Clear any existing alarm for this tab before creating a new one
        await chrome.alarms.clear(alarmName);

        if (intervalMinutes > 0) {
            // Create a new periodic alarm
            chrome.alarms.create(alarmName, {
                delayInMinutes: intervalMinutes,
                periodInMinutes: intervalMinutes
            });
            console.log(`Alarm set for tab ${tabId} with interval ${intervalMinutes} minutes.`);
        } else {
            console.log(`Reloading disabled for tab ${tabId}. Alarm cleared.`);
        }
    } catch (error) {
        console.error(`Error setting interval for tab ${tabId}:`, error);
    }
}

/**
 * Clears the reload alarm and stored interval for a specific tab.
 * @param {number} tabId - The ID of the tab.
 */
async function clearTabAlarm(tabId) {
    const alarmName = getAlarmName(tabId);
    try {
        await chrome.alarms.clear(alarmName);
        await chrome.storage.local.remove(alarmName);
        console.log(`Alarm and settings cleared for tab ${tabId}.`);
    } catch (error) {
        console.error(`Error clearing alarm for tab ${tabId}:`, error);
    }
}

// --- Event Listeners ---

/**
 * Handles the alarm event. Reloads the corresponding tab.
 * @param {chrome.alarms.Alarm} alarm - The alarm object that fired.
 */
chrome.alarms.onAlarm.addListener((alarm) => {
    console.log('Alarm triggered:', alarm.name);
    if (alarm.name.startsWith(ALARM_NAME_PREFIX)) {
        const tabIdString = alarm.name.substring(ALARM_NAME_PREFIX.length);
        const tabId = parseInt(tabIdString, 10);
        if (!isNaN(tabId)) {
            reloadTab(tabId);
        } else {
            console.error(`Could not parse tab ID from alarm name: ${alarm.name}`);
        }
    }
});

/**
 * Listens for messages from the popup script.
 * @param {object} request - The message request object.
 * @param {chrome.runtime.MessageSender} sender - Information about the sender.
 * @param {function} sendResponse - Function to call to send a response.
 * @returns {boolean} - True to indicate asynchronous response handling.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'setTimer') {
        if (request.tabId && typeof request.interval !== 'undefined') {
            setTabInterval(request.tabId, request.interval)
                .then(() => sendResponse({ success: true }))
                .catch(error => {
                    console.error("Error processing setTimer message:", error);
                    sendResponse({ success: false, error: error.message });
                });
            return true; // Indicates asynchronous response
        } else {
            console.error("Invalid 'setTimer' message:", request);
            sendResponse({ success: false, error: 'Missing tabId or interval' });
        }
    } else if (request.action === 'getTimer') {
        if (request.tabId) {
            const alarmName = getAlarmName(request.tabId);
            chrome.storage.local.get(alarmName)
                .then(result => {
                    const intervalData = result[alarmName];
                    sendResponse({ success: true, interval: intervalData ? intervalData.interval : 0 });
                })
                .catch(error => {
                    console.error("Error processing getTimer message:", error);
                    sendResponse({ success: false, error: error.message });
                });
            return true; // Indicates asynchronous response
        } else {
            console.error("Invalid 'getTimer' message:", request);
            sendResponse({ success: false, error: 'Missing tabId' });
        }
    }
    // Return false for synchronous messages or if no action matched
    return false;
});

/**
 * Cleans up alarms and storage when a tab is removed.
 * @param {number} tabId - The ID of the tab that was removed.
 * @param {object} removeInfo - Information about the removal.
 */
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    console.log(`Tab ${tabId} removed. Clearing associated alarm and settings.`);
    clearTabAlarm(tabId);
});

// Optional: Clear alarms on startup if they somehow persist incorrectly
chrome.runtime.onStartup.addListener(async () => {
    try {
        const alarms = await chrome.alarms.getAll();
        const reloadAlarms = alarms.filter(a => a.name.startsWith(ALARM_NAME_PREFIX));
        for (const alarm of reloadAlarms) {
            await chrome.alarms.clear(alarm.name);
            await chrome.storage.local.remove(alarm.name); // Also clear storage
        }
        console.log('Cleared any lingering tab reloader alarms on startup.');
    } catch (error) {
        console.error('Error clearing alarms on startup:', error);
    }
});

console.log('Auto Tab Reloader service worker started.');