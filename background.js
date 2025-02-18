// Create context menu item when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "generateImage",
    title: "Generate image",
    contexts: ["selection"]
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "generateImage") {
    const selectedText = info.selectionText;
    const prompt = `Generate an image for: ${selectedText}`;
    
    // Open Copilot in a new tab
    chrome.tabs.create({
      url: "https://copilot.microsoft.com/",
      active: true
    }, (newTab) => {
      // Wait for the page to load and then inject the script
      setTimeout(() => {
        chrome.scripting.executeScript({
          target: { tabId: newTab.id },
          function: injectPrompt,
          args: [prompt]
        });
      }, 3000); // Wait for 3 seconds to ensure page loads
    });
  }
});

// Function to be injected
function injectPrompt(prompt) {
  function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkElement = () => {
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
          return;
        }
        
        if (Date.now() - startTime >= timeout) {
          reject(new Error('Timeout waiting for element'));
          return;
        }
        
        requestAnimationFrame(checkElement);
      };
      
      checkElement();
    });
  }

  // Try to find and fill the input field using the exact selector
  waitForElement('textarea#userInput')
    .then(textarea => {
      textarea.value = prompt;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Trigger a keypress event to simulate pressing Enter
      const enterEvent = new KeyboardEvent('keypress', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true
      });
      textarea.dispatchEvent(enterEvent);
    })
    .catch(error => console.error('Failed to find input field:', error));
}