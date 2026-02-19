// tests/BadgeService.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { resetAllMocks } from './setup.js';
import { BadgeService } from '../src/services/BadgeService.js';

describe('BadgeService', () => {
    beforeEach(() => {
        resetAllMocks();
    });

    describe('updateBadge', () => {
        it('sets badge text to alarm count when showBadge is true', async () => {
            // Set showBadge option
            await chrome.storage.local.set({
                'tab-reloader-options': { showBadge: true, defaultInterval: 5, bypassCache: true },
            });

            // Mock active alarms
            chrome.alarms.getAll.mockResolvedValue([
                { name: 'tab-reloader-alarm-1' },
                { name: 'tab-reloader-alarm-2' },
            ]);

            await BadgeService.updateBadge();

            expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '2' });
            expect(chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#4CAF50' });
        });

        it('clears badge text when no alarms are active', async () => {
            await chrome.storage.local.set({
                'tab-reloader-options': { showBadge: true, defaultInterval: 5, bypassCache: true },
            });
            chrome.alarms.getAll.mockResolvedValue([]);

            await BadgeService.updateBadge();

            expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
        });

        it('clears badge text when showBadge is false', async () => {
            await chrome.storage.local.set({
                'tab-reloader-options': { showBadge: false, defaultInterval: 5, bypassCache: true },
            });

            chrome.alarms.getAll.mockResolvedValue([
                { name: 'tab-reloader-alarm-1' },
            ]);

            await BadgeService.updateBadge();

            expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
            // Should NOT set badgeBackgroundColor since badge is hidden
            expect(chrome.action.setBadgeBackgroundColor).not.toHaveBeenCalled();
        });

        it('uses default options when none are saved', async () => {
            // No options saved — defaults have showBadge: true
            chrome.alarms.getAll.mockResolvedValue([
                { name: 'tab-reloader-alarm-1' },
            ]);

            await BadgeService.updateBadge();

            expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '1' });
        });

        it('ignores non-reloader alarms in count', async () => {
            await chrome.storage.local.set({
                'tab-reloader-options': { showBadge: true, defaultInterval: 5, bypassCache: true },
            });

            chrome.alarms.getAll.mockResolvedValue([
                { name: 'tab-reloader-alarm-1' },
                { name: 'other-extension-alarm' },
                { name: 'tab-reloader-alarm-2' },
            ]);

            await BadgeService.updateBadge();

            expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '2' });
        });
    });
});
