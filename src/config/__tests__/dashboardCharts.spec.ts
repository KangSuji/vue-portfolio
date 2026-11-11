import { describe, it, expect } from 'vitest';
import { monthlyComparisonChart, rankedBarChart } from '../dashboardCharts';
import type { ChartPalette } from '../chartPalette';

const palette: ChartPalette = {
  surface: '#000',
  text: '#fff',
  textMuted: '#aaa',
  grid: '#222',
  axis: '#333',
  accent: '#00f',
  muted: '#888',
  tooltipBg: '#111',
  tooltipBorder: '#333',
};

const current = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 5];
const prev = Array.from({ length: 12 }, () => 50);

describe('monthlyComparisonChart', () => {
  const chart = monthlyComparisonChart(palette, { year: 2026, current, prev, baseMonthIndex: 10 });
  const [confirmed, scheduled, prevSeries] = chart.series;

  it('기준 월까지는 실선, 기준 월부터는 점선 시리즈로 나눈다 (기준 월은 양쪽에 포함)', () => {
    expect(confirmed.data.slice(9)).toEqual([100, 110, null]);
    expect(scheduled.data.slice(9)).toEqual([null, 110, 5]);
    expect(scheduled.lineStyle.type).toBe('dashed');
  });

  it('작년은 비강조(회색), 올해는 강조색', () => {
    expect(confirmed.color).toBe(palette.accent);
    expect(prevSeries.color).toBe(palette.muted);
  });

  it('툴팁은 기준 월 이후를 개봉 예정으로 표시한다', () => {
    const tooltip = chart.tooltip.formatter([{ dataIndex: 11 }]);
    expect(tooltip).toContain('2026년 (개봉 예정)');
    expect(tooltip).toContain('2025년');
  });
});

describe('rankedBarChart', () => {
  it('상위 n개만 강조색', () => {
    const chart = rankedBarChart(palette, {
      labels: ['a', 'b', 'c'],
      values: [3, 2, 1],
      highlightTop: 1,
    });
    const colors = chart.series[0].data.map((d) => d.itemStyle.color);
    expect(colors).toEqual([palette.accent, palette.muted, palette.muted]);
  });

  it('툴팁에 들어가는 이름은 HTML 이스케이프한다', () => {
    const chart = rankedBarChart(palette, { labels: ['x'], values: [1] });
    const html = chart.tooltip.formatter({ name: '<img onerror=x>', value: 1, color: '#00f' });
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img onerror=x&gt;');
  });
});
