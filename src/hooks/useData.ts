import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type {
  Project,
  Task,
  StrategicTrack,
  UserProfile,
  Comment,
  Notification,
  KPI,
  ActivityLog,
  ProjectStatus,
  TaskStatus,
  ProgressUpdate,
  UserPermission,
} from '../types/database';
import { useAuth } from '../contexts/AuthContext';

export function useStrategicTracks() {
  return useQuery({
    queryKey: ['strategic-tracks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('strategic_tracks')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as StrategicTrack[];
    },
  });
}

export function useProjects(trackId?: string, status?: ProjectStatus) {
  return useQuery({
    queryKey: ['projects', trackId, status],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select(`
          *,
          strategic_track:strategic_tracks(id, name_ar, name_en, color, icon),
          owner:user_profiles(id, full_name_ar, role)
        `)
        .order('created_at', { ascending: false });

      if (trackId) {
        query = query.eq('strategic_track_id', trackId);
      }
      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as (Project & { strategic_track: StrategicTrack; owner: UserProfile })[];
    },
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          strategic_track:strategic_tracks(*),
          owner:user_profiles(id, full_name_ar, role)
        `)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (project: Partial<Project>) => {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...project,
          code: project.code || `PRJ-${Date.now()}`,
          created_by: profile?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Project> }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.id] });
    },
  });
}

export function useTasks(projectId?: string, assignedToId?: string, status?: TaskStatus) {
  return useQuery({
    queryKey: ['tasks', projectId, assignedToId, status],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          assignee:user_profiles!assigned_to(id, full_name_ar, role),
          delegator:user_profiles!delegated_by(id, full_name_ar, role),
          project:projects(id, name_ar, code, status)
        `)
        .order('due_date', { ascending: true });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      if (assignedToId) {
        query = query.eq('assigned_to', assignedToId);
      }
      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Task[];
    },
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:user_profiles!assigned_to(*),
          delegator:user_profiles!delegated_by(*),
          project:projects(*),
          dependencies:task_dependencies!task_id(
            id,
            depends_on_task_id,
            dependency_type,
            depends_on_task:tasks!depends_on_task_id(id, title_ar, status, due_date)
          )
        `)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (task: Partial<Task>) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...task,
          code: task.code || `TSK-${Date.now()}`,
          created_by: profile?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.project_id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      // Log the activity
      await supabase.from('activity_log').insert({
        action: 'update',
        entity_type: 'task',
        entity_id: id,
        details: updates,
      });

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useApproveTask() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean; reason?: string }) => {
      const updates = approved
        ? {
            requires_approval: false,
            approved_by: profile?.id,
            approved_at: new Date().toISOString(),
            status: 'completed' as TaskStatus,
          }
        : {
            requires_approval: false,
            rejection_reason: 'يرجى مراجعة السبب',
            status: 'in_progress' as TaskStatus,
          };

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', variables.id] });
    },
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('is_active', true)
        .order('full_name_ar');
      if (error) throw error;
      return data as UserProfile[];
    },
  });
}

export function useComments(projectId?: string, taskId?: string) {
  return useQuery({
    queryKey: ['comments', projectId, taskId],
    queryFn: async () => {
      let query = supabase
        .from('comments')
        .select(`
          *,
          user:user_profiles(id, full_name_ar, role)
        `)
        .order('created_at', { ascending: true });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      if (taskId) {
        query = query.eq('task_id', taskId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as (Comment & { user: UserProfile })[];
    },
    enabled: !!(projectId || taskId),
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (comment: { content: string; project_id?: string; task_id?: string; is_official_note?: boolean }) => {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          ...comment,
          user_id: profile?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      if (variables.project_id) {
        queryClient.invalidateQueries({ queryKey: ['comments', variables.project_id] });
      }
      if (variables.task_id) {
        queryClient.invalidateQueries({ queryKey: ['comments', undefined, variables.task_id] });
      }
    },
  });
}

export function useNotifications() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['notifications', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!profile,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useKPIs(projectId?: string) {
  return useQuery({
    queryKey: ['kpis', projectId],
    queryFn: async () => {
      let query = supabase.from('kpis').select('*');
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as KPI[];
    },
  });
}

export function useUpdateKPI() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, actual_value }: { id: string; actual_value: number }) => {
      const { data, error } = await supabase
        .from('kpis')
        .update({ actual_value, last_measured_date: new Date().toISOString().split('T')[0] })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
    },
  });
}

export function useActivityLog(entityType?: string, entityId?: string) {
  return useQuery({
    queryKey: ['activity-log', entityType, entityId],
    queryFn: async () => {
      let query = supabase
        .from('activity_log')
        .select(`
          *,
          user:user_profiles(id, full_name_ar, role)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }
      if (entityId) {
        query = query.eq('entity_id', entityId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as (ActivityLog & { user: UserProfile })[];
    },
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [projectsResult, tasksResult, tracksResult] = await Promise.all([
        supabase.from('projects').select('status, progress_percentage, strategic_track_id'),
        supabase.from('tasks').select('status, priority, due_date, progress_percentage'),
        supabase.from('strategic_tracks').select('id, name_ar, color'),
      ]);

      if (projectsResult.error) throw projectsResult.error;
      if (tasksResult.error) throw tasksResult.error;
      if (tracksResult.error) throw tracksResult.error;

      const projects = projectsResult.data;
      const tasks = tasksResult.data;
      const tracks = tracksResult.data;

      const totalProjects = projects.length;
      const completedProjects = projects.filter(p => p.status === 'completed').length;
      const criticalProjects = projects.filter(p => p.status === 'critical').length;
      const atRiskProjects = projects.filter(p => p.status === 'at_risk').length;
      const onTrackProjects = projects.filter(p => p.status === 'on_track').length;

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const delayedTasks = tasks.filter(t => t.status === 'delayed').length;
      const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;

      const trackStats = tracks.map(track => {
        const trackProjects = projects.filter(p => p.strategic_track_id === track.id);
        const avgProgress = trackProjects.length > 0
          ? Math.round(trackProjects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / trackProjects.length)
          : 0;
        return {
          ...track,
          projectCount: trackProjects.length,
          avgProgress,
          critical: trackProjects.filter(p => p.status === 'critical').length,
          atRisk: trackProjects.filter(p => p.status === 'at_risk').length,
        };
      });

      return {
        totalProjects,
        completedProjects,
        criticalProjects,
        atRiskProjects,
        onTrackProjects,
        totalTasks,
        completedTasks,
        delayedTasks,
        urgentTasks,
        avgProjectProgress: totalProjects > 0
          ? Math.round(projects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / totalProjects)
          : 0,
        trackStats,
      };
    },
  });
}

// Progress updates hooks
export function useProgressUpdates(projectId?: string, taskId?: string) {
  return useQuery({
    queryKey: ['progress-updates', projectId, taskId],
    queryFn: async () => {
      let query = supabase
        .from('progress_updates')
        .select(`
          *,
          user:user_profiles(id, full_name_ar, role)
        `)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      if (taskId) {
        query = query.eq('task_id', taskId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as (ProgressUpdate & { user: UserProfile })[];
    },
    enabled: !!(projectId || taskId),
  });
}

export function useCreateProgressUpdate() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (update: {
      project_id?: string;
      task_id?: string;
      update_type: 'progress' | 'note' | 'report' | 'milestone' | 'issue';
      title: string;
      content?: string;
      progress_before?: number;
      progress_after?: number;
      attachment_url?: string;
      attachment_type?: string;
    }) => {
      const { data, error } = await supabase
        .from('progress_updates')
        .insert({
          ...update,
          user_id: profile?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      if (variables.project_id) {
        queryClient.invalidateQueries({ queryKey: ['progress-updates', variables.project_id] });
        queryClient.invalidateQueries({ queryKey: ['project', variables.project_id] });
      }
      if (variables.task_id) {
        queryClient.invalidateQueries({ queryKey: ['progress-updates', undefined, variables.task_id] });
        queryClient.invalidateQueries({ queryKey: ['task', variables.task_id] });
      }
    },
  });
}

// User permissions hooks (admin only)
export function useUserPermissions(userId?: string) {
  return useQuery({
    queryKey: ['user-permissions', userId],
    queryFn: async () => {
      let query = supabase.from('user_permissions').select('*');
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as UserPermission[];
    },
  });
}

export function useGrantPermission() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      userId,
      permissionType,
      resourceType,
      resourceId,
    }: {
      userId: string;
      permissionType: string;
      resourceType: string;
      resourceId?: string;
    }) => {
      const { data, error } = await supabase.from('user_permissions').insert({
        user_id: userId,
        permission_type: permissionType,
        resource_type: resourceType,
        resource_id: resourceId,
        granted_by: profile?.id,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
    },
  });
}

export function useRevokePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (permissionId: string) => {
      const { error } = await supabase
        .from('user_permissions')
        .delete()
        .eq('id', permissionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
    },
  });
}

// Update user profile (admin only)
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<UserProfile> }) => {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Deactivate user (admin only)
export function useDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: false })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
