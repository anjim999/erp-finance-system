// src/db/migrations.js - Comprehensive ERP Database Migrations
import pool from "./pool.js";

export async function runMigrations() {
  try {
    console.log("🔄 Running database migrations...");

    // ============================================
    // CORE TABLES
    // ============================================

    // 1. Companies Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) UNIQUE,
        industry VARCHAR(100),
        description TEXT,
        logo TEXT,
        email VARCHAR(255),
        phone VARCHAR(50),
        website VARCHAR(255),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100) DEFAULT 'India',
        pincode VARCHAR(20),
        gstin VARCHAR(50),
        pan VARCHAR(20),
        established_year INTEGER,
        employee_count VARCHAR(50),
        is_verified BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        is_featured BOOLEAN DEFAULT FALSE,
        rating NUMERIC(2,1) DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 2. Company Requests Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS company_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        company_name VARCHAR(255) NOT NULL,
        industry VARCHAR(100),
        description TEXT,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        website VARCHAR(255),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100) DEFAULT 'India',
        pincode VARCHAR(10),
        gstin VARCHAR(20),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        admin_notes TEXT,
        company_id INTEGER REFERENCES companies(id),
        processed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ============================================
    // HR MODULE TABLES
    // ============================================

    // 3. Departments Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        manager_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 4. Employees Table (Extended)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        employee_id VARCHAR(50),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        department_id INTEGER REFERENCES departments(id),
        designation VARCHAR(100),
        date_of_joining DATE,
        date_of_birth DATE,
        salary NUMERIC(15,2),
        bank_account VARCHAR(50),
        bank_name VARCHAR(100),
        ifsc_code VARCHAR(20),
        pan_number VARCHAR(20),
        aadhar_number VARCHAR(20),
        address TEXT,
        emergency_contact VARCHAR(50),
        blood_group VARCHAR(10),
        status VARCHAR(20) DEFAULT 'active',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 5. Attendance Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        check_in TIME,
        check_out TIME,
        work_hours NUMERIC(5,2),
        status VARCHAR(20) DEFAULT 'present',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, date)
      );
    `);

    // 6. Leave Types Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leave_types (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        days_allowed INTEGER DEFAULT 0,
        is_paid BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 7. Leave Requests Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        leave_type_id INTEGER REFERENCES leave_types(id),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        days INTEGER,
        reason TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        approved_by INTEGER REFERENCES users(id),
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 8. Holidays Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS holidays (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        date DATE NOT NULL,
        is_optional BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ============================================
    // FINANCE MODULE TABLES
    // ============================================

    // 9. Invoices Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        customer_id INTEGER,
        customer_name VARCHAR(255),
        invoice_number VARCHAR(50) UNIQUE,
        amount_base NUMERIC(15,2) DEFAULT 0,
        tax_rate NUMERIC(5,2) DEFAULT 0,
        tax_amount NUMERIC(15,2) DEFAULT 0,
        total_amount NUMERIC(15,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending',
        due_date DATE,
        payment_date DATE,
        description TEXT,
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 10. Invoice Items Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
        description TEXT,
        quantity INTEGER DEFAULT 1,
        unit_price NUMERIC(15,2) DEFAULT 0,
        amount NUMERIC(15,2) DEFAULT 0
      );
    `);

    // 11. Expenses Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        category VARCHAR(100),
        amount NUMERIC(15,2) NOT NULL,
        expense_date DATE DEFAULT CURRENT_DATE,
        description TEXT,
        vendor VARCHAR(255),
        receipt_url TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        approved_by INTEGER REFERENCES users(id),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ============================================
    // CRM MODULE TABLES
    // ============================================

    // 12. Customers Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        company_name VARCHAR(255),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        notes TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 13. Leads Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        company_name VARCHAR(255),
        source VARCHAR(100),
        status VARCHAR(50) DEFAULT 'new',
        value NUMERIC(15,2),
        assigned_to INTEGER REFERENCES users(id),
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 14. Orders Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        order_number VARCHAR(50),
        total_amount NUMERIC(15,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending',
        order_date DATE DEFAULT CURRENT_DATE,
        shipping_address TEXT,
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ============================================
    // INVENTORY MODULE TABLES
    // ============================================

    // 15. Products Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        sku VARCHAR(50),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        unit VARCHAR(50) DEFAULT 'pcs',
        quantity INTEGER DEFAULT 0,
        unit_price NUMERIC(15,2) DEFAULT 0,
        cost_price NUMERIC(15,2) DEFAULT 0,
        reorder_level INTEGER DEFAULT 10,
        is_active BOOLEAN DEFAULT TRUE,
        image_url TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 16. Purchase Orders Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        po_number VARCHAR(50),
        vendor_name VARCHAR(255),
        total_amount NUMERIC(15,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'draft',
        order_date DATE DEFAULT CURRENT_DATE,
        expected_date DATE,
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 17. Stock Movements Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        movement_type VARCHAR(20) NOT NULL,
        quantity INTEGER NOT NULL,
        reference_type VARCHAR(50),
        reference_id INTEGER,
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ============================================
    // PROJECTS MODULE TABLES
    // ============================================

    // 18. Projects Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        client_name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'planning',
        priority VARCHAR(20) DEFAULT 'medium',
        start_date DATE,
        end_date DATE,
        budget NUMERIC(15,2),
        spent NUMERIC(15,2) DEFAULT 0,
        progress INTEGER DEFAULT 0,
        manager_id INTEGER REFERENCES users(id),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 19. Tasks Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'todo',
        priority VARCHAR(20) DEFAULT 'medium',
        due_date DATE,
        assigned_to INTEGER REFERENCES users(id),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ============================================
    // NOTIFICATIONS & DOCUMENTS
    // ============================================

    // 20. Notifications Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        type VARCHAR(50) DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        action_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 21. Documents Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        uploaded_by INTEGER REFERENCES users(id),
        entity_type VARCHAR(50),
        entity_id INTEGER,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255),
        file_path TEXT,
        file_size INTEGER,
        mime_type VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 22. Audit Logs Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50),
        entity_id VARCHAR(50),
        details TEXT,
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ============================================
    // REVIEWS TABLE
    // ============================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        title VARCHAR(255),
        comment TEXT,
        is_approved BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ============================================
    // PAYMENT ORDERS TABLE
    // ============================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_orders (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(100) UNIQUE NOT NULL,
        user_id INTEGER REFERENCES users(id),
        company_id INTEGER REFERENCES companies(id),
        payment_id VARCHAR(100),
        amount NUMERIC(12,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        status VARCHAR(50) DEFAULT 'created',
        notes JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ============================================
    // CHAT ROOMS TABLE
    // ============================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_rooms (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(255),
        type VARCHAR(50) DEFAULT 'group',
        participants INTEGER[],
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ============================================
    // CHAT MESSAGES TABLE
    // ============================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        room_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
        sender_id INTEGER REFERENCES users(id),
        message TEXT NOT NULL,
        attachments JSONB DEFAULT '[]',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ============================================
    // MEETINGS TABLE
    // ============================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS meetings (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        meeting_link TEXT NOT NULL,
        platform VARCHAR(50) DEFAULT 'other',
        scheduled_at TIMESTAMP NOT NULL,
        duration_minutes INTEGER DEFAULT 60,
        attendees INTEGER[],
        status VARCHAR(50) DEFAULT 'scheduled',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ============================================
    // FIX MESSAGE REACTIONS FOR DIRECT MESSAGES
    // ============================================
    await pool.query(`
      -- Remove foreign key constraint if it exists
      DO $$ 
      BEGIN
        ALTER TABLE message_reactions DROP CONSTRAINT IF EXISTS message_reactions_message_id_fkey;
      EXCEPTION
        WHEN undefined_object THEN NULL;
      END $$;

      -- Add message_type column if it doesn't exist
      ALTER TABLE message_reactions ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'channel';

      -- Create index for better performance
      CREATE INDEX IF NOT EXISTS idx_message_reactions_type ON message_reactions(message_type, message_id);
    `);

    // ============================================
    // INDEXES FOR PERFORMANCE
    // ============================================
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_company_requests_status ON company_requests(status);
      CREATE INDEX IF NOT EXISTS idx_company_requests_user ON company_requests(user_id);
      CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id);
      CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_id);
      CREATE INDEX IF NOT EXISTS idx_orders_company ON orders(company_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_company ON invoices(company_id);
      CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id);
      CREATE INDEX IF NOT EXISTS idx_projects_company ON projects(company_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_reviews_company ON reviews(company_id);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id);
      CREATE INDEX IF NOT EXISTS idx_meetings_company ON meetings(company_id);
    `);

    // ============================================
    // 23. ADDITIONAL MISSING INDEXES
    // ============================================
    await pool.query(`
      -- Enable Trigram Extension
      CREATE EXTENSION IF NOT EXISTS pg_trgm;

      -- Users & Companies
      CREATE INDEX IF NOT EXISTS idx_users_email_trigram ON users USING gin (email gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS idx_companies_name_trigram ON companies USING gin (name gin_trgm_ops);
      
      -- HR Module
      CREATE INDEX IF NOT EXISTS idx_departments_manager ON departments(manager_id);
      CREATE INDEX IF NOT EXISTS idx_leave_requests_company_user ON leave_requests(company_id, user_id);
      CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
      CREATE INDEX IF NOT EXISTS idx_holidays_company ON holidays(company_id);
      
      -- Inventory Module
      CREATE INDEX IF NOT EXISTS idx_product_category_company_parent ON product_categories(company_id, parent_id);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
      CREATE INDEX IF NOT EXISTS idx_stock_mvmt_company_prod ON stock_movements(company_id, product_id);
      CREATE INDEX IF NOT EXISTS idx_pos_company_vendor ON purchase_orders(company_id, vendor_id);
      CREATE INDEX IF NOT EXISTS idx_po_items_po ON purchase_order_items(purchase_order_id);
      CREATE INDEX IF NOT EXISTS idx_po_items_product ON purchase_order_items(product_id);
      
      -- CRM & Projects
      CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
      CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON lead_activities(lead_id);
      CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects(manager_id);
      CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status ON tasks(assigned_to, status);
      CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
      CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
      CREATE INDEX IF NOT EXISTS idx_time_logs_context ON time_logs(company_id, task_id, user_id);
      CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(company_id, project_id);
      
      -- Finance
      CREATE INDEX IF NOT EXISTS idx_expenses_company_date ON expenses(company_id, date);
      CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
      
      -- Marketplace & Communication
      CREATE INDEX IF NOT EXISTS idx_saved_companies_customer ON saved_companies(customer_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(company_id, customer_id);
      CREATE INDEX IF NOT EXISTS idx_meetings_organizer ON meetings(company_id, organizer_id); -- Corrected column name 
      CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting ON meeting_participants(meeting_id);
      CREATE INDEX IF NOT EXISTS idx_documents_lookup ON documents(company_id, entity_type, entity_id);
    `);

    // ============================================
    // SUBSCRIPTION SYSTEM TABLES
    // ============================================

    // Subscription Plans
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        display_name VARCHAR(100) NOT NULL,
        description TEXT,
        price_monthly INTEGER NOT NULL DEFAULT 0,
        price_yearly INTEGER NOT NULL DEFAULT 0,
        currency VARCHAR(3) DEFAULT 'INR',
        max_users INTEGER DEFAULT 5,
        max_storage_gb INTEGER DEFAULT 1,
        features JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert default plans
    await pool.query(`
      INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, max_users, max_storage_gb, features, sort_order)
      VALUES 
        ('free', 'Free', 'Perfect for small teams getting started', 0, 0, 5, 1, 
         '{"hr": true, "finance": false, "inventory": false, "crm": false, "projects": true, "teams": true, "api": false, "support": "community", "reports": "basic"}', 1),
        ('starter', 'Starter', 'For growing businesses', 49900, 499000, 15, 5, 
         '{"hr": true, "finance": true, "inventory": true, "crm": true, "projects": true, "teams": true, "api": false, "support": "email", "reports": "standard"}', 2),
        ('professional', 'Professional', 'For scaling companies', 149900, 1499000, 50, 25, 
         '{"hr": true, "finance": true, "inventory": true, "crm": true, "projects": true, "teams": true, "api": true, "support": "priority", "reports": "advanced", "ai_insights": true}', 3),
        ('enterprise', 'Enterprise', 'For large organizations', 499900, 4999000, -1, 100, 
         '{"hr": true, "finance": true, "inventory": true, "crm": true, "projects": true, "teams": true, "api": true, "support": "dedicated", "reports": "custom", "ai_insights": true, "white_label": true, "sso": true}', 4)
      ON CONFLICT (name) DO NOTHING;
    `);

    // Company Subscriptions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS company_subscriptions (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
        status VARCHAR(20) DEFAULT 'active',
        billing_cycle VARCHAR(20) DEFAULT 'monthly',
        start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_date TIMESTAMP,
        trial_end_date TIMESTAMP,
        cancelled_at TIMESTAMP,
        razorpay_subscription_id VARCHAR(100),
        razorpay_customer_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(company_id)
      );
    `);

    // Subscription Payments
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscription_payments (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        subscription_id INTEGER REFERENCES company_subscriptions(id),
        razorpay_order_id VARCHAR(100),
        razorpay_payment_id VARCHAR(100),
        razorpay_signature VARCHAR(255),
        amount INTEGER NOT NULL,
        currency VARCHAR(3) DEFAULT 'INR',
        status VARCHAR(20) DEFAULT 'pending',
        payment_method VARCHAR(50),
        invoice_id VARCHAR(100),
        invoice_url TEXT,
        notes JSONB DEFAULT '{}',
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add subscription indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_company_subscriptions_company ON company_subscriptions(company_id);
      CREATE INDEX IF NOT EXISTS idx_company_subscriptions_status ON company_subscriptions(status);
      CREATE INDEX IF NOT EXISTS idx_subscription_payments_company ON subscription_payments(company_id);
      CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(status);
      CREATE INDEX IF NOT EXISTS idx_subscription_payments_razorpay ON subscription_payments(razorpay_payment_id);
    `);

    console.log("✅ All migrations completed successfully");
  } catch (err) {
    console.error("❌ Migration error:", err.message);
    // Don't throw - allow server to start even if some tables exist
  }
}
