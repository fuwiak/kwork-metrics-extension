import type { Metrics } from "./types";
import { log } from "./logger";

chrome.runtime.onInstalled.addListener(async () => {
  // Set default interval to 1 minute if not set
  const result = await chrome.storage.local.get(['collectInterval']);
  const interval = result.collectInterval || 1; // Default 1 minute
  
  // Clear existing alarm and create new one
  chrome.alarms.clear("fetchMetrics");
  chrome.alarms.create("fetchMetrics", { periodInMinutes: interval });
  
  await log(`Auto-collect set to ${interval} minutes`);
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "fetchMetrics") {
    await log('Auto-collecting metrics...');
    
    const tab = await chrome.tabs.create({ 
      url: "https://kwork.ru/manage_kworks", 
      active: false 
    });

    // Wait for page to load and execute script
    setTimeout(async () => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        files: ["content.js"]
      });
      
      // Close tab after data collection
      setTimeout(() => {
        chrome.tabs.remove(tab.id!);
      }, 5000);
    }, 3000);
  }
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "METRICS") {
    chrome.storage.local.get({ metrics: [] }, (res) => {
      const data: Metrics[] = res.metrics;
      data.push(message.data);
      
      chrome.storage.local.set({ 
        metrics: data,
        lastUpdated: new Date().toISOString()
      });
      
      log('Metrics saved: ' + JSON.stringify(message.data));
    });
  }
  
  if (message.type === "UPDATE_INTERVAL") {
    // Update alarm interval
    const newInterval = message.interval;
    chrome.alarms.clear("fetchMetrics");
    chrome.alarms.create("fetchMetrics", { periodInMinutes: newInterval });
    log(`Interval updated to ${newInterval} minutes`);
  }
});
