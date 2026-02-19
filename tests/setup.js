// Chrome Extension API mock for Vitest

/**
 * Creates a mock of the chrome.storage.local API.
 * Uses an in-memory Map as the backing store.
 * @returns {object} Mocked chrome.storage.local API.
 */
function createStorageMock() {
    let store = {};

    return {
        get: vi.fn(async (keys) => {
            if (keys === null) return { ...store };
            if (typeof keys === 'string') {
                return keys in store ? { [keys]: store[keys] } : {};
            }
            if (Array.isArray(keys)) {
                const result = {};
                for (const key of keys) {
                    if (key in store) result[key] = store[key];
                }
                return result;
            }
            return {};
        }),
        set: vi.fn(async (items) => {
            Object.assign(store, items);
        }),
        remove: vi.fn(async (keys) => {
            const keyArr = Array.isArray(keys) ? keys : [keys];
            for (const key of keyArr) {
                delete store[key];
            }
        }),
        clear: vi.fn(async () => {
            store = {};
        }),
        /** Helper: reset mock store for tests */
        _reset: () => { store = {}; },
        /** Helper: get raw store for assertions */
        _getStore: () => ({ ...store }),
    };
}

/**
 * Creates a mock of the chrome.alarms API.
 * @returns {object} Mocked chrome.alarms API.
 */
function createAlarmsMock() {
    let alarms = [];
    const listeners = [];

    return {
        create: vi.fn((name, alarmInfo) => {
            alarms = alarms.filter(a => a.name !== name);
            alarms.push({ name, ...alarmInfo });
        }),
        clear: vi.fn(async (name) => {
            const existed = alarms.some(a => a.name === name);
            alarms = alarms.filter(a => a.name !== name);
            return existed;
        }),
        getAll: vi.fn(async () => [...alarms]),
        onAlarm: {
            addListener: vi.fn((callback) => listeners.push(callback)),
        },
        /** Helper: fire an alarm for testing */
        _fire: async (name) => {
            for (const listener of listeners) {
                await listener({ name });
            }
        },
        /** Helper: reset mock */
        _reset: () => { alarms = []; },
    };
}

/**
 * Creates a mock of the chrome.tabs API.
 * @returns {object} Mocked chrome.tabs API.
 */
function createTabsMock() {
    let tabs = [];
    const listeners = [];

    return {
        query: vi.fn(async () => [...tabs]),
        reload: vi.fn(async () => { }),
        get: vi.fn(async (tabId) => {
            const tab = tabs.find(t => t.id === tabId);
            if (!tab) throw new Error(`No tab with id: ${tabId}`);
            return tab;
        }),
        onRemoved: {
            addListener: vi.fn((callback) => listeners.push(callback)),
        },
        /** Helper: set tabs for testing */
        _setTabs: (newTabs) => { tabs = newTabs; },
        /** Helper: reset */
        _reset: () => { tabs = []; },
    };
}

/**
 * Creates a mock of the chrome.action API.
 * @returns {object} Mocked chrome.action API.
 */
function createActionMock() {
    return {
        setBadgeText: vi.fn(async () => { }),
        setBadgeBackgroundColor: vi.fn(async () => { }),
    };
}

/**
 * Creates a mock of the chrome.runtime API.
 * @returns {object} Mocked chrome.runtime API.
 */
function createRuntimeMock() {
    return {
        sendMessage: vi.fn(async () => ({})),
        onMessage: {
            addListener: vi.fn(),
        },
        onStartup: {
            addListener: vi.fn(),
        },
        onInstalled: {
            addListener: vi.fn(),
        },
        openOptionsPage: vi.fn(),
    };
}

/**
 * Creates a mock of the chrome.i18n API.
 * @returns {object} Mocked chrome.i18n API.
 */
function createI18nMock() {
    return {
        getMessage: vi.fn((key) => key),
    };
}

// --- Global Setup ---
globalThis.chrome = {
    storage: { local: createStorageMock() },
    alarms: createAlarmsMock(),
    tabs: createTabsMock(),
    action: createActionMock(),
    runtime: createRuntimeMock(),
    i18n: createI18nMock(),
};

/**
 * Resets all Chrome API mocks between tests.
 * Call in beforeEach().
 */
export function resetAllMocks() {
    chrome.storage.local._reset();
    chrome.alarms._reset();
    chrome.tabs._reset();

    vi.clearAllMocks();
}
