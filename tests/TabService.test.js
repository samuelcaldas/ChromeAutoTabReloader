import { describe, it, expect, beforeEach } from 'vitest';
import { resetAllMocks } from './setup.js';
import { TabService } from '../src/services/TabService.js';

describe('TabService', () => {
    beforeEach(() => {
        resetAllMocks();
    });

    describe('getActiveTab', () => {
        it('returns the first active tab', async () => {
            chrome.tabs.query.mockResolvedValue([
                { id: 1, url: 'https://example.com', title: 'Example' },
            ]);

            const tab = await TabService.getActiveTab();

            expect(tab).toEqual({ id: 1, url: 'https://example.com', title: 'Example' });
        });

        it('returns null when no tabs are found', async () => {
            chrome.tabs.query.mockResolvedValue([]);

            const tab = await TabService.getActiveTab();

            expect(tab).toBeNull();
        });
    });

    describe('reloadTab', () => {
        it('reloads tab with cache bypass by default', async () => {
            await TabService.reloadTab(42);

            expect(chrome.tabs.reload).toHaveBeenCalledWith(42, { bypassCache: true });
        });

        it('reloads tab without cache bypass when specified', async () => {
            await TabService.reloadTab(42, false);

            expect(chrome.tabs.reload).toHaveBeenCalledWith(42, { bypassCache: false });
        });
    });

    describe('getAllOpenTabIds', () => {
        it('returns a Set of all open tab IDs', async () => {
            chrome.tabs.query.mockResolvedValue([
                { id: 1 },
                { id: 5 },
                { id: 42 },
            ]);

            const ids = await TabService.getAllOpenTabIds();

            expect(ids).toBeInstanceOf(Set);
            expect(ids.has(1)).toBe(true);
            expect(ids.has(5)).toBe(true);
            expect(ids.has(42)).toBe(true);
            expect(ids.size).toBe(3);
        });

        it('returns empty Set when no tabs are open', async () => {
            chrome.tabs.query.mockResolvedValue([]);

            const ids = await TabService.getAllOpenTabIds();

            expect(ids.size).toBe(0);
        });
    });

    describe('getTabInfo', () => {
        it('returns title and url for existing tab', async () => {
            chrome.tabs.get.mockResolvedValue({
                id: 42,
                title: 'My Page',
                url: 'https://example.com',
            });

            const info = await TabService.getTabInfo(42);

            expect(info).toEqual({ title: 'My Page', url: 'https://example.com' });
        });

        it('returns null for non-existent tab', async () => {
            chrome.tabs.get.mockRejectedValue(new Error('No tab'));

            const info = await TabService.getTabInfo(999);

            expect(info).toBeNull();
        });

        it('falls back to "Tab N" when title is empty', async () => {
            chrome.tabs.get.mockResolvedValue({ id: 42, title: '', url: '' });

            const info = await TabService.getTabInfo(42);

            expect(info.title).toBe('Tab 42');
        });
    });

    describe('isRestrictedUrl', () => {
        it('returns true for chrome:// URLs', () => {
            expect(TabService.isRestrictedUrl('chrome://extensions')).toBe(true);
            expect(TabService.isRestrictedUrl('chrome://settings')).toBe(true);
        });

        it('returns true for chrome-extension:// URLs', () => {
            expect(TabService.isRestrictedUrl('chrome-extension://abcdef/popup.html')).toBe(true);
        });

        it('returns true for file:// URLs', () => {
            expect(TabService.isRestrictedUrl('file:///home/user/doc.html')).toBe(true);
        });

        it('returns true for Chrome Web Store URLs', () => {
            expect(TabService.isRestrictedUrl('https://chrome.google.com/webstore/detail/abc')).toBe(true);
        });

        it('returns true for edge:// URLs', () => {
            expect(TabService.isRestrictedUrl('edge://settings')).toBe(true);
        });

        it('returns true for about: URLs', () => {
            expect(TabService.isRestrictedUrl('about:blank')).toBe(true);
        });

        it('returns false for regular HTTPS URLs', () => {
            expect(TabService.isRestrictedUrl('https://example.com')).toBe(false);
        });

        it('returns false for HTTP URLs', () => {
            expect(TabService.isRestrictedUrl('http://localhost:3000')).toBe(false);
        });

        it('returns true for null/undefined/empty URL', () => {
            expect(TabService.isRestrictedUrl(null)).toBe(true);
            expect(TabService.isRestrictedUrl(undefined)).toBe(true);
            expect(TabService.isRestrictedUrl('')).toBe(true);
        });
    });
});
