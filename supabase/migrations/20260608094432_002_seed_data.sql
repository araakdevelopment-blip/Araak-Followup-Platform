/*
# Seed Initial Data

## Overview
This migration populates the database with initial strategic tracks and sample data
for the Arak Group Executive Monitoring Platform.

## Strategic Tracks Added
1. المسار الأكاديمي والتعليمي (Academic and Educational Track)
2. مسار المنصات والتحول الرقمي (Platforms and Digital Transformation Track)
3. مسار الاستثمارات والشراكات (Investments and Partnerships Track)
4. مسار الدعم والتمكين المؤسسي (Support and Institutional Enablement Track)

## Sample Projects
- Initial projects as outlined in the requirements
*/

-- Insert strategic tracks
INSERT INTO strategic_tracks (id, name_ar, name_en, description, color, icon, sort_order) VALUES
  (gen_random_uuid(), 'المسار الأكاديمي والتعليمي', 'Academic and Educational Track', 'متابعة المشاريع الأكاديمية والتعليمية بما فيها ملف الجامعة وبرامج التعليم', '#059669', 'graduation-cap', 1),
  (gen_random_uuid(), 'مسار المنصات والتحول الرقمي', 'Platforms and Digital Transformation Track', 'تطوير البنية الرقمية ومنصة التسويق "واعي" والأنظمة المركزية', '#3B82F6', 'monitor', 2),
  (gen_random_uuid(), 'مسار الاستثمارات والشراكات', 'Investments and Partnerships Track', 'إدارة الشراكات الاستراتيجية وتنمية المحفظة الاستثمارية والتنميات', '#F59E0B', 'trending-up', 3),
  (gen_random_uuid(), 'مسار الدعم والتمكين المؤسسي', 'Support and Institutional Enablement Track', 'استقطاب الكفاءات والإدارة اللوجستية والدعم التشغيلي', '#8B5CF6', 'users', 4);

-- Create a function to get user role
CREATE OR REPLACE FUNCTION get_user_role(check_user_id uuid)
RETURNS user_role AS $$
DECLARE
  user_role_val user_role;
BEGIN
  SELECT role INTO user_role_val FROM user_profiles WHERE user_id = check_user_id;
  RETURN COALESCE(user_role_val, 'monitoring_officer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to calculate project RAG status
CREATE OR REPLACE FUNCTION calculate_project_status(project_id uuid)
RETURNS project_status AS $$
DECLARE
  proj_status project_status;
  overdue_tasks int;
  at_risk_tasks int;
  total_tasks int;
  progress int;
  target_date date;
BEGIN
  SELECT p.status, p.progress_percentage, p.target_end_date INTO proj_status, progress, target_date
  FROM projects p WHERE p.id = project_id;
  
  -- Count tasks by status
  SELECT COUNT(*) INTO overdue_tasks FROM tasks 
  WHERE tasks.project_id = calculate_project_status.project_id 
  AND status = 'delayed';
  
  SELECT COUNT(*) INTO at_risk_tasks FROM tasks 
  WHERE tasks.project_id = calculate_project_status.project_id 
  AND due_date < CURRENT_DATE + INTERVAL '2 days' 
  AND status NOT IN ('completed', 'cancelled');
  
  SELECT COUNT(*) INTO total_tasks FROM tasks 
  WHERE tasks.project_id = calculate_project_status.project_id;
  
  -- Determine status
  IF proj_status = 'completed' OR proj_status = 'cancelled' OR proj_status = 'postponed' THEN
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

-- Create function to calculate task RAG status
CREATE OR REPLACE FUNCTION calculate_task_status(task_id uuid)
RETURNS task_status AS $$
DECLARE
  task_rec RECORD;
  new_status task_status;
BEGIN
  SELECT * INTO task_rec FROM tasks WHERE id = task_id;
  
  IF task_rec.status IN ('completed', 'cancelled', 'postponed') THEN
    RETURN task_rec.status;
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