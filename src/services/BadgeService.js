'use strict';

import { AlarmService } from './AlarmService.js';
import { StorageService } from './StorageService.js';

/**
 * Manages the extension's badge icon indicator.
 * Shows the count of active tab-reload timers on the extension badge.
 */
export class BadgeService {
    /** @type {string} Badge background color (Material green). */
    static BADGE_COLOR = '#4CAF50';

    /**
     * Updates the badge text to reflect the number of active reloader alarms.
     * Respects the user's `showBadge` option.
     */
    static async updateBadge() {
        try {
            const options = await StorageService.getOptions();

            if (!options.showBadge) {
                await chrome.action.setBadgeText({ text: '' });
                return;
            }

            const alarms = await AlarmService.getAllReloaderAlarms();
            const count = alarms.length;

            await chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
            await chrome.action.setBadgeBackgroundColor({ color: BadgeService.BADGE_COLOR });
        } catch (error) {
            console.error('Failed to update badge:', error);
        }
    }
}
