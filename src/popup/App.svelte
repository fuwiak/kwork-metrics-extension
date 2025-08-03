<script lang="ts">
  import { onMount } from "svelte";
  import Chart from "./Chart.svelte";
  import { downloadLogs } from "../logger";

  interface Metrics {
    date: string;
    views: number;
    sales: number;
    earned: number;
    competition: string;
  }

  let metrics: Metrics[] = [];
  let isCollecting = false;
  let lastUpdated = "";
  let activeTab: 'table' | 'chart' | 'settings' = 'table';
  let collectInterval = 1; // Default 1 minute
  let isUpdatingInterval = false;

  onMount(async () => {
    // Chrome extension APIs are unavailable when the popup is
    // opened outside of the extension context (for example during
    // development or unit tests). Guard all usages so the component
    // doesn't throw runtime errors like "chrome is not defined".
    if (typeof chrome === "undefined") {
      console.warn("Chrome APIs are not available.");
      return;
    }

    await loadMetrics();
    await loadSettings();
  });

  async function loadMetrics() {
    if (!chrome?.storage?.local) return;

    const res = await chrome.storage.local.get(["metrics", "lastUpdated"]);
    metrics = res.metrics || [];
    lastUpdated = res.lastUpdated || "";
  }

  async function loadSettings() {
    if (!chrome?.storage?.local) return;

    const res = await chrome.storage.local.get(['collectInterval']);
    collectInterval = res.collectInterval || 1;
  }

  async function collectDataNow() {
    if (!chrome?.tabs || !chrome?.scripting) {
      console.warn("Chrome APIs are not available.");
      return;
    }

    isCollecting = true;
    
    try {
      // Get current active tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];
      
      // Check if we're on Kwork page
      if (!currentTab.url?.includes('kwork.ru')) {
        // Open Kwork page in new tab
        const newTab = await chrome.tabs.create({ 
          url: "https://kwork.ru/manage_kworks", 
          active: false 
        });
        
        // Wait for page to load and execute script
        setTimeout(async () => {
          await chrome.scripting.executeScript({
            target: { tabId: newTab.id! },
            files: ["content.js"]
          });
          
          // Close the tab after data collection
          setTimeout(() => {
            chrome.tabs.remove(newTab.id!);
          }, 5000);
        }, 3000);
      } else {
        // Execute on current tab if already on Kwork
        await chrome.scripting.executeScript({
          target: { tabId: currentTab.id! },
          files: ["content.js"]
        });
      }
      
      // Refresh data after collection
      setTimeout(async () => {
        await loadMetrics();
        isCollecting = false;
      }, 6000);
      
    } catch (error) {
      console.error('Error collecting data:', error);
      isCollecting = false;
    }
  }

  async function clearAllData() {
    if (typeof chrome === "undefined" || !chrome.storage?.local) return;

    if (confirm('Удалить все собранные данные?')) {
      await chrome.storage.local.remove(['metrics', 'lastUpdated']);
      metrics = [];
      lastUpdated = "";
    }
  }

  function exportToGoogleSheets() {
    if (metrics.length === 0) {
      alert('Нет данных для экспорта');
      return;
    }

    // Prepare data for CSV format
    const csvData = [
      ['Дата', 'Просмотры', 'Продажи', 'Заработано', 'Конкуренция'],
      ...metrics.map(m => [
        formatDate(m.date),
        m.views.toString(),
        m.sales.toString(),
        m.earned.toString(),
        m.competition
      ])
    ];

    // Convert to CSV string
    const csvContent = csvData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `kwork_metrics_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show instructions for Google Sheets
    alert('Файл CSV загружен!\n\nДля импорта в Google Sheets:\n1. Откройте sheets.google.com\n2. Создайте новую таблицу\n3. Файл → Импорт → Загрузить\n4. Выберите загруженный CSV файл');
  }

  function copyToClipboard() {
    if (metrics.length === 0) {
      alert('Нет данных для копирования');
      return;
    }

    const textData = [
      'Дата\tПросмотры\tПродажи\tЗаработано\tКонкуренция',
      ...metrics.map(m => [
        formatDate(m.date),
        m.views,
        m.sales,
        m.earned,
        m.competition
      ].join('\t'))
    ].join('\n');

    navigator.clipboard.writeText(textData).then(() => {
      alert('Данные скопированы в буфер обмена!\nМожете вставить в Google Sheets через Ctrl+V');
    }).catch(() => {
      alert('Ошибка копирования в буфер обмена');
    });
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatEarned(earned: number) {
    return earned.toLocaleString('ru-RU') + '₽';
  }

  async function updateCollectInterval() {
    if (collectInterval < 1) {
      alert('Интервал не может быть меньше 1 минуты');
      return;
    }

    if (!chrome?.storage?.local || !chrome.runtime) {
      console.warn("Chrome APIs are not available.");
      return;
    }

    isUpdatingInterval = true;

    try {
      // Save to storage
      await chrome.storage.local.set({ collectInterval });

      // Send message to background script to update alarm
      chrome.runtime.sendMessage({
        type: "UPDATE_INTERVAL",
        interval: collectInterval
      });

      alert(`Интервал автосбора обновлен: ${collectInterval} мин.`);
    } catch (error) {
      console.error('Error updating interval:', error);
      alert('Ошибка обновления интервала');
    } finally {
      isUpdatingInterval = false;
    }
  }

  function getIntervalDisplay() {
    if (collectInterval >= 60) {
      const hours = Math.floor(collectInterval / 60);
      const minutes = collectInterval % 60;
      return minutes > 0 ? `${hours}ч ${minutes}м` : `${hours}ч`;
    }
    return `${collectInterval}м`;
  }

  function exportLogs() {
    if (typeof chrome === "undefined") {
      console.warn("Chrome APIs are not available.");
      return;
    }
    downloadLogs();
  }
</script>

<div class="container">
  <div class="header">
    <h1>Kwork Metrics</h1>
    <div class="header-actions">
      <button 
        class="btn btn-primary" 
        on:click={collectDataNow} 
        disabled={isCollecting}
      >
        {#if isCollecting}
          <span class="spinner"></span> Собираю...
        {:else}
          📊 Собрать данные
        {/if}
      </button>
      <button class="btn btn-secondary" on:click={loadMetrics}>
        🔄 Обновить
      </button>
    </div>
  </div>

  {#if lastUpdated}
    <div class="last-updated">
      Последнее обновление: {formatDate(lastUpdated)}
    </div>
  {/if}

  {#if metrics.length === 0}
    <div class="empty-state">
      <p>📈 Нет данных для отображения</p>
      <p class="empty-hint">Нажмите "Собрать данные" для начала мониторинга</p>
    </div>
  {:else}
    <div class="stats-summary">
      <div class="summary-item">
        <span class="summary-label">Всего записей:</span>
        <span class="summary-value">{metrics.length}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Последние просмотры:</span>
        <span class="summary-value">{metrics[metrics.length - 1]?.views || 0}</span>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button 
        class="tab" 
        class:active={activeTab === 'table'} 
        on:click={() => activeTab = 'table'}
      >
        📋 Таблица
      </button>
      <button 
        class="tab" 
        class:active={activeTab === 'chart'} 
        on:click={() => activeTab = 'chart'}
      >
        📈 График
      </button>
      <button 
        class="tab" 
        class:active={activeTab === 'settings'} 
        on:click={() => activeTab = 'settings'}
      >
        ⚙️ Настройки
      </button>
    </div>

    <!-- Content -->
    {#if activeTab === 'table'}
      <table>
        <thead>
          <tr>
            <th>Дата</th>
            <th>Просмотры</th>
            <th>Продажи</th>
            <th>Заработано</th>
            <th>Конкуренция</th>
          </tr>
        </thead>
        <tbody>
          {#each metrics.slice(-10).reverse() as m}
            <tr>
              <td class="date-cell">{formatDate(m.date)}</td>
              <td class="number-cell">{m.views}</td>
              <td class="number-cell">{m.sales}</td>
              <td class="money-cell">{formatEarned(m.earned)}</td>
              <td class="competition-cell">{m.competition}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else if activeTab === 'chart'}
      <Chart {metrics} title="Динамика метрик за последние 7 дней" />
    {:else if activeTab === 'settings'}
      <div class="settings-panel">
        <h3>Автоматический сбор данных</h3>
        
        <div class="setting-item">
          <label for="interval">Интервал сбора (минуты):</label>
          <div class="interval-input">
            <input 
              id="interval"
              type="number" 
              min="1" 
              bind:value={collectInterval}
              class="interval-field"
            />
            <button 
              class="btn btn-primary"
              on:click={updateCollectInterval}
              disabled={isUpdatingInterval}
            >
              {#if isUpdatingInterval}
                <span class="spinner"></span>
              {:else}
                Сохранить
              {/if}
            </button>
          </div>
          <div class="setting-help">
            Текущий интервал: {getIntervalDisplay()}
          </div>
        </div>

        <div class="setting-item">
          <h4>Предустановленные интервалы:</h4>
          <div class="preset-buttons">
            <button class="btn btn-preset" on:click={() => collectInterval = 1}>1 мин</button>
            <button class="btn btn-preset" on:click={() => collectInterval = 5}>5 мин</button>
            <button class="btn btn-preset" on:click={() => collectInterval = 15}>15 мин</button>
            <button class="btn btn-preset" on:click={() => collectInterval = 30}>30 мин</button>
            <button class="btn btn-preset" on:click={() => collectInterval = 60}>1 час</button>
            <button class="btn btn-preset" on:click={() => collectInterval = 360}>6 часов</button>
            <button class="btn btn-preset" on:click={() => collectInterval = 1440}>24 часа</button>
          </div>
        </div>

        <div class="setting-item">
          <h4>📝 Информация:</h4>
          <ul class="info-list">
            <li>Минимальный интервал: 1 минута</li>
            <li>Данные собираются автоматически в фоне</li>
            <li>Страница Kwork открывается скрыто для сбора</li>
            <li>Изменения применяются сразу</li>
          </ul>
        </div>
      </div>
    {/if}

    <div class="footer-actions">
      <div class="export-buttons">
        <button class="btn btn-export" on:click={exportToGoogleSheets}>
          📊 CSV для Sheets
        </button>
        <button class="btn btn-export" on:click={copyToClipboard}>
          📋 Копировать
        </button>
        <button class="btn btn-export" on:click={exportLogs}>
          🪵 Логи
        </button>
      </div>
      <button class="btn btn-danger" on:click={clearAllData}>
        🗑️ Очистить данные
      </button>
    </div>
  {/if}
</div>

<style>
  .container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    padding: 0;
    width: 400px;
    max-height: 600px;
    overflow-y: auto;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e0e0e0;
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }

  h1 {
    color: #333;
    font-size: 18px;
    margin: 0;
  }

  .btn {
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: all 0.2s;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    background: #4CAF50;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #45a049;
  }

  .btn-secondary {
    background: #f5f5f5;
    color: #666;
  }

  .btn-secondary:hover {
    background: #e0e0e0;
  }

  .btn-danger {
    background: #f44336;
    color: white;
    font-size: 11px;
  }

  .btn-danger:hover {
    background: #da190b;
  }

  .spinner {
    width: 12px;
    height: 12px;
    border: 2px solid #ffffff3d;
    border-top: 2px solid #ffffff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .last-updated {
    font-size: 11px;
    color: #666;
    text-align: center;
    margin-bottom: 12px;
    padding: 4px 8px;
    background: #f9f9f9;
    border-radius: 4px;
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #666;
  }

  .empty-hint {
    font-size: 12px;
    opacity: 0.8;
  }

  .stats-summary {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 6px;
  }

  .summary-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .summary-label {
    font-size: 11px;
    color: #666;
  }

  .summary-value {
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }

  /* Tabs */
  .tabs {
    display: flex;
    margin-bottom: 16px;
    border-bottom: 1px solid #e0e0e0;
  }

  .tab {
    padding: 8px 16px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 12px;
    color: #666;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }

  .tab:hover {
    color: #333;
    background: #f5f5f5;
  }

  .tab.active {
    color: #4CAF50;
    border-bottom-color: #4CAF50;
    font-weight: 600;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    margin-bottom: 12px;
  }

  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }

  th {
    background-color: #f5f5f5;
    font-weight: 600;
    font-size: 11px;
  }

  .date-cell {
    font-size: 10px;
    color: #666;
  }

  .number-cell, .money-cell {
    text-align: right;
    font-weight: 500;
  }

  .money-cell {
    color: #4CAF50;
  }

  .competition-cell {
    text-align: center;
    font-size: 11px;
  }

  tr:nth-child(even) {
    background-color: #f9f9f9;
  }

  tr:hover {
    background-color: #f0f0f0;
  }

  .footer-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
    gap: 12px;
  }

  .export-buttons {
    display: flex;
    gap: 8px;
  }

  .btn-export {
    background: #2196F3;
    color: white;
    font-size: 11px;
  }

  .btn-export:hover {
    background: #1976D2;
  }

  /* Settings Panel */
  .settings-panel {
    padding: 12px 0;
  }

  .settings-panel h3 {
    margin: 0 0 16px 0;
    color: #333;
    font-size: 16px;
  }

  .setting-item {
    margin-bottom: 20px;
  }

  .setting-item label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #333;
    font-size: 12px;
  }

  .interval-input {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;
  }

  .interval-field {
    flex: 1;
    padding: 6px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 12px;
    max-width: 80px;
  }

  .interval-field:focus {
    outline: none;
    border-color: #4CAF50;
  }

  .setting-help {
    font-size: 11px;
    color: #666;
    font-style: italic;
  }

  .setting-item h4 {
    margin: 12px 0 8px 0;
    color: #333;
    font-size: 13px;
  }

  .preset-buttons {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    margin-bottom: 12px;
  }

  .btn-preset {
    background: #f5f5f5;
    color: #666;
    font-size: 10px;
    padding: 4px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-preset:hover {
    background: #e0e0e0;
    color: #333;
  }

  .info-list {
    margin: 0;
    padding-left: 16px;
    font-size: 11px;
    color: #666;
  }

  .info-list li {
    margin-bottom: 4px;
  }
</style>
