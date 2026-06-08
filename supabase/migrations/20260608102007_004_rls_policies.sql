/*
# Update RLS Policies for Role-Based Visibility

## Overview
This migration updates RLS policies for role-based data visibility:
- Admin/CEO/monitoring_officer: Full access
- Deputy Investment: Investment track only
- Deputy Development: Development tracks only
- Development Manager: Own projects only
- All users can create projects/tasks
*/

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS text AS $$
DECLARE
  r text;
BEGIN
  SELECT role::text INTO r FROM user_profiles WHERE user_id = auth.uid();
  RETURN COALESCE(r, 'monitoring_officer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop old policies
DROP POLICY IF EXISTS "projects_read_all" ON projects;
DROP POLICY IF EXISTS "projects_insert_auth" ON projects;
DROP POLICY IF EXISTS "projects_update_auth" ON projects;
DROP POLICY IF EXISTS "projects_delete_ceo" ON projects;
DROP POLICY IF EXISTS "tasks_read_all" ON tasks;
DROP POLICY IF EXISTS "tasks_insert_auth" ON tasks;
DROP POLICY IF EXISTS "tasks_update_auth" ON tasks;
DROP POLICY IF EXISTS "tasks_delete_owner" ON tasks;

-- Projects SELECT policy
CREATE POLICY "projects_select_role_based" ON projects FOR SELECT
  TO authenticated USING (
    get_current_user_role() IN ('admin', 'ceo', 'monitoring_officer')
    OR
    (get_current_user_role() = 'deputy_investment'
     AND strategic_track_id IN (SELECT id FROM strategic_tracks WHERE name_ar LIKE '%استثمار%' OR name_ar LIKE '%شراكات%'))
    OR
    (get_current_user_role() = 'deputy_development'
     AND strategic_track_id IN (SELECT id FROM strategic_tracks WHERE name_ar LIKE '%تنمي%' OR name_ar LIKE '%أكاديمي%' OR name_ar LIKE '%دعم%' OR name_ar LIKE '%رقمي%'))
    OR
    (get_current_user_role() = 'development_manager'
     AND (owner_id = (SELECT id FROM user_profiles WHERE user_id = auth.uid())
          OR created_by = (SELECT id FROM user_profiles WHERE user_id = auth.uid())))
  );

-- Projects INSERT policy - all authenticated users
CREATE POLICY "projects_insert_all" ON projects FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND is_active = true)
  );

-- Projects UPDATE policy
CREATE POLICY "projects_update_role_based" ON projects FOR UPDATE
  TO authenticated USING (
    get_current_user_role() IN ('admin', 'ceo', 'monitoring_officer')
    OR owner_id = (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    OR created_by = (SELECT id FROM user_profiles WHERE user_id = auth.uid())
  );

-- Projects DELETE policy
CREATE POLICY "projects_delete_admin" ON projects FOR DELETE
  TO authenticated USING (
    get_current_user_role() IN ('admin', 'ceo')
  );

-- Tasks SELECT policy
CREATE POLICY "tasks_select_role_based" ON tasks FOR SELECT
  TO authenticated USING (
    get_current_user_role() IN ('admin', 'ceo', 'monitoring_officer')
    OR
    (get_current_user_role() = 'deputy_investment'
     AND project_id IN (SELECT id FROM projects WHERE strategic_track_id IN (SELECT id FROM strategic_tracks WHERE name_ar LIKE '%استثمار%' OR name_ar LIKE '%شراكات%')))
    OR
    (get_current_user_role() = 'deputy_development'
     AND project_id IN (SELECT id FROM projects WHERE strategic_track_id IN (SELECT id FROM strategic_tracks WHERE name_ar LIKE '%تنمي%' OR name_ar LIKE '%أكاديمي%' OR name_ar LIKE '%دعم%' OR name_ar LIKE '%رقمي%')))
    OR
    assigned_to = (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    OR delegated_by = (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    OR created_by = (SELECT id FROM user_profiles WHERE user_id = auth.uid())
  );

-- Tasks INSERT policy
CREATE POLICY "tasks_insert_all" ON tasks FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND is_active = true)
  );

-- Tasks UPDATE policy
CREATE POLICY "tasks_update_role_based" ON tasks FOR UPDATE
  TO authenticated USING (
    assigned_to = (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    OR created_by = (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    OR get_current_user_role() IN ('admin', 'ceo', 'monitoring_officer')
  );

-- Tasks DELETE policy
CREATE POLICY "tasks_delete_role_based" ON tasks FOR DELETE
  TO authenticated USING (
    get_current_user_role() IN ('admin', 'ceo')
    OR created_by = (SELECT id FROM user_profiles WHERE user_id = auth.uid())
  );

-- Progress updates policies
CREATE POLICY "progress_read_accessible" ON progress_updates FOR SELECT
  TO authenticated USING (
    project_id IN (SELECT id FROM projects)
    OR task_id IN (SELECT id FROM tasks)
  );

CREATE POLICY "progress_insert_own" ON progress_updates FOR INSERT
  TO authenticated WITH CHECK (
    user_id = (SELECT id FROM user_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "progress_update_own" ON progress_updates FOR UPDATE
  TO authenticated USING (
    user_id = (SELECT id FROM user_profiles WHERE user_id = auth.uid())
  );

-- User permissions policies
CREATE POLICY "permissions_admin" ON user_permissions FOR ALL
  TO authenticated USING (
    get_current_user_role() = 'admin'
    OR user_id = (SELECT id FROM user_profiles WHERE user_id = auth.uid())
  );