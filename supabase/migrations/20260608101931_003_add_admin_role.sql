/*
# Add Admin Role and Enhance Permissions

## Overview
This migration adds admin role and enhanced permission system.

## Changes
1. Add 'admin' to user_role enum
2. Add department isolation
3. Create progress_updates table
4. Create user_permissions table
5. Update RLS policies for role-based visibility
*/

-- First add admin to enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin' BEFORE 'ceo';

-- Add department columns
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS department text;

-- Create user_permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  permission_type text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  granted_by uuid REFERENCES user_profiles(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission_type, resource_type, resource_id)
);

-- Create progress_updates table
CREATE TABLE IF NOT EXISTS progress_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  update_type text NOT NULL DEFAULT 'progress' CHECK (update_type IN ('progress', 'note', 'report', 'milestone', 'issue')),
  title text NOT NULL,
  content text,
  progress_before int,
  progress_after int,
  attachment_url text,
  attachment_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (project_id IS NOT NULL OR task_id IS NOT NULL)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_progress_updates_project ON progress_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_progress_updates_task ON progress_updates(task_id);
CREATE INDEX IF NOT EXISTS idx_progress_updates_user ON progress_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);

-- Enable RLS
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_updates ENABLE ROW LEVEL SECURITY;

-- Add tracking columns
ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_updated_by uuid REFERENCES user_profiles(id);