INSERT INTO users (name, email, password, role, is_verified)
VALUES
  ('Admin User', 'admin@example.com', '$2a$10$abcdefghijklmnopqrstuv', 'admin', TRUE),
  ('Finance Manager', 'finance@example.com', '$2a$10$abcdefghijklmnopqrstuv', 'finance_manager', TRUE),
  ('Project Manager', 'pm@example.com', '$2a$10$abcdefghijklmnopqrstuv', 'project_manager', TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO projects (name, budget, actual_cost, status, planned_progress, actual_progress, start_date)
VALUES
  ('Residential Tower A', 10000000, 3000000, 'Active', 40, 30, CURRENT_DATE - INTERVAL '90 days'),
  ('Mall Renovation', 5000000, 2500000, 'Active', 60, 55, CURRENT_DATE - INTERVAL '120 days')
ON CONFLICT DO NOTHING;

INSERT INTO accounts (code, name, type)
VALUES
  ('1000', 'Cash', 'ASSET'),
  ('1100', 'Bank', 'ASSET'),
  ('2000', 'Accounts Payable', 'LIABILITY'),
  ('3000', 'Equity', 'EQUITY'),
  ('4000', 'Revenue', 'REVENUE'),
  ('5000', 'Construction Expenses', 'EXPENSE')
ON CONFLICT (code) DO NOTHING;
