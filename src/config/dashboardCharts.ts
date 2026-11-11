/**
 * 대시보드 차트 옵션 생성 (BarChartComp / LineChartComp에 v-bind로 전달)
 * - 반환 객체의 키(xAxis, yAxis, series, tooltip, legend, grid, toolbox)는 차트 컴포넌트 props 이름과 같다.
 * - 마크 규칙: 선 2px, 막대 두께 최대 20px + 끝 4px 라운드, 그리드는 1px 실선, 값 라벨은 막대 끝에만
 */
import type { ChartPalette } from './chartPalette';
import { escapeHtml } from '@/utils/html';

const numberFormat = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 });
export const formatNumber = (value: number) => numberFormat.format(value);

const axisLabel = (p: ChartPalette) => ({ color: p.textMuted, fontSize: 12 });

const splitLine = (p: ChartPalette) => ({
  show: true,
  lineStyle: { color: p.grid, width: 1, type: 'solid' },
});

const tooltipBase = (p: ChartPalette) => ({
  backgroundColor: p.tooltipBg,
  borderColor: p.tooltipBorder,
  borderWidth: 1,
  padding: [8, 12],
  textStyle: { color: p.text, fontSize: 12 },
  extraCssText: 'border-radius: 8px; box-shadow: none;',
});

/** 툴팁 한 줄: 짧은 선(시리즈 색) + 값(강조) + 이름(보조) */
const tooltipRow = (p: ChartPalette, color: string, value: string, label: string) => `
  <div style="display:flex;align-items:center;gap:8px;margin-top:4px">
    <span style="display:inline-block;width:12px;height:2px;border-radius:1px;background:${color}"></span>
    <strong style="font-size:13px">${value}</strong>
    <span style="color:${p.textMuted}">${escapeHtml(label)}</span>
  </div>`;

const hiddenToolbox = { show: false };

// 범례 아이콘 (legend의 itemWidth x itemHeight 크기로 늘려서 그려짐)
const LEGEND_ICON_SOLID = 'path://M0,0h16v3h-16z';
const LEGEND_ICON_DASHED = 'path://M0,0h4v3h-4zM6,0h4v3h-4zM12,0h4v3h-4z';

// ── 월별 개봉 추이: 올해 vs 작년 ─────────────────────────────

export interface MonthlyComparisonInput {
  year: number;
  current: number[];
  prev: number[];
  /** 기준일의 월 (0 = 1월). 이후 달은 등록된 예정작만 있어 점선으로 표시 */
  baseMonthIndex: number;
}

export function monthlyComparisonChart(p: ChartPalette, input: MonthlyComparisonInput) {
  const { year, current, prev, baseMonthIndex } = input;
  const months = Array.from({ length: 12 }, (_, i) => `${i + 1}월`);

  // 기준 월에서 두 선이 이어지도록 기준 월 값은 양쪽에 모두 넣는다
  const confirmed = current.map((value, i) => (i <= baseMonthIndex ? value : null));
  const scheduled = current.map((value, i) => (i >= baseMonthIndex ? value : null));

  const currentName = `${year}년`;
  const scheduledName = `${year}년 (개봉 예정)`;
  const prevName = `${year - 1}년`;

  const lineSeries = (name: string, data: (number | null)[], color: string, dashed = false) => ({
    name,
    type: 'line',
    data,
    color,
    lineStyle: { width: 2, type: dashed ? 'dashed' : 'solid', cap: 'round', join: 'round' },
    symbol: 'circle',
    symbolSize: 8,
    showSymbol: false,
    // 데이터 점 위에 배경색 테두리를 둘러 선과 겹쳐도 구분되게
    itemStyle: { borderWidth: 2, borderColor: p.surface },
  });

  return {
    xAxis: [
      {
        type: 'category',
        data: months,
        boundaryGap: false,
        axisLine: { lineStyle: { color: p.axis } },
        axisTick: { show: false },
        axisLabel: axisLabel(p),
      },
    ],
    yAxis: [{ type: 'value', axisLabel: axisLabel(p), splitLine: splitLine(p) }],
    series: [
      { ...lineSeries(currentName, confirmed, p.accent), areaStyle: { opacity: 0.1 }, z: 3 },
      { ...lineSeries(scheduledName, scheduled, p.accent, true), z: 3 },
      { ...lineSeries(prevName, prev, p.muted), z: 2 },
    ],
    legend: {
      show: true,
      top: 0,
      right: 0,
      itemWidth: 16,
      itemHeight: 3,
      itemGap: 16,
      // 시리즈의 점 테두리(배경색 2px)가 범례 아이콘에도 적용되어 아이콘을 덮으므로 제거
      itemStyle: { borderWidth: 0 },
      textStyle: { color: p.textMuted, fontSize: 12 },
      // 기본 아이콘(선 + 점)은 작게 그려져 실선도 점선처럼 보이므로 모양을 직접 지정
      data: [
        { name: currentName, icon: LEGEND_ICON_SOLID },
        { name: scheduledName, icon: LEGEND_ICON_DASHED },
        { name: prevName, icon: LEGEND_ICON_SOLID },
      ],
    },
    tooltip: {
      ...tooltipBase(p),
      trigger: 'axis',
      axisPointer: { type: 'line', lineStyle: { color: p.axis, width: 1 } },
      // 기준 월은 두 시리즈에 중복으로 들어 있으므로 params 대신 원본 배열에서 읽는다
      formatter: (params: { dataIndex: number }[]) => {
        const i = params[0]?.dataIndex ?? 0;
        const isScheduled = i > baseMonthIndex;
        return [
          `<div style="color:${p.textMuted}">${months[i]}</div>`,
          tooltipRow(
            p,
            p.accent,
            `${formatNumber(current[i] ?? 0)}편`,
            isScheduled ? scheduledName : currentName,
          ),
          tooltipRow(p, p.muted, `${formatNumber(prev[i] ?? 0)}편`, prevName),
        ].join('');
      },
    },
    grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
    toolbox: hiddenToolbox,
  };
}

// ── 순위 가로 막대 (TOP 10, 장르) ─────────────────────────────

export interface RankedBarInput {
  labels: string[];
  values: number[];
  /** 앞에서부터 n개만 강조색, 나머지는 회색. 생략하면 전부 강조색(단일 시리즈) */
  highlightTop?: number;
  valueSuffix?: string;
  /** 툴팁에서 값 옆에 붙는 설명 (예: '인기도 점수') */
  valueLabel?: string;
  /** 클릭 가능한 막대면 포인터 커서 */
  clickable?: boolean;
}

export function rankedBarChart(p: ChartPalette, input: RankedBarInput) {
  const {
    labels,
    values,
    highlightTop = labels.length,
    valueSuffix = '',
    valueLabel = '',
    clickable = false,
  } = input;
  const format = (value: number) => `${formatNumber(value)}${valueSuffix}`;

  return {
    xAxis: [{ type: 'value', axisLabel: axisLabel(p), splitLine: splitLine(p) }],
    yAxis: [
      {
        type: 'category',
        data: labels,
        inverse: true, // 1위가 맨 위
        axisTick: { show: false },
        axisLine: { lineStyle: { color: p.axis } },
        axisLabel: { ...axisLabel(p), color: p.text, width: 140, overflow: 'truncate' },
      },
    ],
    series: [
      {
        type: 'bar',
        barMaxWidth: 20,
        cursor: clickable ? 'pointer' : 'default',
        data: values.map((value, i) => ({
          value,
          itemStyle: { color: i < highlightTop ? p.accent : p.muted },
        })),
        itemStyle: { borderRadius: [0, 4, 4, 0] },
        emphasis: { itemStyle: { opacity: 0.8 } },
        label: {
          show: true,
          position: 'right',
          color: p.textMuted,
          fontSize: 12,
          formatter: ({ value }: { value: number }) => format(value),
        },
      },
    ],
    legend: { show: false },
    tooltip: {
      ...tooltipBase(p),
      trigger: 'item',
      formatter: ({ name, value, color }: { name: string; value: number; color: string }) =>
        tooltipRow(p, color, format(value), valueLabel) +
        `<div style="margin-top:4px;color:${p.textMuted}">${escapeHtml(name)}</div>`,
    },
    // 막대 끝 값 라벨이 잘리지 않도록 오른쪽 여백 확보
    grid: { left: 8, right: 56, top: 8, bottom: 8, containLabel: true },
    toolbox: hiddenToolbox,
  };
}
