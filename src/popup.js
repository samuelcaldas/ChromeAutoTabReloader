// src/popup.js
'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const intervalInput = document.getElementById('interval');
    const setButton = document.getElementById('set');
    const clearButton = document.getElementById('clear');
    const statusDiv = document.getElementById('status');
    let currentTabId = null;

    /**
     * Displays a status message to the user.
     * @param {string} message - The message to display.
     * @param {boolean} isError - Optional. True if the message indicates an error.
     */
    function showStatus(message, isError = false) {
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.style.color = isError ? 'red' : 'green';
            // Clear status after a few seconds
            setTimeout(() => {
                if (statusDiv.textContent === message) { // Avoid clearing newer messages
                   statusDiv.textContent = '';
                }
            }, 3000);
        } else {
            console.log("Status:", message);
        }
    }

    /**
     * Fetches the current reload interval for the active tab from the background script.
     * @param {number} tabId - The ID of the current tab.
     */
    async function getCurrentInterval(tabId) {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'getTimer', tabId: tabId });
            if (response && response.success) {
                intervalInput.value = response.interval > 0 ? response.interval : '';
                if(response.interval > 0) {
                    showStatus(`Current interval: ${response.interval} minutes.`);
                } else {
                     showStatus("No active timer for this tab.");
                }
            } else {
                throw new Error(response?.error || 'Failed to get timer status');
            }
        } catch (error) {
            console.error('Error getting current interval:', error);
            showStatus(`Error: ${error.message}`, true);
             // Disable controls if communication fails
            intervalInput.disabled = true;
            setButton.disabled = true;
            clearButton.disabled = true;
        }
    }

    /**
     * Sets the reload interval for the active tab via the background script.
     * @param {number} tabId - The ID of the current tab.
     * @param {number} intervalMinutes - The interval in minutes (0 to disable).
     */
    async function setTimer(tabId, intervalMinutes) {
        try {
             // Basic validation
            if (isNaN(intervalMinutes) || intervalMinutes < 0) {
                showStatus('Please enter a valid positive number for minutes.', true);
                return;
            }

            const response = await chrome.runtime.sendMessage({
                action: 'setTimer',
                tabId: tabId,
                interval: intervalMinutes
            });

            if (response && response.success) {
                showStatus(intervalMinutes > 0
                    ? `Timer set to ${intervalMinutes} minutes.`
                    : 'Timer cleared successfully.');
            } else {
                 throw new Error(response?.error || 'Failed to set timer');
            }
        } catch (error) {
            console.error('Error setting timer:', error);
            showStatus(`Error: ${error.message}`, true);
        }
    }

    // --- Initialization ---

    // Get the current active tab when the popup opens
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs.length > 0) {
            currentTabId = tabs[0].id;
            if (currentTabId) {
                 // Check if the tab URL is restricted (e.g., chrome://, file://, chrome web store)
                const url = tabs[0].url;
                if (url && (url.startsWith('chrome://') || url.startsWith('file://') || url.startsWith('https://chrome.google.com/webstore'))) {
                    showStatus('Cannot set timer for this type of page.', true);
                    intervalInput.disabled = true;
                    setButton.disabled = true;
                    clearButton.disabled = true;
                } else {
                    getCurrentInterval(currentTabId); // Fetch the current setting
                }
            } else {
                 showStatus('Could not get current tab ID.', true);
            }
        } else {
            showStatus('Could not find active tab.', true);
        }
    });

    // --- Event Listeners ---

    setButton.addEventListener('click', () => {
        if (currentTabId !== null) {
            const interval = parseInt(intervalInput.value, 10);
             // Treat empty input or non-positive numbers as clearing the timer,
             // but prompt user if they entered non-numeric text.
            if (intervalInput.value.trim() === '' || isNaN(interval) || interval <= 0) {
                 if (isNaN(interval) && intervalInput.value.trim() !== '') {
                     showStatus('Please enter a valid positive number for minutes.', true);
                 } else {
                     setTimer(currentTabId, 0); // Clear timer if input is empty or <= 0
                 }
            } else {
                setTimer(currentTabId, interval);
            }
        } else {
            showStatus('Tab ID not available.', true);
        }
    });

     clearButton.addEventListener('click', () => {
        if (currentTabId !== null) {
            intervalInput.value = ''; // Clear input field
            setTimer(currentTabId, 0); // Send 0 to background to clear
        } else {
            showStatus('Tab ID not available.', true);
        }
    });
});