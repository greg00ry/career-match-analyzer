/*
  # Create career analyses table

  1. New Tables
    - `career_analyses`
      - `id` (uuid, primary key) - Unique identifier for each analysis
      - `job_description` (text) - The job description text provided by user
      - `resume` (text) - The resume text provided by user
      - `match_score` (integer) - Match score between 0-100
      - `true_intent` (jsonb) - Analysis of what employer really wants
      - `gap_analysis` (jsonb) - Strengths and gaps identified
      - `quick_wins` (jsonb) - Actionable recommendations
      - `created_at` (timestamptz) - When the analysis was created
      - `user_id` (uuid, nullable) - Optional user tracking for future auth

  2. Security
    - Enable RLS on `career_analyses` table
    - Add policy for public insert (no auth required currently)
    - Add policy for users to read their own analyses (for future auth)

  3. Indexes
    - Index on created_at for chronological queries
    - Index on user_id for future user-specific queries
*/

CREATE TABLE IF NOT EXISTS career_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_description text NOT NULL,
  resume text NOT NULL,
  match_score integer NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  true_intent jsonb NOT NULL,
  gap_analysis jsonb NOT NULL,
  quick_wins jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid
);

ALTER TABLE career_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert analyses"
  ON career_analyses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read their own analyses"
  ON career_analyses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_career_analyses_created_at ON career_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_career_analyses_user_id ON career_analyses(user_id);
