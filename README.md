# ChartDemo

This repository contains a static Chart.js demo with two UI modes: `Normal` and `Future`.

## Files

- `index.html` — main demo page with chart UI, mode switching, and toggle controls.
- `dml_order_line.js` — sample order-line dataset used to build chart values.
- `js/chart.js` — bundled Chart.js library.

## Features

- `Normal` mode: production-style chart layout.
- `Future` mode: dark glassmorphism layout with modern styling.
- Future-only toggles:
  - `Fixed goal line (425)` adds a horizontal line at 425.
  - `Average monthly total` adds a horizontal line at the average monthly total.

## How it works

- `getMonthlySales(data)` aggregates raw orders by month using `DATE_CREATED` and `ORDER_QTY`.
- `createChartOptions(mode)` returns shared chart options and adjusts styles for each mode.
- `createChartDatasets(mode)` builds the bar dataset and adds future-mode line overlays when toggles are enabled.
- `setMode(mode)` applies CSS mode classes and re-renders the chart.

## Run locally

Open `index.html` in a browser.

## GitHub

The repository is available at: https://github.com/bandcbarn-tech/ChartDemo.git
