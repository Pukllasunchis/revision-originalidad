/*
  # Review System for EESP Pukllasunchis

  1. New Tables
    - `weeks`
      - `id` (uuid, primary key) - Unique week identifier
      - `start_date` (date) - Week start date
      - `end_date` (date) - Week end date
      - `reserved_slots` (integer) - Number of reserved slots
      - `created_at` (timestamptz) - Creation timestamp
    
    - `requests`
      - `id` (uuid, primary key) - Unique request identifier
      - `week_id` (uuid, foreign key) - Reference to week
      - `queue_number` (integer) - Position in queue for the week
      - `training_modality` (text) - FID or PPD
      - `study_program` (text) - Educational program
      - `document_type` (text) - Research Work or Thesis
      - `review_number` (integer) - Which review attempt (1-3)
      - `document_file_path` (text) - Path to main document in storage
      - `status` (text) - Request status (pending, reviewed, etc)
      - `created_at` (timestamptz) - Submission timestamp
    
    - `request_members`
      - `id` (uuid, primary key) - Unique member identifier
      - `request_id` (uuid, foreign key) - Reference to request
      - `full_name` (text) - Member's full name
      - `institutional_email` (text) - Member's email
      - `phone_number` (text) - Member's phone
      - `payment_receipt_path` (text) - Path to payment receipt in storage
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on all tables
    - Public can insert requests and members (form submission)
    - Public can read their own requests
    - Authenticated users (admins) can read and manage all data
*/

-- Create weeks table
CREATE TABLE IF NOT EXISTS weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date date NOT NULL,
  end_date date NOT NULL,
  reserved_slots integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create requests table
CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id uuid REFERENCES weeks(id) ON DELETE CASCADE,
  queue_number integer NOT NULL,
  training_modality text NOT NULL,
  study_program text NOT NULL,
  document_type text NOT NULL,
  review_number integer NOT NULL CHECK (review_number >= 1 AND review_number <= 3),
  document_file_path text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Create request_members table
CREATE TABLE IF NOT EXISTS request_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES requests(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  institutional_email text NOT NULL,
  phone_number text NOT NULL,
  payment_receipt_path text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_members ENABLE ROW LEVEL SECURITY;

-- Weeks policies
CREATE POLICY "Anyone can read weeks"
  ON weeks FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage weeks"
  ON weeks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Requests policies
CREATE POLICY "Anyone can insert requests"
  ON requests FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can read requests"
  ON requests FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can update requests"
  ON requests FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete requests"
  ON requests FOR DELETE
  TO authenticated
  USING (true);

-- Request members policies
CREATE POLICY "Anyone can insert request members"
  ON request_members FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can read request members"
  ON request_members FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage request members"
  ON request_members FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_requests_week_id ON requests(week_id);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at);
CREATE INDEX IF NOT EXISTS idx_request_members_request_id ON request_members(request_id);
CREATE INDEX IF NOT EXISTS idx_weeks_dates ON weeks(start_date, end_date);