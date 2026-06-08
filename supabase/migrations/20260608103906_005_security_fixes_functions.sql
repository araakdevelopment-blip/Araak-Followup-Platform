/*
# Security Fixes Part 1: Functions

## Overview
Fix function security issues:
1. Set immutable search_path for SECURITY DEFINER functions
2. Change to SECURITY INVOKER where appropriate
3. Revoke EXECUTE from anon

## Functions Updated
- update_updated_at_column
- get_user_role (changed to text return)
- calculate_project_status
- calculate_task_status
- get_current_user_role
- update_project_progress
*/

-- Fix update_updated_at_column
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY INVOKER
SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Revoke from anon
REVOKE EXECUTE ON FUNCTION update_updated_at_column() FROM anon;

-- Fix get_user_role (return text instead of enum type to avoid issues)
DROP FUNCTION IF EXISTS get_user_role(uuid) CASCADE;
CREATE FUNCTION get_user_role(check_user_id uuid)
RETURNS text 
SECURITY INVOKER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
  r text;
BEGIN
  SELECT role::text INTO r FROM user_profiles WHERE user_id = check_user_id;
  RETURN COALESCE(r, 'monitoring_officer');
END;
$$ LANGUAGE plpgsql;

REVOKE EXECUTE ON FUNCTION get_user_role(uuid) FROM anon;

-- Fix calculate_project_status
DROP FUNCTION IF EXISTS calculate_project_status(uuid) CASCADE;
CREATE FUNCTION calculate_project_status(proj_id uuid)
RETURNS text 
SECURITY INVOKER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
  proj_status text;
  overdue_tasks int;
  at_risk_tasks int;
  progress int;
  target_date date;
BEGIN
  SELECT p.status::text, p.progress_percentage, p.target_end_date 
  INTO proj_status, progress, target_date
  FROM projects p WHERE p.id = proj_id;
  
  IF proj_status IS NULL THEN
    RETURN 'on_track';
  END IF;
  
  SELECT COUNT(*) INTO overdue_tasks FROM tasks 
  WHERE tasks.project_id = proj_id 
  AND status = 'delayed';
  
  SELECT COUNT(*) INTO at_risk_tasks FROM tasks 
  WHERE tasks.project_id = proj_id 
  AND due_date < CURRENT_DATE + INTERVAL '2 days' 
  AND status NOT IN ('completed', 'cancelled');
  
  IF proj_status IN ('completed', 'cancelled', 'postponed') THEN
    RETURN proj_status;
  ELSIF overdue_tasks > 0 OR (target_date < CURRENT_DATE AND progress < 100) THEN
    RETURN 'critical';
  ELSIF at_risk_tasks > 0 OR target_date < CURRENT_DATE + INTERVAL '7 days' THEN
    RETURN 'at_risk';
  ELSE
    RETURN 'on_track';
  END IF;
END;
$$ LANGUAGE plpgsql;

REVOKE EXECUTE ON FUNCTION calculate_project_status(uuid) FROM anon;

-- Fix calculate_task_status
DROP FUNCTION IF EXISTS calculate_task_status(uuid) CASCADE;
CREATE FUNCTION calculate_task_status(tsk_id uuid)
RETURNS text 
SECURITY INVOKER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
  task_rec RECORD;
  new_status text;
BEGIN
  SELECT * INTO task_rec FROM tasks WHERE id = tsk_id;
  
  IF task_rec.id IS NULL THEN
    RETURN 'pending';
  END IF;
  
  IF task_rec.status IN ('completed', 'cancelled', 'postponed') THEN
    RETURN task_rec.status::text;
  END IF;
  
  IF task_rec.progress_percentage = 100 THEN
    new_status := 'completed';
  ELSIF task_rec.due_date < CURRENT_DATE THEN
    new_status := 'delayed';
  ELSIF task_rec.progress_percentage > 0 THEN
    new_status := 'in_progress';
  ELSE
    new_status := 'pending';
  END IF;
  
  RETURN new_status;
END;
$$ LANGUAGE plpgsql;

REVOKE EXECUTE ON FUNCTION calculate_task_status(uuid) FROM anon;

-- Fix get_current_user_role
DROP FUNCTION IF EXISTS get_current_user_role() CASCADE;
CREATE FUNCTION get_current_user_role()
RETURNS text 
SECURITY INVOKER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
  r text;
BEGIN
  SELECT role::text INTO r FROM user_profiles WHERE user_id = auth.uid();
  RETURN COALESCE(r, 'monitoring_officer');
END;
$$ LANGUAGE plpgsql;

REVOKE EXECUTE ON FUNCTION get_current_user_role() FROM anon;

-- Fix update_project_progress
DROP FUNCTION IF EXISTS update_project_progress() CASCADE;
CREATE FUNCTION update_project_progress()
RETURNS TRIGGER 
SECURITY INVOKER
SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
  UPDATE projects 
  SET progress_percentage = (
    SELECT COALESCE(AVG(progress_percentage), 0)::int
    FROM tasks 
    WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
    AND status NOT IN ('cancelled')
  ),
  updated_at = now()
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

REVOKE EXECUTE ON FUNCTION update_project_progress() FROM anon;