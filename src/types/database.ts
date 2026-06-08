export type UserRole =
  | 'admin'
  | 'ceo'
  | 'deputy_development'
  | 'deputy_investment'
  | 'development_manager'
  | 'monitoring_officer';

export type ProjectStatus =
  | 'on_track'
  | 'at_risk'
  | 'critical'
  | 'completed'
  | 'postponed'
  | 'cancelled';

export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'delayed'
  | 'postponed'
  | 'cancelled'
  | 'awaiting_approval';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name_ar: string;
  full_name_en?: string;
  role: UserRole;
  department?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StrategicTrack {
  id: string;
  name_ar: string;
  name_en?: string;
  description?: string;
  color?: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  code: string;
  name_ar: string;
  name_en?: string;
  description?: string;
  strategic_track_id?: string;
  owner_id?: string;
  status: ProjectStatus;
  progress_percentage: number;
  start_date: string;
  target_end_date: string;
  actual_end_date?: string;
  budget?: number;
  spent_amount?: number;
  notes?: string;
  ceo_notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  strategic_track?: StrategicTrack;
  owner?: UserProfile;
}

export interface Task {
  id: string;
  code: string;
  project_id: string;
  parent_task_id?: string;
  title_ar: string;
  title_en?: string;
  description?: string;
  assigned_to?: string;
  delegated_by?: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress_percentage: number;
  start_date: string;
  due_date: string;
  completed_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  requires_approval: boolean;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  assignee?: UserProfile;
  delegator?: UserProfile;
  project?: Project;
}

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: string;
  created_at: string;
}

export interface Comment {
  id: string;
  project_id?: string;
  task_id?: string;
  user_id: string;
  content: string;
  is_official_note: boolean;
  created_at: string;
  updated_at: string;
  user?: UserProfile;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: UserProfile;
}

export interface Notification {
  id: string;
  user_id: string;
  title_ar: string;
  title_en?: string;
  message_ar: string;
  message_en?: string;
  type: string;
  entity_type?: string;
  entity_id?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface KPI {
  id: string;
  project_id?: string;
  name_ar: string;
  name_en?: string;
  description?: string;
  target_value: number;
  actual_value: number;
  unit?: string;
  measurement_frequency?: string;
  last_measured_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ProgressUpdate {
  id: string;
  project_id?: string;
  task_id?: string;
  user_id: string;
  update_type: 'progress' | 'note' | 'report' | 'milestone' | 'issue';
  title: string;
  content?: string;
  progress_before?: number;
  progress_after?: number;
  attachment_url?: string;
  attachment_type?: string;
  created_at: string;
  user?: UserProfile;
}

export interface UserPermission {
  id: string;
  user_id: string;
  permission_type: string;
  resource_type: string;
  resource_id?: string;
  granted_by?: string;
  granted_at: string;
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  on_track: 'يسير وفق الخطة',
  at_risk: 'معرض للخطر',
  critical: 'حرج',
  completed: 'مكتمل',
  postponed: 'مؤجل',
  cancelled: 'ملغي',
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, { bg: string; text: string; dot: string }> = {
  on_track: { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  at_risk: { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
  critical: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
  completed: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  postponed: { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'قيد الانتظار',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتمل',
  delayed: 'متأخر',
  postponed: 'مؤجل',
  cancelled: 'ملغي',
  awaiting_approval: 'بانتظار الاعتماد',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
  urgent: 'عاجلة',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'مدير النظام',
  ceo: 'الرئيس التنفيذي',
  deputy_development: 'نائب قطاع التنمية',
  deputy_investment: 'نائب قطاع الاستثمار',
  development_manager: 'مدير قطاع التنمية',
  monitoring_officer: 'مسؤول المتابعة التنفيذية',
};
