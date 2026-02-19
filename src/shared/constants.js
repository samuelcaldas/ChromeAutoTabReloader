'use strict';

/**
 * Prefix used for naming tab-reload alarms.
 * Format: `tab-reloader-alarm-{tabId}`
 * @type {string}
 */
export const ALARM_NAME_PREFIX = 'tab-reloader-alarm-';

/**
 * Storage key for user options/preferences.
 * @type {string}
 */
export const OPTIONS_KEY = 'tab-reloader-options';

/**
 * Default options for the extension.
 * @type {Readonly<{defaultInterval: number, bypassCache: boolean, showBadge: boolean}>}
 */
export const DEFAULT_OPTIONS = Object.freeze({
    defaultInterval: 5,
    bypassCache: true,
    showBadge: true,
});

/**
 * URL prefixes that are restricted from having timers set.
 * @type {ReadonlyArray<string>}
 */
export const RESTRICTED_URL_PREFIXES = Object.freeze([
    'chrome://',
    'chrome-extension://',
    'file://',
    'https://chrome.google.com/webstore',
    'edge://',
    'about:',
]);
