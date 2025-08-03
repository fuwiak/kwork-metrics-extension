import { log } from "./logger";

function getMetrics() {
  // More robust selectors for Kwork dashboard
  let views = "0";
  let sales = "0"; 
  let earned = "0";
  let competition = "N/A";

  // Try multiple possible selectors for views (просмотры)
  const viewsElement = 
    document.querySelector('.stat-card:nth-child(1) .stat-number') ||
    document.querySelector('[data-metric="views"] .value') ||
    document.querySelector('.views-count') ||
    document.querySelector('.metric-views .number') ||
    document.querySelector('*[title*="Просмотры"], *[title*="просмотры"]') ||
    Array.from(document.querySelectorAll('*')).find(el => 
      el.textContent?.includes('Просмотры') || el.textContent?.includes('просмотры')
    )?.closest('.stat-card, .metric-card')?.querySelector('.stat-number, .number, .value');
  
  if (viewsElement) {
    views = viewsElement.textContent?.replace(/[^\d]/g, '') || "0";
  }

  // Try multiple possible selectors for sales (продажи)
  const salesElement = 
    document.querySelector('.stat-card:nth-child(2) .stat-number') ||
    document.querySelector('[data-metric="sales"] .value') ||
    document.querySelector('.sales-count') ||
    document.querySelector('.metric-sales .number') ||
    Array.from(document.querySelectorAll('*')).find(el => 
      el.textContent?.includes('Продажи') || el.textContent?.includes('продажи')
    )?.closest('.stat-card, .metric-card')?.querySelector('.stat-number, .number, .value');
  
  if (salesElement) {
    sales = salesElement.textContent?.replace(/[^\d]/g, '') || "0";
  }

  // Try multiple possible selectors for earned amount (заработано)
  const earnedElement = 
    document.querySelector('.stat-card:nth-child(3) .stat-number') ||
    document.querySelector('[data-metric="earned"] .value') ||
    document.querySelector('.earned-amount') ||
    document.querySelector('.metric-earned .number') ||
    Array.from(document.querySelectorAll('*')).find(el => 
      el.textContent?.includes('Заработано') || el.textContent?.includes('заработано')
    )?.closest('.stat-card, .metric-card')?.querySelector('.stat-number, .number, .value');
  
  if (earnedElement) {
    earned = earnedElement.textContent?.replace(/[^\d]/g, '') || "0";
  }

  // Try multiple possible selectors for competition (конкуренция)
  const competitionElement = 
    document.querySelector('.stat-card:nth-child(4) .stat-number') ||
    document.querySelector('[data-metric="competition"] .value') ||
    document.querySelector('.competition-level') ||
    document.querySelector('.metric-competition .level') ||
    Array.from(document.querySelectorAll('*')).find(el => 
      el.textContent?.includes('Конкуренция') || el.textContent?.includes('конкуренция')
    )?.closest('.stat-card, .metric-card')?.querySelector('.stat-number, .level, .value');
  
  if (competitionElement) {
    competition = competitionElement.textContent?.trim() || "N/A";
  }

  log('Extracted metrics: ' + JSON.stringify({ views, sales, earned, competition }));

  return {
    date: new Date().toISOString(),
    views: Number(views),
    sales: Number(sales),
    earned: Number(earned),
    competition
  };
}

// Wait for page to be fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      chrome.runtime.sendMessage({ type: "METRICS", data: getMetrics() });
    }, 2000); // Wait 2 seconds for dynamic content to load
  });
} else {
  setTimeout(() => {
    chrome.runtime.sendMessage({ type: "METRICS", data: getMetrics() });
  }, 2000);
}
