<template>
  <div class="main__card">
    <div class="main__card__title-area">
      <q class="main__card__title-area--title">{{ content.title }}</q>
      <span class="material-symbols-rounded"> {{ content.icon }} </span>
    </div>

    <div class="main__card__content">
      <p class="number">{{ content.value }}</p>
    </div>
    <div
      class="main__card__increase"
      :class="{
        increase: hasChange && isIncrease,
        decrease: hasChange && !isIncrease,
      }"
    >
      <template v-if="hasChange">
        <span v-if="isIncrease" class="material-symbols-rounded"> arrow_upward </span>
        <span v-else class="material-symbols-rounded"> arrow_downward </span>
        <span>{{ `${content.increase}%` }} </span>
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';

export interface Contents {
  icon: string;
  title: string;
  value: string | number;
  /** 증감률(%). null이면 비교 불가로 표시하지 않음 */
  increase?: number | null;
  description: string;
}

const props = withDefaults(defineProps<{ content?: Contents }>(), {
  content: () => ({
    icon: 'movie',
    title: '',
    value: '',
    increase: null,
    description: '',
  }),
});

// 0%도 "변화 없음"이므로 표시하지 않는다
const hasChange = computed(() => !!props.content.increase);
const isIncrease = computed(() => Number(props.content.increase) > 0);
</script>
