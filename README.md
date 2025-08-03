# Kwork Metrics Extension

Chrome extension for automatic collection and analysis of metrics from Kwork.ru platform.

## 🚀 Features

- **📊 Automatic Data Collection**: Configurable intervals from 1 minute to 24 hours
- **📈 Interactive Charts**: Visual representation of metrics using Chart.js
- **🔄 Manual Collection**: On-demand data gathering with one click
- **📋 Data Export**: CSV export for Google Sheets integration
- **⚙️ Settings Panel**: Easy configuration of collection intervals
- **📱 Modern UI**: Clean, responsive interface with tabbed navigation

## 📊 Collected Metrics

- **Views** (Просмотры): Page views for your services
- **Sales** (Продажи): Number of sales completed  
- **Earnings** (Заработано): Total amount earned
- **Competition** (Конкуренция): Competition level indicator

## 🛠 Tech Stack

- **Frontend**: Svelte + TypeScript
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Charts**: Chart.js
- **Chrome APIs**: storage, alarms, scripting, tabs
- **Manifest**: V3

## 🏗 Development Setup

### Prerequisites
- Node.js 18+ (managed with nvm)
- pnpm package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd kwork_metrics_extension
```

2. Install dependencies:
```bash
pnpm install
```

3. Build the extension:
```bash
pnpm run build
```

### Available Scripts

- `pnpm run dev` - Development mode with hot reload
- `pnpm run build` - Production build
- `pnpm run preview` - Preview built extension
- `pnpm run type-check` - TypeScript type checking

## 📦 Installation in Chrome

1. Build the extension: `pnpm run build`
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked" and select the `dist` folder
5. The extension will appear in your toolbar

## ⚙️ Configuration

### Auto-Collection Interval

1. Click the extension icon in your toolbar
2. Go to **"⚙️ Настройки"** tab
3. Set your preferred collection interval:
   - **1 minute**: Active monitoring
   - **5-15 minutes**: Regular updates
   - **1 hour**: Hourly checks
   - **24 hours**: Daily summaries

### Manual Collection

- Click **"📊 Собрать данные"** button anytime
- Works whether you're on Kwork.ru or any other page
- Automatically opens Kwork page in background if needed

## 📈 Data Visualization

### Table View
- Last 10 records in chronological order
- Formatted dates and currency values
- Sortable columns

### Chart View  
- Interactive line charts for last 7 days
- Multiple metrics on same graph
- Dual Y-axis for different scales
- Hover tooltips with detailed info

## 📊 Data Export

### CSV Export
1. Click **"📊 CSV для Sheets"**
2. CSV file downloads automatically
3. Import to Google Sheets: File → Import → Upload

### Copy to Clipboard
1. Click **"📋 Копировать"**
2. Data copied as tab-separated values
3. Paste directly into Google Sheets with Ctrl+V

## 🏗 Project Structure

```
src/
├── background.ts          # Service worker for auto-collection
├── content.ts            # Content script for data extraction
├── types.ts              # TypeScript interfaces
└── popup/
    ├── App.svelte        # Main popup component
    ├── Chart.svelte      # Chart visualization component
    ├── popup.html        # Popup HTML template
    └── popup.ts          # Popup entry point

manifest.json             # Extension manifest (V3)
vite.config.ts           # Vite build configuration
package.json             # Dependencies and scripts
```

## 🔧 Chrome APIs Used

- `chrome.storage.local` - Data persistence
- `chrome.alarms` - Scheduled auto-collection
- `chrome.scripting` - Content script injection
- `chrome.tabs` - Tab management for background collection
- `chrome.runtime` - Inter-script messaging

## 📝 Data Storage

All data is stored locally using Chrome's storage API:
- `metrics`: Array of collected data points
- `lastUpdated`: Timestamp of last successful collection
- `collectInterval`: User-configured collection interval

## 🛡 Privacy & Security

- **Local Storage Only**: No data sent to external servers
- **Kwork.ru Only**: Extension only accesses Kwork domain
- **Background Collection**: Uses hidden tabs, no user interference
- **User Control**: Manual data clearing available

## 🐛 Troubleshooting

### Extension Not Loading
- Check if all dependencies are installed: `pnpm install`
- Rebuild the extension: `pnpm run build`
- Verify `dist/` folder contains all files

### Data Not Collecting
- Check if you're logged into Kwork.ru
- Verify the page structure hasn't changed
- Check browser console for error messages
- Try manual collection first

### Charts Not Displaying
- Ensure you have at least 2 data points
- Check browser console for Chart.js errors
- Try refreshing the popup

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Svelte](https://svelte.dev/) - Reactive frontend framework
- [Chart.js](https://www.chartjs.org/) - Data visualization
- [Vite](https://vitejs.dev/) - Fast build tool
- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/) - Browser integration