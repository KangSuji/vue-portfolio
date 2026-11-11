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
                <img :src="content.image" :alt="content.title" />
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
import { useTrendingStore } from '@/stores/useTrendingStore';
import { movieToCard, tvToCard, type MediaCard, type MediaType } from '@/api';
import { chunk } from '@/utils/array';
import progressConfig from '@/config/progressConfig';

const router = useRouter();
const trendingStore = useTrendingStore();
const { movies, tvShows } = storeToRefs(trendingStore);

// 캐러셀별 현재 슬라이드
const slides = reactive<Record<MediaType, number>>({ movie: 0, tv: 0 });

// ── 반응형: 한 슬라이드에 표시할 콘텐츠 개수 ─────────────
function getItemsPerSlide() {
  const width = window.innerWidth;
  if (width < 500) return 1;
  if (width < 768) return 2;
  if (width < 1024) return 3;
  if (width < 1440) return 4;
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
    groups: chunk(movies.value.map(movieToCard), itemsPerSlide.value),
  },
  {
    title: 'Trending TV Series',
    mediaType: 'tv' as const,
    groups: chunk(tvShows.value.map(tvToCard), itemsPerSlide.value),
  },
]);

const onClickDetail = (content: MediaCard) => {
  router.push({
    name: 'detail',
    params: { category: content.mediaType, id: content.id },
  });
};

const fetchTrending = async () => {
  progressConfig.show();
  try {
    await Promise.all([trendingStore.fetchMovies('day'), trendingStore.fetchTvShows('day')]);
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
