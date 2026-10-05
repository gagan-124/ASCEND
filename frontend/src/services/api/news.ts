import { apiClient } from './client';
import type { NewsArticle } from '@/types/news';

export const newsApi = {
  getArticles: () => apiClient.get<NewsArticle[]>('/news'),
};
