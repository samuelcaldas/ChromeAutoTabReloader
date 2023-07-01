class TabManager {
    constructor() {
      this.tabs = {};
    }
  
    setTimer(tabId, interval) {
      this.clearTimer(tabId);
      if (interval > 0) {
        this.tabs[tabId] = setInterval(() => {
          chrome.tabs.reload(tabId);
        }, interval * 60 * 1000);
      }
    }
  
    clearTimer(tabId) {
      if (this.tabs[tabId]) {
        clearInterval(this.tabs[tabId]);
        delete this.tabs[tabId];
      }
    }
  }
  
  const tabManager = new TabManager();
  
  chrome.runtime.onMessage.addListener((msg, sender) => {
    if (msg.type === 'setInterval') {
      // Check if the sender.tab object is defined before trying to access its id property
      if (sender.tab) {
        tabManager.setTimer(sender.tab.id, msg.interval);
      }
    }
  });
  