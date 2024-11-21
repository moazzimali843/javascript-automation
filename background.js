let retryInterval;
let acknowledged = false;

// Function to start retry-based automation process
function startAutomationRetry(tabId) {
  retryInterval = setInterval(() => {
    if (!acknowledged) {
      console.log("Sending start_automation message...");
      chrome.tabs.sendMessage(tabId, { action: "start_automation" });
    } else {
      clearInterval(retryInterval);
      console.log("Acknowledgment received, stopping retries.");
    }
  }, 5000); // Retry every 5 seconds
}
// Listen for the message to start the entire process
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "open_tab") {
    acknowledged = false; // Reset acknowledgment
    // Open the job link in a new tab

    chrome.tabs.create({ url: request.data.jobLinks[0] }, async (tab) => {
      const tabId = tab.id;
      await chrome.storage.local.set({ 'jobLinks': request.data.jobLinks,'currentIndex':1 });
      // Inject content.js into the new tab
      chrome.scripting.executeScript(
        {
          target: { tabId: tabId },
          files: ["content_old.js"],
        },
        () => {
          console.log("content.js injected, starting retry automation...");
          startAutomationRetry(tabId); 
        }
      );
      chrome.tabs.sendMessage(tabId, { 
        action: 'update_data', 
        jobLinks: jobLinks, 
        currentIndex: 0 
    }, (response) => {
        console.log('Response from content script:', response);
    });
    });
  }

  // Stop retrying if content.js sends back an acknowledgment
  if (request.action === "stop_retry") {
    acknowledged = true;
    clearInterval(retryInterval);
    console.log("Automation acknowledged, stopping retry.");
  }
});

async function openAndAutomateTab(jobLink) {
  return new Promise((resolve, reject) => {
    chrome.tabs.create({ url: jobLink }, (tab) => {
      if (!tab) {
        reject(new Error("Failed to open tab"));
        return;
      }

      const tabId = tab.id;

      // Inject content.js into the new tab
      chrome.scripting.executeScript(
        {
          target: { tabId: tabId },
          files: ["content_old.js"],
        },
        () => {
          console.log(
            `Content script injected for tab with jobLink: ${jobLink}`
          );
          startAutomationRetry(tabId);

          // Wait for acknowledgment or timeout
          const timeout = setTimeout(() => {
            clearInterval(retryInterval);
            reject(new Error(`Timeout for tab with jobLink: ${jobLink}`));
          }, 30000); // 30 seconds timeout

          const listener = (ackRequest) => {
            if (ackRequest.action === "stop_retry") {
              acknowledged = true;
              clearInterval(retryInterval);
              clearTimeout(timeout);
              chrome.runtime.onMessage.removeListener(listener);
              console.log(
                `Automation completed for tab with jobLink: ${jobLink}`
              );
              resolve();
            }
          };

          chrome.runtime.onMessage.addListener(listener);
        }
      );
    });
  });
}
