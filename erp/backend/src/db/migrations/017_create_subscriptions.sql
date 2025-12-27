-- Migration: 017_create_subscriptions.sql
-- Purpose: Subscription plans and payment tracking for Vyapar360 SaaS

-- =====================================================
-- SUBSCRIPTION PLANS
-- =====================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,           -- 'free', 'starter', 'professional', 'enterprise'
    display_name VARCHAR(100) NOT NULL,         -- 'Free', 'Starter', 'Professional', 'Enterprise'
    description TEXT,
    
    -- Pricing
    price_monthly INTEGER NOT NULL DEFAULT 0,    -- Price in INR (paise for Razorpay)
    price_yearly INTEGER NOT NULL DEFAULT 0,     -- Annual price with discount
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Limits
    max_users INTEGER DEFAULT 5,                 -- Max employees/users per company
    max_storage_gb INTEGER DEFAULT 1,            -- Storage limit in GB
    
    -- Feature flags (JSON for flexibility)
    features JSONB DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- COMPANY SUBSCRIPTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS company_subscriptions (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
    
    -- Subscription details
    status VARCHAR(20) DEFAULT 'active',         -- 'active', 'cancelled', 'expired', 'past_due'
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- 'monthly', 'yearly'
    
    -- Dates
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,                          -- When subscription expires
    trial_end_date TIMESTAMP,                    -- Trial period end
    cancelled_at TIMESTAMP,
    
    -- Razorpay subscription ID (for recurring)
    razorpay_subscription_id VARCHAR(100),
    razorpay_customer_id VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(company_id)  -- One active subscription per company
);

-- =====================================================
-- PAYMENT TRANSACTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS subscription_payments (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES company_subscriptions(id),
    
    -- Razorpay details
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    razorpay_signature VARCHAR(255),
    
    -- Payment info
    amount INTEGER NOT NULL,                     -- Amount in paise
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'pending',        -- 'pending', 'success', 'failed', 'refunded'
    payment_method VARCHAR(50),                  -- 'card', 'upi', 'netbanking', etc.
    
    -- Invoice
    invoice_id VARCHAR(100),
    invoice_url TEXT,
    
    -- Metadata
    notes JSONB DEFAULT '{}',
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INSERT DEFAULT PLANS
-- =====================================================
INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, max_users, max_storage_gb, features, sort_order)
VALUES 
    ('free', 'Free', 'Perfect for small teams getting started', 0, 0, 5, 1, 
     '{"hr": true, "finance": false, "inventory": false, "crm": false, "projects": true, "teams": true, "api": false, "support": "community", "reports": "basic"}', 
     1),
    
    ('starter', 'Starter', 'For growing businesses', 49900, 499000, 15, 5, 
     '{"hr": true, "finance": true, "inventory": true, "crm": true, "projects": true, "teams": true, "api": false, "support": "email", "reports": "standard"}', 
     2),
    
    ('professional', 'Professional', 'For scaling companies', 149900, 1499000, 50, 25, 
     '{"hr": true, "finance": true, "inventory": true, "crm": true, "projects": true, "teams": true, "api": true, "support": "priority", "reports": "advanced", "ai_insights": true}', 
     3),
    
    ('enterprise', 'Enterprise', 'For large organizations', 499900, 4999000, -1, 100, 
     '{"hr": true, "finance": true, "inventory": true, "crm": true, "projects": true, "teams": true, "api": true, "support": "dedicated", "reports": "custom", "ai_insights": true, "white_label": true, "sso": true}', 
     4)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- ADD PLAN REFERENCE TO COMPANIES
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'subscription_plan_id') THEN
        ALTER TABLE companies ADD COLUMN subscription_plan_id INTEGER REFERENCES subscription_plans(id);
    END IF;
END $$;

-- Set default plan (free) for existing companies
UPDATE companies 
SET subscription_plan_id = (SELECT id FROM subscription_plans WHERE name = 'free' LIMIT 1)
WHERE subscription_plan_id IS NULL;

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_company_subscriptions_company ON company_subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_company_subscriptions_status ON company_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_company ON subscription_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_razorpay ON subscription_payments(razorpay_payment_id);
