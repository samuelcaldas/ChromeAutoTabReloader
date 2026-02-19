import { describe, it, expect, beforeEach } from 'vitest';
import { resetAllMocks } from './setup.js';
import { AlarmService } from '../src/services/AlarmService.js';

describe('AlarmService', () => {
    beforeEach(() => {
        resetAllMocks();
    });

    describe('getAlarmName', () => {
        it('returns prefixed alarm name for a given tabId', () => {
            expect(AlarmService.getAlarmName(42)).toBe('tab-reloader-alarm-42');
        });

        it('handles large tab IDs', () => {
            expect(AlarmService.getAlarmName(999999)).toBe('tab-reloader-alarm-999999');
        });
    });

    describe('parseTabId', () => {
        it('parses tabId from valid alarm name', () => {
            expect(AlarmService.parseTabId('tab-reloader-alarm-42')).toBe(42);
        });

        it('returns null for non-reloader alarm names', () => {
            expect(AlarmService.parseTabId('some-other-alarm')).toBeNull();
        });

        it('returns null for invalid numeric suffix', () => {
            expect(AlarmService.parseTabId('tab-reloader-alarm-abc')).toBeNull();
        });

        it('returns null for empty suffix', () => {
            expect(AlarmService.parseTabId('tab-reloader-alarm-')).toBeNull();
        });
    });

    describe('schedule', () => {
        it('clears existing alarm and creates a new one for positive interval', async () => {
            await AlarmService.schedule(42, 5);

            expect(chrome.alarms.clear).toHaveBeenCalledWith('tab-reloader-alarm-42');
            expect(chrome.alarms.create).toHaveBeenCalledWith('tab-reloader-alarm-42', {
                delayInMinutes: 5,
                periodInMinutes: 5,
            });
        });

        it('only clears alarm when interval is 0 (disable)', async () => {
            await AlarmService.schedule(42, 0);

            expect(chrome.alarms.clear).toHaveBeenCalledWith('tab-reloader-alarm-42');
            expect(chrome.alarms.create).not.toHaveBeenCalled();
        });

        it('only clears alarm when interval is negative', async () => {
            await AlarmService.schedule(42, -1);

            expect(chrome.alarms.clear).toHaveBeenCalledWith('tab-reloader-alarm-42');
            expect(chrome.alarms.create).not.toHaveBeenCalled();
        });
    });

    describe('clear', () => {
        it('clears alarm for specified tabId', async () => {
            await AlarmService.clear(42);

            expect(chrome.alarms.clear).toHaveBeenCalledWith('tab-reloader-alarm-42');
        });
    });

    describe('getAllReloaderAlarms', () => {
        it('filters to only reloader alarms', async () => {
            chrome.alarms.getAll.mockResolvedValue([
                { name: 'tab-reloader-alarm-1' },
                { name: 'some-other-alarm' },
                { name: 'tab-reloader-alarm-2' },
            ]);

            const result = await AlarmService.getAllReloaderAlarms();

            expect(result).toHaveLength(2);
            expect(result[0].name).toBe('tab-reloader-alarm-1');
            expect(result[1].name).toBe('tab-reloader-alarm-2');
        });

        it('returns empty array when no reloader alarms exist', async () => {
            chrome.alarms.getAll.mockResolvedValue([
                { name: 'unrelated-alarm' },
            ]);

            const result = await AlarmService.getAllReloaderAlarms();

            expect(result).toHaveLength(0);
        });
    });

    describe('clearAll', () => {
        it('clears all reloader alarms', async () => {
            chrome.alarms.getAll.mockResolvedValue([
                { name: 'tab-reloader-alarm-1' },
                { name: 'tab-reloader-alarm-2' },
                { name: 'other-alarm' },
            ]);

            await AlarmService.clearAll();

            expect(chrome.alarms.clear).toHaveBeenCalledWith('tab-reloader-alarm-1');
            expect(chrome.alarms.clear).toHaveBeenCalledWith('tab-reloader-alarm-2');
            expect(chrome.alarms.clear).not.toHaveBeenCalledWith('other-alarm');
        });
    });
});
