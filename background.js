chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id) return;

  try {
    // Ensure CSS is present for tooltip styling
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["content.css"]
    });

    // Inject the content script on demand
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
  } catch (e) {
    console.error("Injection failed:", e);
  }
});
