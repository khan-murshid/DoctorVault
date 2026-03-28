/*
  # DoctorVault Hospital Management System - Complete Schema

  ## Overview
  This migration creates the complete database schema for DoctorVault hospital management system.
  
  ## New Tables Created
  
  ### 1. families
  Stores family information for grouping related patients
  - id (uuid, primary key)
  - family_name (text)
  - emergency_contact (text)
  - emergency_phone (text)
  - address (text)
  - created_at (timestamptz)
  
  ### 2. doctors
  Stores doctor information and shift tracking
  - id (uuid, primary key)
  - name (text)
  - specialty (text)
  - phone (text)
  - email (text)
  - shift_hours (numeric)
  - patients_seen_today (integer)
  - status (text: on-duty/off-duty)
  - created_at (timestamptz)
  
  ### 3. patients
  Core patient information and admission details
  - id (uuid, primary key)
  - name (text)
  - age (integer)
  - gender (text)
  - blood_type (text)
  - phone (text)
  - address (text)
  - admission_date (timestamptz)
  - discharge_date (timestamptz, nullable)
  - status (text: admitted/discharged/critical)
  - ward (text)
  - bed_number (text)
  - floor (integer)
  - family_id (uuid, foreign key)
  - guardian_id (uuid, foreign key to patients)
  - assigned_doctor_id (uuid, foreign key)
  - is_child (boolean)
  - created_at (timestamptz)
  
  ### 4. beds
  Bed inventory and availability tracking
  - id (uuid, primary key)
  - bed_number (text)
  - floor (integer)
  - ward (text)
  - status (text: available/occupied/maintenance)
  - patient_id (uuid, foreign key, nullable)
  - last_cleaned (timestamptz)
  - created_at (timestamptz)
  
  ### 5. symptoms
  Patient symptom tracking and progression
  - id (uuid, primary key)
  - patient_id (uuid, foreign key)
  - chief_complaint (text)
  - onset_date (timestamptz)
  - severity (text: mild/moderate/severe)
  - progression_notes (text)
  - recorded_at (timestamptz)
  
  ### 6. vitals
  Patient vital signs monitoring
  - id (uuid, primary key)
  - patient_id (uuid, foreign key)
  - blood_pressure (text)
  - heart_rate (numeric)
  - temperature (numeric)
  - oxygen_saturation (numeric)
  - respiratory_rate (numeric)
  - weight (numeric, nullable)
  - height (numeric, nullable)
  - recorded_at (timestamptz)
  
  ### 7. diagnoses
  Patient diagnoses tracking
  - id (uuid, primary key)
  - patient_id (uuid, foreign key)
  - diagnosis_text (text)
  - diagnosis_type (text: primary/secondary)
  - diagnosed_at (timestamptz)
  
  ### 8. prescriptions
  Medication prescriptions
  - id (uuid, primary key)
  - patient_id (uuid, foreign key)
  - medication (text)
  - dosage (text)
  - frequency (text)
  - duration (text)
  - instructions (text)
  - is_active (boolean)
  - prescribed_at (timestamptz)
  
  ### 9. lab_reports
  Laboratory test results
  - id (uuid, primary key)
  - patient_id (uuid, foreign key)
  - report_name (text)
  - result (text)
  - normal_range (text)
  - is_abnormal (boolean)
  - reported_at (timestamptz)
  
  ### 10. discharge_records
  Patient discharge documentation
  - id (uuid, primary key)
  - patient_id (uuid, foreign key)
  - discharge_date (timestamptz)
  - total_days (integer)
  - discharge_diagnosis (text)
  - discharge_summary (text)
  - followup_instructions (text)
  - created_at (timestamptz)
  
  ### 11. alerts
  System alerts for patient monitoring
  - id (uuid, primary key)
  - patient_id (uuid, foreign key)
  - alert_type (text)
  - message (text)
  - severity (text: low/medium/high/critical)
  - is_resolved (boolean)
  - created_at (timestamptz)
  
  ### 12. hunch_log
  Doctor's clinical hunches and observations
  - id (uuid, primary key)
  - patient_id (uuid, foreign key)
  - doctor_id (uuid, foreign key)
  - hunch_note (text)
  - is_monitoring (boolean)
  - created_at (timestamptz)
  
  ## Security
  - RLS enabled on all tables
  - Public access policies for demo purposes (can be restricted later)
  - All tables have proper foreign key constraints
  
  ## Important Notes
  1. All timestamps default to current time
  2. UUIDs auto-generated for all primary keys
  3. Foreign keys maintain referential integrity
  4. RLS policies allow public access for demo (should be restricted in production)
*/

-- Create families table
CREATE TABLE IF NOT EXISTS families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_name text NOT NULL,
  emergency_contact text NOT NULL,
  emergency_phone text NOT NULL,
  address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE families ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to families"
  ON families FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  specialty text NOT NULL,
  phone text,
  email text,
  shift_hours numeric DEFAULT 0,
  patients_seen_today integer DEFAULT 0,
  status text DEFAULT 'off-duty',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to doctors"
  ON doctors FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  age integer NOT NULL,
  gender text NOT NULL,
  blood_type text,
  phone text,
  address text,
  admission_date timestamptz DEFAULT now(),
  discharge_date timestamptz,
  status text DEFAULT 'admitted',
  ward text,
  bed_number text,
  floor integer,
  family_id uuid REFERENCES families(id),
  guardian_id uuid REFERENCES patients(id),
  assigned_doctor_id uuid REFERENCES doctors(id),
  is_child boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to patients"
  ON patients FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create beds table
CREATE TABLE IF NOT EXISTS beds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bed_number text NOT NULL UNIQUE,
  floor integer NOT NULL,
  ward text NOT NULL,
  status text DEFAULT 'available',
  patient_id uuid REFERENCES patients(id),
  last_cleaned timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE beds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to beds"
  ON beds FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create symptoms table
CREATE TABLE IF NOT EXISTS symptoms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  chief_complaint text NOT NULL,
  onset_date timestamptz,
  severity text DEFAULT 'mild',
  progression_notes text,
  recorded_at timestamptz DEFAULT now()
);

ALTER TABLE symptoms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to symptoms"
  ON symptoms FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create vitals table
CREATE TABLE IF NOT EXISTS vitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  blood_pressure text,
  heart_rate numeric,
  temperature numeric,
  oxygen_saturation numeric,
  respiratory_rate numeric,
  weight numeric,
  height numeric,
  recorded_at timestamptz DEFAULT now()
);

ALTER TABLE vitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to vitals"
  ON vitals FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create diagnoses table
CREATE TABLE IF NOT EXISTS diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  diagnosis_text text NOT NULL,
  diagnosis_type text DEFAULT 'primary',
  diagnosed_at timestamptz DEFAULT now()
);

ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to diagnoses"
  ON diagnoses FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  medication text NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL,
  duration text,
  instructions text,
  is_active boolean DEFAULT true,
  prescribed_at timestamptz DEFAULT now()
);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to prescriptions"
  ON prescriptions FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create lab_reports table
CREATE TABLE IF NOT EXISTS lab_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  report_name text NOT NULL,
  result text NOT NULL,
  normal_range text,
  is_abnormal boolean DEFAULT false,
  reported_at timestamptz DEFAULT now()
);

ALTER TABLE lab_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to lab_reports"
  ON lab_reports FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create discharge_records table
CREATE TABLE IF NOT EXISTS discharge_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id),
  discharge_date timestamptz DEFAULT now(),
  total_days integer NOT NULL,
  discharge_diagnosis text,
  discharge_summary text,
  followup_instructions text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE discharge_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to discharge_records"
  ON discharge_records FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  message text NOT NULL,
  severity text DEFAULT 'low',
  is_resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to alerts"
  ON alerts FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create hunch_log table
CREATE TABLE IF NOT EXISTS hunch_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES doctors(id),
  hunch_note text NOT NULL,
  is_monitoring boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE hunch_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to hunch_log"
  ON hunch_log FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_patients_family_id ON patients(family_id);
CREATE INDEX IF NOT EXISTS idx_patients_assigned_doctor_id ON patients(assigned_doctor_id);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_beds_status ON beds(status);
CREATE INDEX IF NOT EXISTS idx_beds_patient_id ON beds(patient_id);
CREATE INDEX IF NOT EXISTS idx_symptoms_patient_id ON symptoms(patient_id);
CREATE INDEX IF NOT EXISTS idx_vitals_patient_id ON vitals(patient_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_patient_id ON diagnoses(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_reports_patient_id ON lab_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_alerts_patient_id ON alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_resolved ON alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_hunch_log_patient_id ON hunch_log(patient_id);