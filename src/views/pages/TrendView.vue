<template>
  <q-page>
    <div class="page_container trand-container">
      <div class="trand-wrap">
        <p class="trand__title">Trending Movies</p>
        <q-carousel
          v-model="movieSlide"
          transition-prev="slide-right"
          transition-next="slide-left"
          swipeable
          animated
          navigation
          padding
          arrows
          control-color="blue-grey-3"
        >
          <template v-for="(group, groupIndex) in groupedTrendMoviesContents" :key="groupIndex">
            <q-carousel-slide :name="groupIndex" class="row wrap justify-around">
              <div
                v-for="(content, index) in group"
                :key="index"
                class="trend-item"
                @click="onClickDetail(content.id, 'movie')"
              >
                <div class="bg-wrap">
                  <p class="trend-item-description">{{ content.description }}</p>
                  <img :src="content.image" />
                </div>
                <p class="trend-item-title">{{ content.title }}</p>
              </div>
            </q-carousel-slide>
          </template>
        </q-carousel>
      </div>
      <div class="trand-wrap">
        <p class="trand__title">Trending TV Series</p>
        <q-carousel
          v-model="tvSlide"
          transition-prev="slide-right"
          transition-next="slide-left"
          swipeable
          animated
          navigation
          padding
          arrows
        >
          <template v-for="(group, groupIndex) in groupedTrendTvContents" :key="groupIndex">
            <q-carousel-slide :name="groupIndex" class="row wrap justify-around">
              <div
                v-for="(content, index) in group"
                :key="index"
                class="trend-item"
                @click="onClickDetail(content.id, 'tv')"
              >
                <div class="bg-wrap">
                  <p class="trend-item-description">{{ content.description }}</p>
                  <img :src="content.image" />
                </div>
                <p class="trend-item-title">{{ content.title }}</p>
              </div>
            </q-carousel-slide>
          </template>
        </q-carousel>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
// store
import { storeToRefs } from 'pinia';
import { useMovieStore } from '@/stores/useMainStore';

import router from '@/router';
import progressConfig from '@/config/progressConfig';

interface Contents {
  id: number;
  title: string;
  image: string;
  description: string;
  releaseDate: string;
  rating: number;
}

const movieStore = useMovieStore();
const { trendMvList, trendTvList } = storeToRefs(movieStore);

const movieSlide = ref(0);

const tvSlide = ref(0);

// 한 슬라이드에 표시할 콘텐츠 개수
const itemsPerSlide = ref(getItemsPerSlide());

function getItemsPerSlide() {
  const width = window.innerWidth;
  if (width < 500) return 1;
  if (width < 768) return 2;
  if (width < 1024) return 3;
  if (width < 1440) return 4;
  return 5;
}

function handleResize() {
  itemsPerSlide.value = getItemsPerSlide();
}

onMounted(() => {
  window.addEventListener('resize', handleResize);
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});

const trendMoviesContents = computed(() => {
  const trendListData = trendMvList.value ?? [];

  return trendListData.map((item) => {
    return {
      id: item.id,
      title: item.title ?? item.name,
      image: `https://media.themoviedb.org/t/p/w220_and_h330_face/${item.poster_path}`,
      description: item.overview,
      releaseDate: item.first_air_date ?? item.release_date,
      rating: item.rating,
    };
  });
});

const trendTvContents = computed(() => {
  const trendTvLists = trendTvList.value ?? [];

  return trendTvLists.map((item) => {
    return {
      id: item.id,
      title: item.title ?? item.name,
      image: `https://media.themoviedb.org/t/p/w220_and_h330_face/${item.poster_path}`,
      description: item.overview,
      releaseDate: item.first_air_date ?? item.release_date,
      rating: item.rating,
    };
  });
});

// 콘텐츠를 그룹화하여 한 슬라이드에 여러 개 배치
const groupedTrendMoviesContents = computed(() => {
  const contents: Contents[] = trendMoviesContents.value;
  const groups: Array<Contents[]> = [];
  for (let i = 0; i < contents.length; i += itemsPerSlide.value) {
    groups.push(contents.slice(i, i + itemsPerSlide.value));
  }
  return groups;
});

const groupedTrendTvContents = computed(() => {
  const contents: Contents[] = trendTvContents.value;
  const groups: Array<Contents[]> = [];
  for (let i = 0; i < contents.length; i += itemsPerSlide.value) {
    groups.push(contents.slice(i, i + itemsPerSlide.value));
  }
  return groups;
});

const onClickDetail = (contentId: number, category: string) => {
  router.push({
    name: 'detail',
    params: {
      id: contentId,
      category: category,
    },
  });
};

const getTrendingList = async () => {
  progressConfig.show();
  try {
    await Promise.all([movieStore.searchTrendMovieByDay(), movieStore.searchTrendTvByDay()]);
  } catch (error) {
    console.error('Error fetching trend list:', error);
  } finally {
    progressConfig.hide();
  }
};

onMounted(() => {
  getTrendingList();
});
</script>

<style lang="scss" scoped></style>
