/*
# Executive Monitoring Platform - Initial Schema

## Overview
This migration creates the core database structure for the Executive Monitoring Platform
for Arak Group CEO office. It supports multi-user access with role-based permissions,
project and task management, delegation workflows, KPI tracking, and RAG status system.

## New Tables

### 1. user_profiles
- Stores user roles and metadata beyond auth.users
- Roles: ceo, deputy_development, deputy_investment, development_manager, monitoring_officer
- Links to Supabase auth.users

### 2. strategic_tracks (المسارات الاستراتيجية)
- Defines the strategic workstreams (Academic, Digital, Investment, Support)
- Examples: المسار الأكاديمي, مسار التحول الرقمي, etc.

### 3. projects (المشاريع)
- Main project records with ownership, progress, and RAG status
- Linked to strategic tracks
- Includes timeline, budget, and key dates

### 4. tasks (المهام)
- Individual action items within projects
- Supports dependencies, delegation, and approval workflow
- RAG status auto-calculated based on deadlines

### 5. task_dependencies
- Links tasks that depend on each other
- Ensures proper sequencing

### 6. comments (التعليقات)
- Discussion thread on projects and tasks
- Supports executive notes and feedback

### 7. activity_log
- Audit trail of all actions
- Critical for accountability and tracking

### 8. notifications
- Alert system for users
- Supports escalation paths

## Security
- RLS enabled on all tables
- Role-based access control
- Ownership verification through policies
*/

-- User roles enum
CREATE TYPE user_role AS ENUM (
  'ceo',
  'deputy_development',
  'deputy_investment',
  'development_manager',
  'monitoring_officer'
);

-- Project status enum (RAG + additional states)
CREATE TYPE project_status AS ENUM (
  'on_track',        -- أخضر - On Track
  'at_risk',         -- أصفر - At Risk
  'critical',        -- أحمر - Critical
  'completed',       -- مكتمل
  'postponed',       -- مؤجل
  'cancelled'        -- ملغي
);

-- Task status enum
CREATE TYPE task_status AS ENUM (
  'pending',         -- قيد الانتظار
  'in_progress',     -- قيد التنفيذ
  'completed',       -- مكتمل
  'delayed',         -- متأخر
  'postponed',       -- مؤجل
  'cancelled',       -- ملغي
  'awaiting_approval' -- بانتظار الاعتماد
);

-- Task priority enum
CREATE TYPE task_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name_ar text NOT NULL,
  full_name_en text,
  role user_role NOT NULL DEFAULT 'monitoring_officer',
  department text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Strategic tracks (المسارات الاستراتيجية)
CREATE TABLE IF NOT EXISTS strategic_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text,
  description text,
  color text DEFAULT '#3B82F6',
  icon text,
  sort_order int DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Projects (المشاريع)
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name_ar text NOT NULL,
  name_en text,
  description text,
  strategic_track_id uuid REFERENCES strategic_tracks(id) ON DELETE SET NULL,
  owner_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  status project_status NOT NULL DEFAULT 'on_track',
  progress_percentage int NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  start_date date NOT NULL,
  target_end_date date NOT NULL,
  actual_end_date date,
  budget decimal(15,2),
  spent_amount decimal(15,2) DEFAULT 0,
  notes text,
  ceo_notes text,
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tasks (المهام)
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  title_ar text NOT NULL,
  title_en text,
  description text,
  assigned_to uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  delegated_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  status task_status NOT NULL DEFAULT 'pending',
  priority task_priority NOT NULL DEFAULT 'medium',
  progress_percentage int NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  start_date date NOT NULL,
  due_date date NOT NULL,
  completed_date date,
  estimated_hours decimal(6,2),
  actual_hours decimal(6,2),
  requires_approval boolean NOT NULL DEFAULT false,
  approved_by uuid REFERENCES user_profiles(id),
  approved_at timestamptz,
  rejection_reason text,
  notes text,
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Task dependencies
CREATE TABLE IF NOT EXISTS task_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type text NOT NULL DEFAULT 'finish_to_start' CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(task_id, depends_on_task_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_official_note boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (project_id IS NOT NULL OR task_id IS NOT NULL)
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title_ar text NOT NULL,
  title_en text,
  message_ar text NOT NULL,
  message_en text,
  type text NOT NULL,
  entity_type text,
  entity_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- KPIs table for metrics
CREATE TABLE IF NOT EXISTS kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name_ar text NOT NULL,
  name_en text,
  description text,
  target_value decimal(10,2) NOT NULL,
  actual_value decimal(10,2) DEFAULT 0,
  unit text,
  measurement_frequency text DEFAULT 'monthly',
  last_measured_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_track ON projects(strategic_track_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;

-- User profiles policies
DROP POLICY IF EXISTS "users_read_profiles" ON user_profiles;
CREATE POLICY "users_read_profiles" ON user_profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "users_update_own_profile" ON user_profiles;
CREATE POLICY "users_update_own_profile" ON user_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_insert_own_profile" ON user_profiles;
CREATE POLICY "users_insert_own_profile" ON user_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Strategic tracks policies (all authenticated users can read)
DROP POLICY IF EXISTS "tracks_read_all" ON strategic_tracks;
CREATE POLICY "tracks_read_all" ON strategic_tracks FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "tracks_insert_ceo" ON strategic_tracks;
CREATE POLICY "tracks_insert_ceo" ON strategic_tracks FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'ceo')
  );

DROP POLICY IF EXISTS "tracks_update_ceo" ON strategic_tracks;
CREATE POLICY "tracks_update_ceo" ON strategic_tracks FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'ceo')
  );

-- Projects policies - all authenticated can read
DROP POLICY IF EXISTS "projects_read_all" ON projects;
CREATE POLICY "projects_read_all" ON projects FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "projects_insert_auth" ON projects;
CREATE POLICY "projects_insert_auth" ON projects FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "projects_update_auth" ON projects;
CREATE POLICY "projects_update_auth" ON projects FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "projects_delete_ceo" ON projects;
CREATE POLICY "projects_delete_ceo" ON projects FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'ceo')
  );

-- Tasks policies
DROP POLICY IF EXISTS "tasks_read_all" ON tasks;
CREATE POLICY "tasks_read_all" ON tasks FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "tasks_insert_auth" ON tasks;
CREATE POLICY "tasks_insert_auth" ON tasks FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "tasks_update_auth" ON tasks;
CREATE POLICY "tasks_update_auth" ON tasks FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "tasks_delete_owner" ON tasks;
CREATE POLICY "tasks_delete_owner" ON tasks FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role IN ('ceo', 'deputy_development', 'deputy_investment'))
    OR created_by = (SELECT id FROM user_profiles WHERE user_id = auth.uid())
  );

-- Task dependencies policies
DROP POLICY IF EXISTS "deps_read_all" ON task_dependencies;
CREATE POLICY "deps_read_all" ON task_dependencies FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "deps_insert_auth" ON task_dependencies;
CREATE POLICY "deps_insert_auth" ON task_dependencies FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "deps_delete_auth" ON task_dependencies;
CREATE POLICY "deps_delete_auth" ON task_dependencies FOR DELETE
  TO authenticated USING (true);

-- Comments policies
DROP POLICY IF EXISTS "comments_read_all" ON comments;
CREATE POLICY "comments_read_all" ON comments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "comments_insert_auth" ON comments;
CREATE POLICY "comments_insert_auth" ON comments FOR INSERT
  TO authenticated WITH CHECK (
    user_id = (SELECT id FROM user_profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "comments_update_own" ON comments;
CREATE POLICY "comments_update_own" ON comments FOR UPDATE
  TO authenticated USING (
    user_id = (SELECT id FROM user_profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "comments_delete_own" ON comments;
CREATE POLICY "comments_delete_own" ON comments FOR DELETE
  TO authenticated USING (
    user_id = (SELECT id FROM user_profiles WHERE user_id = auth.uid())
  );

-- Activity log policies - read only for authenticated
DROP POLICY IF EXISTS "log_read_all" ON activity_log;
CREATE POLICY "log_read_all" ON activity_log FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "log_insert_auth" ON activity_log;
CREATE POLICY "log_insert_auth" ON activity_log FOR INSERT
  TO authenticated WITH CHECK (true);

-- Notifications policies
DROP POLICY IF EXISTS "notifications_read_own" ON notifications;
CREATE POLICY "notifications_read_own" ON notifications FOR SELECT
  TO authenticated USING (
    user_id = (SELECT id FROM user_profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated USING (
    user_id = (SELECT id FROM user_profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "notifications_insert_auth" ON notifications;
CREATE POLICY "notifications_insert_auth" ON notifications FOR INSERT
  TO authenticated WITH CHECK (true);

-- KPIs policies
DROP POLICY IF EXISTS "kpis_read_all" ON kpis;
CREATE POLICY "kpis_read_all" ON kpis FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "kpis_insert_auth" ON kpis;
CREATE POLICY "kpis_insert_auth" ON kpis FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "kpis_update_auth" ON kpis;
CREATE POLICY "kpis_update_auth" ON kpis FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "kpis_delete_auth" ON kpis;
CREATE POLICY "kpis_delete_auth" ON kpis FOR DELETE
  TO authenticated USING (true);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_profiles_updated_at') THEN
    CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_strategic_tracks_updated_at') THEN
    CREATE TRIGGER update_strategic_tracks_updated_at BEFORE UPDATE ON strategic_tracks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_projects_updated_at') THEN
    CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tasks_updated_at') THEN
    CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_comments_updated_at') THEN
    CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_kpis_updated_at') THEN
    CREATE TRIGGER update_kpis_updated_at BEFORE UPDATE ON kpis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;