const chartType = window.CHART_TYPE || "bar";
const pageTitle = window.PAGE_TITLE || "Chart Demo";
const showGoalToggles =
  window.SHOW_GOAL_TOGGLES !== false && chartType !== "pie";

const modeButtons = {
  normal: document.getElementById("normalBtn"),
  future: document.getElementById("futureBtn"),
};
const fixedGoalLineToggle = document.getElementById("fixedGoalLineToggle");
const averageGoalLineToggle = document.getElementById("averageGoalLineToggle");
const goalControl = document.querySelector(".goal-control");
const body = document.body;
const legendPositionSelect = document.getElementById("legendPositionSelect");
let legendPosition = "top";

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
let fixedGoalLineEnabled = false;
let averageGoalLineEnabled = false;

function getDataRange(data) {
  const dates = data
    .map((item) =>
      item && item.DATE_CREATED ? new Date(item.DATE_CREATED) : null,
    )
    .filter((date) => date instanceof Date && !Number.isNaN(date.getTime()));

  if (!dates.length) return null;

  const timestamps = dates.map((date) => date.getTime());
  return {
    min: new Date(Math.min(...timestamps)),
    max: new Date(Math.max(...timestamps)),
  };
}

const dataRange = getDataRange(window.dmlOrderLineData || []);
const minDate = dataRange?.min ?? new Date("2025-01-01T00:00:00Z");
const maxDate = dataRange?.max ?? new Date("2026-05-31T23:59:59Z");

if (goalControl && !showGoalToggles) {
  goalControl.style.display = "none";
}

document.querySelector(".hero h1").textContent = pageTitle;
document.title = pageTitle;

function isInRange(date) {
  return date >= minDate && date <= maxDate;
}

function getMonthlySales(data) {
  if (!Array.isArray(data)) return { labels: [], values: [] };

  const hasMonthlyTotals = data.some(
    (item) => item && item.year && item.month && item.total_order_qty != null,
  );
  if (hasMonthlyTotals) {
    const sorted = [...data].sort((a, b) => {
      const yearCompare = a.year.localeCompare(b.year);
      return yearCompare || a.month.localeCompare(b.month);
    });

    return {
      labels: sorted.map(
        (item) => `${monthNames[Number(item.month) - 1]} ${item.year}`,
      ),
      values: sorted.map((item) => Number(item.total_order_qty)),
    };
  }

  const totals = data.reduce((acc, item) => {
    if (!item || !item.DATE_CREATED || item.ORDER_QTY == null) return acc;
    const date = new Date(item.DATE_CREATED);
    if (Number.isNaN(date.getTime()) || !isInRange(date)) return acc;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    acc[key] = (acc[key] || 0) + Number(item.ORDER_QTY);
    return acc;
  }, {});

  const sortedKeys = Object.keys(totals).sort();
  const fullKeys = [];

  if (sortedKeys.length) {
    let [startYear, startMonth] = sortedKeys[0].split("-").map(Number);
    const [endYear, endMonth] = sortedKeys[sortedKeys.length - 1]
      .split("-")
      .map(Number);
    while (
      startYear < endYear ||
      (startYear === endYear && startMonth <= endMonth)
    ) {
      fullKeys.push(`${startYear}-${String(startMonth).padStart(2, "0")}`);
      startMonth += 1;
      if (startMonth > 12) {
        startMonth = 1;
        startYear += 1;
      }
    }
  }

  const keys = fullKeys.length ? fullKeys : sortedKeys;
  return {
    labels: keys.map((key) => {
      const [year, month] = key.split("-");
      return `${monthNames[Number(month) - 1]} ${year}`;
    }),
    values: keys.map((key) => totals[key] || 0),
  };
}

const aggregatedSales = getMonthlySales(
  window.dmlOrderLineMonthlyTotals || window.dmlOrderLineData || [],
);
const chartData = {
  labels: aggregatedSales.labels,
  datasets: [
    {
      label: "Total Items Sold",
      data: aggregatedSales.values,
      borderWidth: 2,
      borderRadius: chartType === "bar" ? 12 : 0,
      barPercentage: 0.72,
      categoryPercentage: 0.72,
      hoverBorderWidth: 2,
      fill: chartType === "line" ? false : undefined,
      tension: chartType === "line" ? 0.2 : 0,
    },
  ],
};

function createChartOptions(mode) {
  const maxValue = Math.max(...aggregatedSales.values, 10);
  const shared = {
    responsive: true,
    maintainAspectRatio: false,

    animation: {
      duration: mode === "future" ? 1200 : 800,
      easing: mode === "future" ? "easeOutQuart" : "easeOutCubic",
    },

    legend: {
      display: true,
      position: legendPosition,
      labels: {
        fontColor: mode === "future" ? "#e2e8f0" : "#374151",
        usePointStyle: true,
        padding: 16,
      },
    },

    tooltips: {
      backgroundColor:
        mode === "future"
          ? "rgba(15, 23, 42, 0.96)"
          : "rgba(255, 255, 255, 0.96)",

      titleFontColor: mode === "future" ? "#f8fafc" : "#111827",

      bodyFontColor: mode === "future" ? "#e2e8f0" : "#111827",

      borderColor: mode === "future" ? "#475569" : "#d1d5db",

      borderWidth: 1,
      xPadding: 12,
      yPadding: 12,

      callbacks: {
        label: function (tooltipItem, data) {
          return (
            data.datasets[tooltipItem.datasetIndex].label +
            ": " +
            data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]
          );
        },
      },
    },
  };

  if (chartType !== "pie") {
    shared.scales = {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: mode === "future" ? "#cbd5e1" : "#6b7280",
          font: { size: 13 },
        },
      },
      y: {
        beginAtZero: true,
        suggestedMax: Math.ceil(maxValue * 1.12),
        grid: {
          color:
            mode === "future"
              ? "rgba(148, 163, 184, 0.12)"
              : "rgba(229, 231, 235, 0.85)",
        },
        ticks: {
          color: mode === "future" ? "#cbd5e1" : "#6b7280",
          font: { size: 13 },
          stepSize: Math.ceil(maxValue / 5) || 1,
        },
      },
    };
  } else {

  }

  return shared;
}

function createChartDatasets(mode) {
  const palette = {
    normal: {
      borderColor: "#2563eb",
      backgroundColor: "rgba(37, 99, 235, 0.58)",
    },
    future: {
      borderColor: "#22d3ee",
      backgroundColor: "rgba(34, 211, 238, 0.28)",
    },
  };

  const style = palette[mode] || palette.normal;
  const datasets = [];

  if (chartType === "pie") {
    const paletteColors = [
      "#38bdf8",
      "#a855f7",
      "#f97316",
      "#22c55e",
      "#facc15",
      "#fb7185",
      "#0ea5e9",
      "#10b981",
      "#8b5cf6",
      "#f59e0b",
    ];
    datasets.push({
      label: "Total Items Sold",
      data: chartData.datasets[0].data,
      backgroundColor: chartData.labels.map(
        (_, index) => paletteColors[index % paletteColors.length],
      ),
      borderColor: "#0f172a",
      borderWidth: 1,
      hoverOffset: 6,
    });
  } else {
    datasets.push({
      ...chartData.datasets[0],
      borderColor: style.borderColor,
      backgroundColor:
        chartType === "line"
          ? "rgba(34, 211, 238, 0.18)"
          : style.backgroundColor,
      hoverBackgroundColor:
        mode === "future"
          ? "rgba(56, 189, 248, 0.42)"
          : "rgba(37, 99, 235, 0.72)",
    });

    if (mode === "future" && fixedGoalLineEnabled) {
      datasets.push({
        type: "line",
        label: "Fixed goal (425)",
        data: chartData.labels.map(() => 425),
        borderColor: "#f97316",
        borderWidth: 2,
        borderDash: [6, 4],
        fill: false,
        pointRadius: 0,
        tension: 0.1,
        order: 1,
      });
    }

    if (mode === "future" && averageGoalLineEnabled) {
      const values = chartData.datasets[0]?.data || [];
      const averageValue = values.length
        ? Math.round(
            values.reduce((sum, value) => sum + Number(value || 0), 0) /
              values.length,
          )
        : 0;
      datasets.push({
        type: "line",
        label: `Average (${averageValue})`,
        data: chartData.labels.map(() => averageValue),
        borderColor: "#a855f7",
        borderWidth: 2,
        borderDash: [6, 4],
        fill: false,
        pointRadius: 0,
        tension: 0.1,
        order: 1,
      });
    }
  }

  return datasets;
}

const ctx = document
  .getElementById("chart_BWBBarChart_chartcan")
  .getContext("2d");
let chartInstance = null;

function renderChart(mode) {
  const config = {
    type: chartType,
    data: {
      labels: chartData.labels,
      datasets: createChartDatasets(mode),
    },
    options: createChartOptions(mode),
  };

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, config);
}

function setMode(mode) {
  body.classList.toggle("future-mode", mode === "future");
  body.classList.toggle("normal-mode", mode === "normal");
  modeButtons.normal.classList.toggle("active", mode === "normal");
  modeButtons.future.classList.toggle("active", mode === "future");
  renderChart(mode);
}

if (fixedGoalLineToggle) {
  fixedGoalLineToggle.addEventListener("change", () => {
    fixedGoalLineEnabled = fixedGoalLineToggle.checked;
    if (body.classList.contains("future-mode")) {
      renderChart("future");
    }
  });
}

if (averageGoalLineToggle) {
  averageGoalLineToggle.addEventListener("change", () => {
    averageGoalLineEnabled = averageGoalLineToggle.checked;
    if (body.classList.contains("future-mode")) {
      renderChart("future");
    }
  });
}

modeButtons.normal.addEventListener("click", () => setMode("normal"));
modeButtons.future.addEventListener("click", () => setMode("future"));

if (legendPositionSelect) {
  legendPositionSelect.addEventListener("change", () => {
    legendPosition =
      legendPositionSelect.value === "default"
        ? "right"
        : legendPositionSelect.value;

    renderChart(body.classList.contains("future-mode") ? "future" : "normal");
  });
}

setMode("normal");
