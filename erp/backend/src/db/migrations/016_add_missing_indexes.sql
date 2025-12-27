-- Migration: Add missing indexes for performance optimization
-- Part 1: Companies & General
CREATE INDEX IF NOT EXISTS idx_users_email_trigram ON users USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_companies_name_trigram ON companies USING gin (name gin_trgm_ops);

-- Part 2: HR Module
CREATE INDEX IF NOT EXISTS idx_departments_manager ON departments(manager_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_company_user ON leave_requests(company_id, user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_holidays_company ON holidays(company_id);
CREATE INDEX IF NOT EXISTS idx_salary_structures_company_user ON salary_structures(company_id, user_id);
CREATE INDEX IF NOT EXISTS idx_payslips_company_user_month ON payslips(company_id, user_id, month, year);

-- Part 3: Inventory Module
CREATE INDEX IF NOT EXISTS idx_product_cats_company_parent ON product_categories(company_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_stock_mvmt_company_product ON stock_movements(company_id, product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_company_vendor ON purchase_orders(company_id, vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product ON purchase_order_items(product_id);

-- Part 4: CRM & Projects
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status ON tasks(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_company_task_user ON time_logs(company_id, task_id, user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_company_project ON milestones(company_id, project_id);

-- Part 5: Finance
CREATE INDEX IF NOT EXISTS idx_expenses_company_date ON expenses(company_id, date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_budgets_company ON budgets(company_id);

-- Part 6: Marketplace & Communication
CREATE INDEX IF NOT EXISTS idx_company_reviews_company ON company_reviews(company_id);
CREATE INDEX IF NOT EXISTS idx_company_services_company ON company_services(company_id);
CREATE INDEX IF NOT EXISTS idx_saved_companies_customer ON saved_companies(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(company_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_meetings_company_organizer ON meetings(company_id, organizer_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting ON meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_user ON meeting_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_company_entity ON documents(company_id, entity_type, entity_id);

-- Part 7: Miscellaneous
CREATE INDEX IF NOT EXISTS idx_designations_company ON designations(company_id);

