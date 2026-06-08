/*
# Security Fixes Part 2: RLS Policies

## Overview
Fix RLS policies that were using `true` which bypasses security:
1. activity_log - limit to authenticated users inserting their own entries
2. kpis - limit to project owners
3. notifications - limit to legitimate user references
4. task_dependencies - limit to task owners

## RLS Policies Fixed
- activity_log: INSERT policy
- kpis: INSERT, UPDATE, DELETE policies
- notifications: INSERT policy
- task_dependencies: INSERT, DELETE policies
*/

-- Fix activity_log INSERT policy
DROP POLICY IF EXISTS "log_insert_auth" ON activity_log;
DROP POLICY IF EXISTS "log_insert_authenticated" ON activity_log;
CREATE POLICY "log_insert_own" ON activity_log FOR INSERT
  TO authenticated WITH CHECK (
    user_id = (SELECT id FROM user_profiles WHERE user_id = auth.uid())
    OR user_id IS NULL
  );

-- Fix kpis policies
DROP POLICY IF EXISTS "kpis_insert_auth" ON kpis;
DROP POLICY IF EXISTS "kpis_insert_project_owner" ON kpis;
CREATE POLICY "kpis_insert_project_access" ON kpis FOR INSERT
  TO authenticated WITH CHECK (
    -- User must have access to the project
    project_id IS NULL
    OR EXISTS (
      SELECT 1 FROM projects p
      JOIN user_profiles up ON up.user_id = auth.uid()
      WHERE p.id = kpis.project_id
      AND (
        up.role IN ('admin', 'ceo', 'monitoring_officer')
        OR p.owner_id = up.id
        OR p.created_by = up.id
      )
    )
  );

DROP POLICY IF EXISTS "kpis_update_auth" ON kpis;
DROP POLICY IF EXISTS "kpis_update_project_owner" ON kpis;
CREATE POLICY "kpis_update_project_access" ON kpis FOR UPDATE
  TO authenticated USING (
    project_id IS NULL
    OR EXISTS (
      SELECT 1 FROM projects p
      JOIN user_profiles up ON up.user_id = auth.uid()
      WHERE p.id = kpis.project_id
      AND (
        up.role IN ('admin', 'ceo', 'monitoring_officer')
        OR p.owner_id = up.id
        OR p.created_by = up.id
      )
    )
  ) WITH CHECK (
    project_id IS NULL
    OR EXISTS (
      SELECT 1 FROM projects p
      JOIN user_profiles up ON up.user_id = auth.uid()
      WHERE p.id = kpis.project_id
      AND (
        up.role IN ('admin', 'ceo', 'monitoring_officer')
        OR p.owner_id = up.id
        OR p.created_by = up.id
      )
    )
  );

DROP POLICY IF EXISTS "kpis_delete_auth" ON kpis;
DROP POLICY IF EXISTS "kpis_delete_project_owner" ON kpis;
CREATE POLICY "kpis_delete_project_access" ON kpis FOR DELETE
  TO authenticated USING (
    project_id IS NULL
    OR EXISTS (
      SELECT 1 FROM projects p
      JOIN user_profiles up ON up.user_id = auth.uid()
      WHERE p.id = kpis.project_id
      AND (
        up.role IN ('admin', 'ceo')
        OR p.owner_id = up.id
        OR p.created_by = up.id
      )
    )
  );

-- Fix notifications INSERT policy
DROP POLICY IF EXISTS "notifications_insert_auth" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_system" ON notifications;
CREATE POLICY "notifications_insert_valid_user" ON notifications FOR INSERT
  TO authenticated WITH CHECK (
    -- The user_id must exist in user_profiles
    EXISTS (SELECT 1 FROM user_profiles WHERE id = notifications.user_id)
  );

-- Fix task_dependencies policies
DROP POLICY IF EXISTS "deps_insert_auth" ON task_dependencies;
DROP POLICY IF EXISTS "deps_insert_task_owner" ON task_dependencies;
CREATE POLICY "deps_insert_task_access" ON task_dependencies FOR INSERT
  TO authenticated WITH CHECK (
    -- User must have access to both tasks
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN user_profiles up ON up.user_id = auth.uid()
      WHERE t.id = task_dependencies.task_id
      AND (
        up.role IN ('admin', 'ceo', 'monitoring_officer')
        OR t.created_by = up.id
        OR t.assigned_to = up.id
      )
    )
    AND EXISTS (
      SELECT 1 FROM tasks t
      JOIN user_profiles up ON up.user_id = auth.uid()
      WHERE t.id = task_dependencies.depends_on_task_id
      AND (
        up.role IN ('admin', 'ceo', 'monitoring_officer')
        OR t.created_by = up.id
        OR t.assigned_to = up.id
      )
    )
  );

DROP POLICY IF EXISTS "deps_delete_auth" ON task_dependencies;
DROP POLICY IF EXISTS "deps_delete_task_owner" ON task_dependencies;
CREATE POLICY "deps_delete_task_access" ON task_dependencies FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN user_profiles up ON up.user_id = auth.uid()
      WHERE t.id = task_dependencies.task_id
      AND (
        up.role IN ('admin', 'ceo')
        OR t.created_by = up.id
        OR t.assigned_to = up.id
      )
    )
  );

-- Fix progress_updates INSERT policy (add proper check)
DROP POLICY IF EXISTS "progress_insert_own" ON progress_updates;
CREATE POLICY "progress_insert_own" ON progress_updates FOR INSERT
  TO authenticated WITH CHECK (
    user_id = (SELECT id FROM user_profiles WHERE user_id = auth.uid())
  );