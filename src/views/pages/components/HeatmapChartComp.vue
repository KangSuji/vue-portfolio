<template>
  <div class="chart_area">
    <div ref="heatmapChart" :style="props.size" />
  </div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, onUpdated, ref } from 'vue';
import * as echarts from 'echarts/core';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  VisualMapComponent, // 추가된 부분
} from 'echarts/components';
import { HeatmapChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { theme } from '@/config/chartOptions';

const props = defineProps({
  size: {
    type: Object,
    default: () => {
      return { width: '100%', height: '650px' };
    },
  },
  xAxis: {
    type: Array,
    default: () => {
      return [{ type: 'category', data: [] }];
    },
  },
  yAxis: {
    type: Array,
    default: () => {
      return [{ type: 'category', data: [] }];
    },
  },
  series: {
    type: Array,
    default: () => {
      return [
        {
          name: 'Heatmap',
          type: 'heatmap',
          data: [],
          label: { show: true },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ];
    },
  },
  tooltip: {
    type: Object,
    default: () => {
      return {
        position: 'top',
        formatter: (params) => {
          return `평점: ${params.data[0]}점<br/>월: ${params.data[1] + 1}월<br/>영화 수: ${params.data[2]}`;
        },
      };
    },
  },
  // 추가된 visualMap 설정
  visualMap: {
    type: Object,
    default: () => {
      return {
        min: 0, // 최소값
        max: 20, // 최대값
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '5%',
        inRange: {
          color: ['#f5f5f5', '#2f7f8f', '#1d1d1d'], // 그라디언트 색상
        },
      };
    },
  },
  grid: {
    type: Object,
    default: () => {
      return { containLabel: true, top: '10%' };
    },
  },
});

echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  HeatmapChart,
  VisualMapComponent,
  CanvasRenderer,
]);

const heatmapChart = ref();
let chart: echarts.ECharts | undefined;

// 인스턴스는 한 번만 만들고, 이후에는 옵션만 교체한다
const drawChart = () => {
  if (!chart) {
    echarts.registerTheme('theme', theme.theme);
    chart = echarts.init(heatmapChart.value, 'theme');
  }

  chart.setOption({
    tooltip: props.tooltip,
    xAxis: props.xAxis[0],
    yAxis: props.yAxis[0],
    visualMap: props.visualMap,
    grid: props.grid,
    series: props.series,
  });
};

const resizeChart = () => {
  chart?.resize();
};

onMounted(() => {
  drawChart();
  window.addEventListener('resize', resizeChart);
});

onUpdated(() => {
  drawChart();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart);
  chart?.dispose();
  chart = undefined;
});
</script>
