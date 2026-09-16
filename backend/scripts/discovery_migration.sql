-- Run this in the Supabase SQL Editor to create the caching tables for job/course discovery.

CREATE TABLE IF NOT EXISTS discovered_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  title text, company text, location text,
  job_type text, experience text, salary text,
  jd text, skills_required text[],
  apply_url text, source text, deadline text,
  match_score int, readiness_score int,
  cached_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS discovered_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text, provider text, instructor text,
  description text, duration text, level text,
  url text, skills_covered text[],
  is_free boolean DEFAULT true, has_certificate boolean,
  language text,
  cached_at timestamptz DEFAULT now()
);

ALTER TABLE discovered_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS discovered_jobs_student ON discovered_jobs;
CREATE POLICY discovered_jobs_student ON discovered_jobs
    FOR ALL USING (auth.uid() = user_id);

ALTER TABLE discovered_courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS discovered_courses_all ON discovered_courses;
CREATE POLICY discovered_courses_all ON discovered_courses
    FOR SELECT USING (true);
DROP POLICY IF EXISTS discovered_courses_insert ON discovered_courses;
CREATE POLICY discovered_courses_insert ON discovered_courses
    FOR INSERT WITH CHECK (true);
