-- ROLES
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO roles (name)
VALUES ('admin'), ('finance_manager'), ('project_manager'), ('user')
ON CONFLICT (name) DO NOTHING;

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  is_verified BOOLEAN DEFAULT FALSE,
  google_id VARCHAR(255),
  avatar TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- OTPS
CREATE TABLE IF NOT EXISTS otps (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(10) NOT NULL,
  purpose VARCHAR(20) NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id INTEGER,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- PROJECTS
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  budget NUMERIC(15,2) NOT NULL,
  actual_cost NUMERIC(15,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Active',
  planned_progress NUMERIC(5,2) DEFAULT 0,
  actual_progress NUMERIC(5,2) DEFAULT 0,
  start_date DATE,
  end_date DATE
);

-- PROJECT PROGRESS
CREATE TABLE IF NOT EXISTS project_progress (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  date DATE NOT NULL,
  planned_percent NUMERIC(5,2),
  actual_percent NUMERIC(5,2)
);

-- ACCOUNTS
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,
  parent_account_id INTEGER REFERENCES accounts(id),
  currency VARCHAR(10) DEFAULT 'INR'
);

-- JOURNAL ENTRIES
CREATE TABLE IF NOT EXISTS journal_entries (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'Draft',
  created_by INTEGER REFERENCES users(id),
  approved_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP
);

-- JOURNAL LINES
CREATE TABLE IF NOT EXISTS journal_lines (
  id SERIAL PRIMARY KEY,
  journal_entry_id INTEGER REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id INTEGER REFERENCES accounts(id),
  debit NUMERIC(15,2) DEFAULT 0,
  credit NUMERIC(15,2) DEFAULT 0
);

-- TRANSACTIONS (derived)
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  journal_line_id INTEGER REFERENCES journal_lines(id),
  txn_date DATE NOT NULL,
  direction VARCHAR(3) NOT NULL, -- IN or OUT
  amount_base NUMERIC(15,2) NOT NULL
);

-- CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  currency VARCHAR(10) DEFAULT 'INR'
);

-- VENDORS
CREATE TABLE IF NOT EXISTS vendors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  currency VARCHAR(10) DEFAULT 'INR'
);

-- INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(2) NOT NULL, -- AR or AP
  customer_id INTEGER REFERENCES customers(id),
  vendor_id INTEGER REFERENCES vendors(id),
  project_id INTEGER REFERENCES projects(id),
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  amount NUMERIC(15,2) NOT NULL,
  amount_base NUMERIC(15,2) NOT NULL,
  paid_amount_base NUMERIC(15,2) DEFAULT 0,
  status VARCHAR(30) DEFAULT 'Draft'
);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER REFERENCES invoices(id),
  payment_date DATE NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  amount_base NUMERIC(15,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  method VARCHAR(50),
  reference_number VARCHAR(100)
);

-- EXCHANGE RATES
CREATE TABLE IF NOT EXISTS exchange_rates (
  id SERIAL PRIMARY KEY,
  base_currency VARCHAR(10) NOT NULL,
  target_currency VARCHAR(10) NOT NULL,
  rate NUMERIC(15,6) NOT NULL,
  rate_date DATE NOT NULL
);

-- RISK LOGS
CREATE TABLE IF NOT EXISTS risk_logs (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  risk_score INTEGER NOT NULL,
  risk_level VARCHAR(20) NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
