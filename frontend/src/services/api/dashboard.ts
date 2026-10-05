import { apiClient } from './client';
import type { DashboardOverview } from '@/types/dashboard';

export const dashboardApi = {
  getOverview: () => apiClient.get<DashboardOverview>('/dashboard/overview'),
};
