import { describe, it, expect } from 'vitest';
import { movieToCard, tmdbImageUrl, tvDetailToContent, tvToCard } from '../mappers';
import type { MovieSummary, TvDetail, TvSummary } from '../types';

const movie: MovieSummary = {
  id: 1,
  title: '영화',
  original_title: 'Movie',
  release_date: '2025-05-01',
  overview: '개요',
  poster_path: '/poster.jpg',
  backdrop_path: null,
  popularity: 100,
  vote_average: 7.456,
  vote_count: 10,
  original_language: 'en',
  genre_ids: [],
};

const tv: TvSummary = {
  id: 2,
  name: '드라마',
  original_name: 'Drama',
  first_air_date: '2025-03-01',
  origin_country: ['KR'],
  overview: '',
  poster_path: null,
  backdrop_path: '/bg.jpg',
  popularity: 50,
  vote_average: 8,
  vote_count: 5,
  original_language: 'ko',
  genre_ids: [],
};

describe('tmdbImageUrl', () => {
  it('경로 앞에 슬래시를 중복으로 붙이지 않는다', () => {
    expect(tmdbImageUrl('/a.jpg', 'w780')).toBe('https://media.themoviedb.org/t/p/w780/a.jpg');
  });

  it('경로가 없으면 빈 문자열', () => {
    expect(tmdbImageUrl(null)).toBe('');
  });
});

describe('movieToCard / tvToCard', () => {
  it('영화의 title, release_date를 공통 필드로 변환한다', () => {
    expect(movieToCard(movie)).toMatchObject({
      mediaType: 'movie',
      title: '영화',
      releaseDate: '2025-05-01',
      rating: 7.5,
    });
  });

  it('TV의 name, first_air_date를 공통 필드로 변환한다', () => {
    expect(tvToCard(tv)).toMatchObject({
      mediaType: 'tv',
      title: '드라마',
      releaseDate: '2025-03-01',
      image: '',
    });
  });
});

describe('tvDetailToContent', () => {
  it('시즌/에피소드 수와 배경 이미지를 포함한다', () => {
    const detail: TvDetail = {
      ...tv,
      genres: [{ id: 18, name: '드라마' }],
      homepage: '',
      tagline: '',
      status: 'Ended',
      number_of_seasons: 2,
      number_of_episodes: 16,
      last_air_date: null,
    };

    expect(tvDetailToContent(detail)).toMatchObject({
      numberOfSeasons: 2,
      numberOfEpisodes: 16,
      backdropUrl: 'https://media.themoviedb.org/t/p/w780/bg.jpg',
    });
  });
});
