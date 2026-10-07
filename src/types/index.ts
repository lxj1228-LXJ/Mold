export interface Mold {
  id: number;
  code: string;
  name: string;
  spec: string | null;
  category: string | null;
  status: 'idle' | 'in_use' | 'maintenance' | 'repair' | 'scrapped';
  location: string | null;
  manufacturer: string | null;
  purchase_date: string | null;
  warranty_date: string | null;
  expected_life: number;
  current_life: number;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenancePlan {
  id: number;
  mold_id: number;
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  cycle_days: number;
  last_date: string | null;
  next_date: string | null;
  content: string | null;
  responsible: string | null;
  mold_code?: string;
  mold_name?: string;
  created_at: string;
}

export interface MaintenanceRecord {
  id: number;
  mold_id: number;
  plan_id: number | null;
  maintenance_date: string;
  type: string;
  content: string | null;
  operator: string | null;
  result: string | null;
  cost: number;
  next_date: string | null;
  mold_code?: string;
  mold_name?: string;
  created_at: string;
}

export interface Repair {
  id: number;
  mold_id: number;
  report_date: string;
  fault_description: string | null;
  fault_type: string | null;
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  repair_date: string | null;
  repair_content: string | null;
  repair_person: string | null;
  cost: number;
  status: 'pending' | 'in_progress' | 'completed' | 'verified';
  result: string | null;
  completion_date: string | null;
  mold_code?: string;
  mold_name?: string;
  parts_usage?: PartsUsage[];
  created_at: string;
}

export interface SparePart {
  id: number;
  code: string;
  name: string;
  spec: string | null;
  category: string | null;
  unit: string;
  stock: number;
  min_stock: number;
  price: number;
  supplier: string | null;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartsUsage {
  id: number;
  repair_id: number;
  part_id: number;
  quantity: number;
  part_code?: string;
  part_name?: string;
  unit?: string;
  created_at: string;
}

export interface Alert {
  type: 'maintenance_overdue' | 'maintenance_upcoming' | 'low_stock' | 'repair_overdue';
  level: 'error' | 'warning';
  alert_msg: string;
  [key: string]: any;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const MOLD_STATUS_MAP: Record<string, { label: string; color: string }> = {
  idle: { label: '空闲', color: 'default' },
  in_use: { label: '使用中', color: 'processing' },
  maintenance: { label: '保养中', color: 'warning' },
  repair: { label: '维修中', color: 'error' },
  scrapped: { label: '已报废', color: 'default' },
};

export const REPAIR_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'default' },
  in_progress: { label: '维修中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
  verified: { label: '已验收', color: 'blue' },
};

export const URGENCY_MAP: Record<string, { label: string; color: string }> = {
  low: { label: '低', color: 'default' },
  normal: { label: '一般', color: 'blue' },
  high: { label: '高', color: 'orange' },
  urgent: { label: '紧急', color: 'red' },
};

export const MAINTENANCE_TYPE_MAP: Record<string, string> = {
  daily: '日常保养',
  weekly: '周保养',
  monthly: '月保养',
  quarterly: '季度保养',
  yearly: '年度保养',
};
