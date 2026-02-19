import { describe, it, expect, beforeEach } from 'vitest';
import { resetAllMocks } from './setup.js';
import { StorageService } from '../src/services/StorageService.js';

describe('StorageService', () => {
    beforeEach(() => {
        resetAllMocks();
    });

    describe('getKey', () => {
        it('returns prefixed key for a tabId', () => {
            expect(StorageService.getKey(42)).toBe('tab-reloader-alarm-42');
        });
    });

    describe('saveInterval', () => {
        it('stores interval data under the correct key', async () => {
            await StorageService.saveInterval(42, 5);

            expect(chrome.storage.local.set).toHaveBeenCalledWith({
                'tab-reloader-alarm-42': { interval: 5 },
            });
        });

        it('stores zero interval (disable)', async () => {
            await StorageService.saveInterval(42, 0);

            expect(chrome.storage.local.set).toHaveBeenCalledWith({
                'tab-reloader-alarm-42': { interval: 0 },
            });
        });
    });

    describe('getInterval', () => {
        it('returns saved interval value', async () => {
            await chrome.storage.local.set({ 'tab-reloader-alarm-42': { interval: 10 } });

            const interval = await StorageService.getInterval(42);

            expect(interval).toBe(10);
        });

        it('returns 0 when key does not exist', async () => {
            const interval = await StorageService.getInterval(999);

            expect(interval).toBe(0);
        });
    });

    describe('removeInterval', () => {
        it('removes the storage entry for a tabId', async () => {
            await StorageService.removeInterval(42);

            expect(chrome.storage.local.remove).toHaveBeenCalledWith('tab-reloader-alarm-42');
        });
    });

    describe('getAllIntervals', () => {
        it('returns only tab-reloader entries with valid intervals', async () => {
            await chrome.storage.local.set({
                'tab-reloader-alarm-1': { interval: 5 },
                'tab-reloader-alarm-2': { interval: 10 },
                'tab-reloader-options': { defaultInterval: 5 },
                'some-other-key': { data: 'hello' },
            });

            const intervals = await StorageService.getAllIntervals();

            expect(intervals).toHaveLength(2);
            expect(intervals).toContainEqual({ tabId: 1, interval: 5 });
            expect(intervals).toContainEqual({ tabId: 2, interval: 10 });
        });

        it('skips entries with zero or missing intervals', async () => {
            await chrome.storage.local.set({
                'tab-reloader-alarm-1': { interval: 0 },
                'tab-reloader-alarm-2': {},
                'tab-reloader-alarm-3': { interval: 5 },
            });

            const intervals = await StorageService.getAllIntervals();

            expect(intervals).toHaveLength(1);
            expect(intervals[0]).toEqual({ tabId: 3, interval: 5 });
        });

        it('returns empty array when no entries exist', async () => {
            const intervals = await StorageService.getAllIntervals();

            expect(intervals).toHaveLength(0);
        });
    });

    describe('getOptions', () => {
        it('returns default options when none are saved', async () => {
            const options = await StorageService.getOptions();

            expect(options).toEqual({
                defaultInterval: 5,
                bypassCache: true,
                showBadge: true,
            });
        });

        it('merges saved options with defaults', async () => {
            await chrome.storage.local.set({
                'tab-reloader-options': { defaultInterval: 10, showBadge: false },
            });

            const options = await StorageService.getOptions();

            expect(options).toEqual({
                defaultInterval: 10,
                bypassCache: true,
                showBadge: false,
            });
        });
    });

    describe('saveOptions', () => {
        it('merges new options with existing ones', async () => {
            await StorageService.saveOptions({ defaultInterval: 15 });

            const stored = chrome.storage.local._getStore();
            expect(stored['tab-reloader-options']).toEqual({
                defaultInterval: 15,
                bypassCache: true,
                showBadge: true,
            });
        });
    });

    describe('exportAll / importAll', () => {
        it('exports all stored data', async () => {
            await chrome.storage.local.set({
                'tab-reloader-alarm-1': { interval: 5 },
                'tab-reloader-options': { showBadge: false },
            });

            const data = await StorageService.exportAll();

            expect(data).toEqual({
                'tab-reloader-alarm-1': { interval: 5 },
                'tab-reloader-options': { showBadge: false },
            });
        });

        it('importAll clears and replaces all data', async () => {
            await chrome.storage.local.set({ 'old-key': 'old-value' });

            await StorageService.importAll({
                'tab-reloader-alarm-99': { interval: 3 },
            });

            expect(chrome.storage.local.clear).toHaveBeenCalled();
            const stored = chrome.storage.local._getStore();
            expect(stored['tab-reloader-alarm-99']).toEqual({ interval: 3 });
            expect(stored['old-key']).toBeUndefined();
        });
    });
});
