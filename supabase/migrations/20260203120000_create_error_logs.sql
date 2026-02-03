/*
  # Create error logs table

  1. New Tables
    - `error_logs`
      - `id` (uuid, primary key)
      - `error_message` (text) - Error message
      - `error_stack` (text) - Stack trace
      - `error_type` (text) - Type: api, parsing, validation, unknown
      - `context` (jsonb) - Additional context data
      - `user_agent` (text) - Browser user agent
      - `url` (text) - URL where error occurred
      - `created_at` (timestamptz) - When error was logged

  2. Security
    - Enable RLS
    - Allow public insert (for logging)
    - Restrict read to authenticated users only
*/

CREATE TABLE IF NOT EXISTS error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_message text NOT NULL,
  error_stack text,
  error_type text NOT NULL CHECK (error_type IN ('api', 'parsing', 'validation', 'unknown')),
  context jsonb DEFAULT '{}',
  user_agent text,
  url text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert errors (for logging)
CREATE POLICY "Anyone can insert error logs"
  ON error_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users can view logs (admin feature)
CREATE POLICY "Authenticated users can view error logs"
  ON error_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Index for querying by date
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);

-- Index for filtering by type
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);
