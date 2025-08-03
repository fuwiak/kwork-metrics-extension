<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    Chart,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    type ChartData,
    type ChartOptions
  } from 'chart.js';

  export let metrics: Array<{
    date: string;
    views: number;
    sales: number;
    earned: number;
    competition: string;
  }> = [];

  export let type: 'line' | 'bar' = 'line';
  export let title = 'Метрики';

  let canvas: HTMLCanvasElement;
  let chart: Chart;

  // Register Chart.js components
  Chart.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
  );

  onMount(() => {
    createChart();
  });

  onDestroy(() => {
    if (chart) {
      chart.destroy();
    }
  });

  $: if (chart && metrics) {
    updateChart();
  }

  function createChart() {
    if (!canvas || !metrics.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = prepareChartData();
    const options = getChartOptions();

    chart = new Chart(ctx, {
      type: type,
      data,
      options
    });
  }

  function updateChart() {
    if (!chart) return;

    const data = prepareChartData();
    chart.data = data;
    chart.update();
  }

  function prepareChartData(): ChartData<'line' | 'bar'> {
    const last7Days = metrics.slice(-7);
    
    const labels = last7Days.map(m => {
      const date = new Date(m.date);
      return date.toLocaleDateString('ru-RU', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit'
      });
    });

    return {
      labels,
      datasets: [
        {
          label: 'Просмотры',
          data: last7Days.map(m => m.views),
          borderColor: '#4CAF50',
          backgroundColor: '#4CAF5020',
          tension: 0.1
        },
        {
          label: 'Продажи',
          data: last7Days.map(m => m.sales),
          borderColor: '#2196F3',
          backgroundColor: '#2196F320',
          tension: 0.1
        },
        {
          label: 'Заработано (₽)',
          data: last7Days.map(m => m.earned),
          borderColor: '#FF9800',
          backgroundColor: '#FF980020',
          tension: 0.1,
          yAxisID: 'y1'
        }
      ]
    };
  }

  function getChartOptions(): ChartOptions<'line' | 'bar'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: title
        },
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            font: {
              size: 10
            }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        }
      },
      scales: {
        x: {
          display: true,
          ticks: {
            font: {
              size: 10
            }
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          ticks: {
            font: {
              size: 10
            }
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            font: {
              size: 10
            },
            callback: function(value) {
              return value + '₽';
            }
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    };
  }
</script>

<div class="chart-container">
  <canvas bind:this={canvas}></canvas>
</div>

<style>
  .chart-container {
    width: 100%;
    height: 200px;
    margin: 16px 0;
  }
</style> 