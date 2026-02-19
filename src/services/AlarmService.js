'use strict';

import { ALARM_NAME_PREFIX } from '../shared/constants.js';

/**
 * Facade pattern wrapper for chrome.alarms API.
 * Encapsulates all alarm scheduling logic for tab reloading.
 */
export class AlarmService {
    /**
     * Generates the alarm name for a given tab ID.
     * @param {number} tabId - The tab ID.
     * @returns {string} The alarm name.
     */
    static getAlarmName(tabId) {
        return `${ALARM_NAME_PREFIX}${tabId}`;
    }

    /**
     * Extracts the tab ID from an alarm name.
     * @param {string} alarmName - The alarm name.
     * @returns {number|null} The tab ID, or null if parsing fails.
     */
    static parseTabId(alarmName) {
        if (!alarmName.startsWith(ALARM_NAME_PREFIX)) return null;
        const tabId = parseInt(alarmName.substring(ALARM_NAME_PREFIX.length), 10);
        return isNaN(tabId) ? null : tabId;
    }

    /**
     * Schedules a periodic alarm for a given tab.
     * Clears any existing alarm before creating a new one.
     * If intervalMinutes is 0, only clears the existing alarm.
     * @param {number} tabId - The tab ID.
     * @param {number} intervalMinutes - The interval in minutes.
     */
    static async schedule(tabId, intervalMinutes) {
        const alarmName = AlarmService.getAlarmName(tabId);
        await chrome.alarms.clear(alarmName);

        if (intervalMinutes > 0) {
            chrome.alarms.create(alarmName, {
                delayInMinutes: intervalMinutes,
                periodInMinutes: intervalMinutes,
            });
        }
    }

    /**
     * Clears the alarm for a specific tab.
     * @param {number} tabId - The tab ID.
     * @returns {Promise<boolean>} Whether the alarm was successfully cleared.
     */
    static async clear(tabId) {
        const alarmName = AlarmService.getAlarmName(tabId);
        return chrome.alarms.clear(alarmName);
    }

    /**
     * Retrieves all active tab-reloader alarms.
     * @returns {Promise<chrome.alarms.Alarm[]>} Filtered list of reloader alarms.
     */
    static async getAllReloaderAlarms() {
        const alarms = await chrome.alarms.getAll();
        return alarms.filter(a => a.name.startsWith(ALARM_NAME_PREFIX));
    }

    /**
     * Clears all tab-reloader alarms.
     * @returns {Promise<void>}
     */
    static async clearAll() {
        const alarms = await AlarmService.getAllReloaderAlarms();
        await Promise.all(alarms.map(a => chrome.alarms.clear(a.name)));
    }
}
