export async function log(message: string) {
  console.log(message);
  if (!chrome?.storage?.local) return;
  const { logs = [] } = await chrome.storage.local.get(['logs']);
  logs.push({ time: new Date().toISOString(), message });
  await chrome.storage.local.set({ logs });
}

export async function downloadLogs() {
  if (!chrome?.storage?.local || !chrome.downloads) return;
  const { logs = [] } = await chrome.storage.local.get(['logs']);
  const content = logs.map((l: any) => `[${l.time}] ${l.message}`).join('\n');
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  chrome.downloads.download({
    url,
    filename: `kwork_logs_${new Date().toISOString().split('T')[0]}.log`,
    saveAs: true
  }, () => {
    URL.revokeObjectURL(url);
  });
}

export async function clearLogs() {
  if (!chrome?.storage?.local) return;
  await chrome.storage.local.remove(['logs']);
}
