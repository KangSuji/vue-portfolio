<template>
  <div class="chart_area">
    <div ref="barChart" :style="props.size" />
  </div>
</template>
<script lang="ts" setup>
import { onBeforeUnmount, onMounted, onUpdated, ref } from 'vue';
import * as echarts from 'echarts/core';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart } from 'echarts/charts';
import { theme } from '@/config/chartOptions';

const props = defineProps({
  // 차트 사이즈
  size: {
    type: Object,
    default: () => {
      return { width: '100%', height: '400px' };
    },
  },
  // x축
  xAxis: {
    type: Array,
    default: () => {
      return [{ type: 'category' }];
    },
  },
  // y축
  yAxis: {
    type: Array,
    default: () => {
      return [{ type: 'value' }];
    },
  },
  // 데이터
  series: {
    type: Array,
    default: () => {
      return [
        {
          data: [],
          type: 'bar',
          barWidth: 120,
          itemStyle: {
            borderRadius: [8, 8, 0, 0],
          },
        },
      ];
    },
  },
  // hover 툴팁
  tooltip: {
    type: Object,
    default: () => {
      {
        return {
          trigger: 'item',
          borderWidth: 0,
          padding: 0,
          backgroundColor: 'transparent',
          formatter: (params) => {
            return `
              <div class="tooltip_style">
                <p class="name">${params.name}</p>
                <p class="data">${params.data}</p>
              </div>
            `;
          },
          position: function (point, params, dom, rect, size) {
            return [point[0] + 20, point[1] - 30];
          },
        };
      }
    },
  },
  // 범례
  legend: {
    type: Object,
    default: () => {
      return {
        type: 'scroll',
        textStyle: {
          color: 'gray',
        },
        pageTextStyle: {
          color: 'gray',
        },
      };
    },
  },
  // 유틸리티
  toolbox: {
    type: Object,
    default: () => {
      return {
        show: true, // toolbox 표시
        feature: {
          saveAsImage: {
            show: true, // 이미지 저장 버튼
            title: 'Save as Image',
          },
          magicType: {
            show: true, // 차트 유형 변경 버튼
            type: ['line', 'bar'], // 지원하는 차트 유형
            title: {
              line: 'Switch to Line Chart',
              bar: 'Switch to Bar Chart',
            },
          },
        },
      };
    },
  },
  // 그리드(여백)
  grid: {
    type: Object,
    default: () => {
      return { containLabel: true };
    },
  },
  // 그래프 애니메이션
  animation: {
    type: Boolean,
    default: () => {
      return true;
    },
  },
});

// Echart 등록
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  CanvasRenderer,
  ToolboxComponent,
]);
const barChart = ref();
let chart: echarts.ECharts | undefined;

// 인스턴스는 한 번만 만들고, 이후에는 옵션만 교체한다
const drawChart = () => {
  if (!chart) {
    // 차트 테마 적용
    echarts.registerTheme('theme', theme.theme);
    chart = echarts.init(barChart.value, 'theme');
  }
  chart.setOption({ ...props }, true);
};

onUpdated(() => {
  drawChart();
});

const resizeChart = () => {
  chart?.resize();
};

onMounted(() => {
  drawChart();
  window.addEventListener('resize', resizeChart);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart);
  chart?.dispose();
  chart = undefined;
});
</script>
