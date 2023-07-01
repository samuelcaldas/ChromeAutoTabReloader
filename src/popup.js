document.addEventListener('DOMContentLoaded', () => {
    const intervalInput = document.getElementById('interval');
    const saveButton = document.getElementById('save');
  
    // Retrieve the timer value for the current tab from Chrome storage
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs.length > 0) {
        const tabId = tabs[0].id;
        chrome.storage.sync.get(tabId.toString(), (items) => {
          const interval = items[tabId] || 0;
          intervalInput.value = interval;
        });
      }
    });
  
    saveButton.addEventListener('click', () => {
      const interval = parseInt(intervalInput.value, 10);
      chrome.runtime.sendMessage({
        type: 'setInterval',
        interval: interval
      });
      // Save the timer value for the current tab to Chrome storage
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs.length > 0) {
          const tabId = tabs[0].id;
          chrome.storage.sync.set({[tabId]: interval});
        }
      });
      window.close();
    });
  });
  