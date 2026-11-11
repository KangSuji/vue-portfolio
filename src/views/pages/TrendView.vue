<template>
  <q-page>
    <div class="page_container trand-container">
      <div v-for="section in sections" :key="section.title" class="trand-wrap">
        <p class="trand__title">{{ section.title }}</p>
        <q-carousel
          v-model="slides[section.mediaType]"
          transition-prev="slide-right"
          transition-next="slide-left"
          swipeable
          animated
          navigation
          padding
          arrows
          control-color="blue-grey-3"
        >
          <q-carousel-slide
            v-for="(group, groupIndex) in section.groups"
            :key="groupIndex"
            :name="groupIndex"
            class="row wrap justify-around"
          >
            <div
              v-for="content in group"
              :key="content.id"
              class="trend-item"
              @click="onClickDetail(content)"
            >
              <div class="bg-wrap">
                <p class="trend-item-description">{{ content.description }}</p>
                <!-- width/height: 브라우저가 로딩 전에 비율(2:3)을 알 수 있게 -->
                <img
                  :src="content.image"
                  :alt="content.title"
                  width="220"
                  height="330"
                  decoding="async"
                />
              </div>
              <p class="trend-item-title">{{ content.title }}</p>
            </div>
          </q-carousel-slide>
        </q-carousel>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useDashboardStore } from '@/stores/useDashboardStore';
import type { MediaCard, MediaType } from '@/api';
import { chunk } from '@/utils/array';
import progressConfig from '@/config/progressConfig';

const router = useRouter();
const dashboardStore = useDashboardStore();
const { data, trendingMovies, trendingTvShows } = storeToRefs(dashboardStore);

// 캐러셀별 현재 슬라이드
const slides = reactive<Record<MediaType, number>>({ movie: 0, tv: 0 });

// ── 반응형: 한 슬라이드에 표시할 콘텐츠 개수 ─────────────
// trending.scss의 @media (max-width: N)과 같은 기준이어야 한다 (max-width는 N을 포함하므로 <=)
function getItemsPerSlide() {
  const width = window.innerWidth;
  if (width <= 500) return 1;
  if (width <= 768) return 2;
  if (width <= 1024) return 3;
  if (width <= 1440) return 4;
  return 5;
}

const itemsPerSlide = ref(getItemsPerSlide());

function handleResize() {
  itemsPerSlide.value = getItemsPerSlide();
}

// ── 섹션 데이터 ─────────────────────────────────────────
const sections = computed(() => [
  {
    title: 'Trending Movies',
    mediaType: 'movie' as const,
    groups: chunk(trendingMovies.value, itemsPerSlide.value),
  },
  {
    title: 'Trending TV Series',
    mediaType: 'tv' as const,
    groups: chunk(trendingTvShows.value, itemsPerSlide.value),
  },
]);

const onClickDetail = (content: MediaCard) => {
  router.push({
    name: 'detail',
    params: { category: content.mediaType, id: content.id },
  });
};

const fetchTrending = async () => {
  if (data.value) return;

  progressConfig.show();
  try {
    await dashboardStore.load();
  } catch (error) {
    console.error('Error fetching trend list:', error);
  } finally {
    progressConfig.hide();
  }
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
  fetchTrending();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});
</script>
