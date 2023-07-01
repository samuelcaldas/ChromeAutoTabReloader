document.addEventListener('DOMContentLoaded', () => {
    const intervalInput = document.getElementById('interval');
    const saveButton = document.getElementById('save');

    saveButton.addEventListener('click', () => {
        const interval = parseInt(intervalInput.value, 10);
        chrome.runtime.sendMessage({
            type: 'setInterval',
            interval: interval
        });
        window.close();
    });
});
