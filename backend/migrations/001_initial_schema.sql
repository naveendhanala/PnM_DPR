-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'operator',
  project_codes TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment types
CREATE TABLE IF NOT EXISTS equipment_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Machines
CREATE TABLE IF NOT EXISTS machines (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  slno VARCHAR(50) NOT NULL,
  eq_type VARCHAR(100) NOT NULL,
  capacity VARCHAR(50),
  reg_no VARCHAR(50),
  ownership VARCHAR(10) NOT NULL DEFAULT 'Own',
  vendor VARCHAR(100),
  rate DECIMAL(10,2),
  reading1_basis VARCHAR(10) DEFAULT 'Hours',
  reading2_basis VARCHAR(10),
  dual_reading BOOLEAN DEFAULT false,
  fuel_min DECIMAL(6,2),
  fuel_max DECIMAL(6,2),
  planned_hours DECIMAL(5,2) DEFAULT 10,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, slno)
);

-- DPR Entries
CREATE TABLE IF NOT EXISTS dpr_entries (
  id SERIAL PRIMARY KEY,
  machine_id INTEGER REFERENCES machines(id) ON DELETE SET NULL,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  -- Machine snapshot at entry time (preserved if machine is later edited/deleted)
  slno VARCHAR(50),
  eq_type VARCHAR(100),
  capacity VARCHAR(50),
  reg_no VARCHAR(50),
  ownership VARCHAR(10),
  dual_reading BOOLEAN DEFAULT false,
  planned_hours DECIMAL(5,2),
  -- Readings
  r1_open DECIMAL(10,2),
  r1_close DECIMAL(10,2),
  r1_total DECIMAL(10,2),
  r2_open DECIMAL(10,2),
  r2_close DECIMAL(10,2),
  r2_total DECIMAL(10,2),
  -- Calculated
  working_hours DECIMAL(6,2),
  util_pct DECIMAL(5,2),
  hsd DECIMAL(8,2),
  fuel_avg DECIMAL(8,2),
  breakdown DECIMAL(6,2) DEFAULT 0,
  qty DECIMAL(10,2),
  work_done VARCHAR(500),
  remarks TEXT,
  submitted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(machine_id, entry_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_entries_project_date ON dpr_entries(project_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_entries_machine_date ON dpr_entries(machine_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_machines_project ON machines(project_id);
