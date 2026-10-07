import axios from 'axios';
import type { Mold, MaintenancePlan, MaintenanceRecord, Repair, SparePart, Alert, PageResult, PartsUsage } from '../types';

const api = axios.create({ baseURL: '/api' });

export const moldApi = {
  list: (params?: Record<string, any>) => api.get<PageResult<Mold>>('/molds', { params }).then(r => r.data),
  get: (id: number) => api.get<Mold>(`/molds/${id}`).then(r => r.data),
  create: (data: Partial<Mold>) => api.post<Mold>('/molds', data).then(r => r.data),
  update: (id: number, data: Partial<Mold>) => api.put<Mold>(`/molds/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/molds/${id}`).then(r => r.data),
  categories: () => api.get<string[]>('/molds/categories').then(r => r.data),
};

export const maintenanceApi = {
  listPlans: (params?: Record<string, any>) => api.get<PageResult<MaintenancePlan>>('/maintenance/plans', { params }).then(r => r.data),
  createPlan: (data: Partial<MaintenancePlan>) => api.post<MaintenancePlan>('/maintenance/plans', data).then(r => r.data),
  updatePlan: (id: number, data: Partial<MaintenancePlan>) => api.put<MaintenancePlan>(`/maintenance/plans/${id}`, data).then(r => r.data),
  deletePlan: (id: number) => api.delete(`/maintenance/plans/${id}`).then(r => r.data),
  listRecords: (params?: Record<string, any>) => api.get<PageResult<MaintenanceRecord>>('/maintenance/records', { params }).then(r => r.data),
  createRecord: (data: Partial<MaintenanceRecord>) => api.post<MaintenanceRecord>('/maintenance/records', data).then(r => r.data),
  deleteRecord: (id: number) => api.delete(`/maintenance/records/${id}`).then(r => r.data),
};

export const repairApi = {
  list: (params?: Record<string, any>) => api.get<PageResult<Repair>>('/repairs', { params }).then(r => r.data),
  get: (id: number) => api.get<Repair & { parts_usage: PartsUsage[] }>(`/repairs/${id}`).then(r => r.data),
  create: (data: Partial<Repair>) => api.post<Repair>('/repairs', data).then(r => r.data),
  update: (id: number, data: Partial<Repair>) => api.put<Repair>(`/repairs/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/repairs/${id}`).then(r => r.data),
};

export const partsApi = {
  list: (params?: Record<string, any>) => api.get<PageResult<SparePart>>('/parts', { params }).then(r => r.data),
  get: (id: number) => api.get<SparePart>(`/parts/${id}`).then(r => r.data),
  create: (data: Partial<SparePart>) => api.post<SparePart>('/parts', data).then(r => r.data),
  update: (id: number, data: Partial<SparePart>) => api.put<SparePart>(`/parts/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/parts/${id}`).then(r => r.data),
  categories: () => api.get<string[]>('/parts/categories').then(r => r.data),
  addUsage: (data: { repair_id: number; part_id: number; quantity: number }) => api.post('/parts/usage', data).then(r => r.data),
  getUsage: (repairId: number) => api.get<PartsUsage[]>(`/parts/usage/${repairId}`).then(r => r.data),
};

export const dashboardApi = {
  stats: () => api.get('/dashboard/stats').then(r => r.data),
  alerts: () => api.get<Alert[]>('/dashboard/alerts').then(r => r.data),
};
