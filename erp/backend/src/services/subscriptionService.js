// src/services/subscriptionService.js
// Subscription management for Vyapar360 SaaS

import pool from '../db/pool.js';
import crypto from 'crypto';

// Razorpay configuration (Test mode)
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_demo';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'demo_secret';
const RAZORPAY_API_URL = 'https://api.razorpay.com/v1';

// =====================================================
// PLANS
// =====================================================

export async function getAllPlans() {
    const result = await pool.query(
        `SELECT id, name, display_name, description, price_monthly, price_yearly, 
                max_users, max_storage_gb, features, sort_order
         FROM subscription_plans 
         WHERE is_active = true 
         ORDER BY sort_order`
    );
    return result.rows;
}

export async function getPlanById(planId) {
    const result = await pool.query(
        `SELECT * FROM subscription_plans WHERE id = $1`,
        [planId]
    );
    return result.rows[0];
}

export async function getPlanByName(planName) {
    const result = await pool.query(
        `SELECT * FROM subscription_plans WHERE name = $1`,
        [planName]
    );
    return result.rows[0];
}

// =====================================================
// COMPANY SUBSCRIPTION
// =====================================================

export async function getCompanySubscription(companyId) {
    const result = await pool.query(
        `SELECT cs.*, sp.name as plan_name, sp.display_name as plan_display_name,
                sp.features, sp.max_users, sp.max_storage_gb,
                sp.price_monthly, sp.price_yearly
         FROM company_subscriptions cs
         JOIN subscription_plans sp ON cs.plan_id = sp.id
         WHERE cs.company_id = $1`,
        [companyId]
    );

    if (result.rows.length === 0) {
        // Return default free plan info
        const freePlan = await getPlanByName('free');
        return {
            plan_id: freePlan?.id,
            plan_name: 'free',
            plan_display_name: 'Free',
            features: freePlan?.features || {},
            max_users: 5,
            status: 'active'
        };
    }

    return result.rows[0];
}

export async function updateCompanyPlan(companyId, planId, billingCycle = 'monthly') {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check if subscription exists
        const existing = await client.query(
            `SELECT id FROM company_subscriptions WHERE company_id = $1`,
            [companyId]
        );

        const plan = await getPlanById(planId);
        if (!plan) throw new Error('Plan not found');

        // Calculate end date
        const startDate = new Date();
        const endDate = new Date();
        if (billingCycle === 'yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
            endDate.setMonth(endDate.getMonth() + 1);
        }

        if (existing.rows.length > 0) {
            // Update existing subscription
            await client.query(
                `UPDATE company_subscriptions 
                 SET plan_id = $1, billing_cycle = $2, start_date = $3, end_date = $4, 
                     status = 'active', updated_at = NOW()
                 WHERE company_id = $5`,
                [planId, billingCycle, startDate, endDate, companyId]
            );
        } else {
            // Create new subscription
            await client.query(
                `INSERT INTO company_subscriptions (company_id, plan_id, billing_cycle, start_date, end_date, status)
                 VALUES ($1, $2, $3, $4, $5, 'active')`,
                [companyId, planId, billingCycle, startDate, endDate]
            );
        }

        // Update company's plan reference
        await client.query(
            `UPDATE companies SET subscription_plan_id = $1 WHERE id = $2`,
            [planId, companyId]
        );

        await client.query('COMMIT');
        return { success: true, plan: plan.name };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

// =====================================================
// FEATURE GATING
// =====================================================

export async function checkFeatureAccess(companyId, featureName) {
    const subscription = await getCompanySubscription(companyId);
    const features = subscription.features || {};

    // Check if feature is enabled
    if (features[featureName] === true) return true;
    if (features[featureName] === false) return false;

    // Default: allow if not explicitly disabled
    return true;
}

export async function getCompanyLimits(companyId) {
    const subscription = await getCompanySubscription(companyId);
    return {
        maxUsers: subscription.max_users === -1 ? Infinity : subscription.max_users,
        maxStorageGb: subscription.max_storage_gb,
        planName: subscription.plan_name,
        features: subscription.features || {}
    };
}

// =====================================================
// RAZORPAY INTEGRATION
// =====================================================

// Create Razorpay order for subscription payment
export async function createPaymentOrder(companyId, planId, billingCycle = 'monthly') {
    const plan = await getPlanById(planId);
    if (!plan) throw new Error('Plan not found');

    const amount = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;

    if (amount === 0) {
        // Free plan, no payment needed
        await updateCompanyPlan(companyId, planId, billingCycle);
        return { success: true, free: true };
    }

    // Create order in Razorpay
    const orderId = 'order_' + crypto.randomBytes(8).toString('hex');

    // In production, call Razorpay API:
    // const response = await fetch(`${RAZORPAY_API_URL}/orders`, { ... });

    // Save order to database
    await pool.query(
        `INSERT INTO subscription_payments 
         (company_id, razorpay_order_id, amount, currency, status, notes)
         VALUES ($1, $2, $3, 'INR', 'pending', $4)`,
        [companyId, orderId, amount, JSON.stringify({ planId, billingCycle })]
    );

    return {
        success: true,
        order: {
            id: orderId,
            amount: amount,  // In paise
            currency: 'INR',
            key: RAZORPAY_KEY_ID,
            plan: {
                id: plan.id,
                name: plan.display_name,
                billingCycle
            }
        }
    };
}

// Verify payment after Razorpay checkout
export async function verifyPayment(companyId, { razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
        await pool.query(
            `UPDATE subscription_payments 
             SET status = 'failed', error_message = 'Invalid signature', updated_at = NOW()
             WHERE razorpay_order_id = $1`,
            [razorpay_order_id]
        );
        throw new Error('Payment verification failed');
    }

    // Get payment details
    const paymentResult = await pool.query(
        `SELECT * FROM subscription_payments WHERE razorpay_order_id = $1`,
        [razorpay_order_id]
    );

    if (paymentResult.rows.length === 0) {
        throw new Error('Payment order not found');
    }

    const payment = paymentResult.rows[0];
    const notes = payment.notes || {};

    // Update payment status
    await pool.query(
        `UPDATE subscription_payments 
         SET razorpay_payment_id = $1, razorpay_signature = $2, status = 'success', updated_at = NOW()
         WHERE razorpay_order_id = $3`,
        [razorpay_payment_id, razorpay_signature, razorpay_order_id]
    );

    // Update company subscription
    await updateCompanyPlan(companyId, notes.planId, notes.billingCycle);

    return { success: true, message: 'Subscription activated!' };
}

// Handle Razorpay webhook
export async function handleWebhook(payload, signature) {
    // Verify webhook signature
    const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex');

    if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return { success: false, error: 'Invalid signature' };
    }

    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;

    switch (event) {
        case 'payment.captured':
            // Payment successful
            console.log('✅ Payment captured:', paymentEntity?.id);
            break;

        case 'payment.failed':
            // Payment failed
            console.log('❌ Payment failed:', paymentEntity?.id);
            if (paymentEntity?.order_id) {
                await pool.query(
                    `UPDATE subscription_payments 
                     SET status = 'failed', error_message = $1, updated_at = NOW()
                     WHERE razorpay_order_id = $2`,
                    [paymentEntity.error_description, paymentEntity.order_id]
                );
            }
            break;

        case 'subscription.charged':
            // Recurring payment successful
            console.log('✅ Subscription charged');
            break;

        case 'subscription.cancelled':
            // Subscription cancelled
            console.log('⚠️ Subscription cancelled');
            break;

        default:
            console.log('Webhook event:', event);
    }

    return { success: true };
}

// =====================================================
// PAYMENT HISTORY
// =====================================================

export async function getPaymentHistory(companyId) {
    const result = await pool.query(
        `SELECT sp.*, spl.display_name as plan_name
         FROM subscription_payments sp
         LEFT JOIN company_subscriptions cs ON sp.subscription_id = cs.id
         LEFT JOIN subscription_plans spl ON cs.plan_id = spl.id
         WHERE sp.company_id = $1
         ORDER BY sp.created_at DESC`,
        [companyId]
    );
    return result.rows;
}

// =====================================================
// SUBSCRIPTION MANAGEMENT
// =====================================================

// Cancel subscription (downgrade to free at end of period)
export async function cancelSubscription(companyId, reason = '') {
    const subscription = await getCompanySubscription(companyId);

    if (!subscription || subscription.plan_name === 'free') {
        throw new Error('No active paid subscription to cancel');
    }

    if (subscription.status === 'cancelled') {
        throw new Error('Subscription already cancelled');
    }

    await pool.query(
        `UPDATE company_subscriptions 
         SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
         WHERE company_id = $1`,
        [companyId]
    );

    // Log cancellation reason
    console.log(`⚠️ Subscription cancelled for company ${companyId}. Reason: ${reason}`);

    return {
        success: true,
        message: 'Subscription cancelled. You will have access until the end of your billing period.',
        end_date: subscription.end_date
    };
}

// Reactivate cancelled subscription
export async function reactivateSubscription(companyId) {
    const subscription = await getCompanySubscription(companyId);

    if (!subscription) {
        throw new Error('No subscription found');
    }

    if (subscription.status !== 'cancelled') {
        throw new Error('Subscription is not cancelled');
    }

    // Check if still within billing period
    const now = new Date();
    const endDate = new Date(subscription.end_date);

    if (now > endDate) {
        throw new Error('Billing period has ended. Please subscribe again.');
    }

    await pool.query(
        `UPDATE company_subscriptions 
         SET status = 'active', cancelled_at = NULL, updated_at = NOW()
         WHERE company_id = $1`,
        [companyId]
    );

    return {
        success: true,
        message: 'Subscription reactivated successfully!'
    };
}

// Change billing cycle (monthly <-> yearly)
export async function changeBillingCycle(companyId, newBillingCycle) {
    const subscription = await getCompanySubscription(companyId);

    if (!subscription || subscription.plan_name === 'free') {
        throw new Error('No active paid subscription');
    }

    if (subscription.billing_cycle === newBillingCycle) {
        throw new Error(`Already on ${newBillingCycle} billing`);
    }

    const plan = await getPlanById(subscription.plan_id);
    if (!plan) throw new Error('Plan not found');

    // Calculate price difference and new end date
    const now = new Date();
    const currentEndDate = new Date(subscription.end_date);
    const remainingDays = Math.max(0, Math.ceil((currentEndDate - now) / (1000 * 60 * 60 * 24)));

    let newEndDate = new Date();
    let proratedAmount = 0;

    if (newBillingCycle === 'yearly') {
        // Upgrading to yearly
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
        const yearlyPrice = plan.price_yearly;
        const monthlyPrice = plan.price_monthly;
        // Credit remaining days from monthly
        const dailyRate = monthlyPrice / 30;
        const credit = remainingDays * dailyRate;
        proratedAmount = Math.max(0, yearlyPrice - credit);
    } else {
        // Downgrading to monthly
        newEndDate.setMonth(newEndDate.getMonth() + 1);
        proratedAmount = 0; // No charge, just switch at end of period
    }

    await pool.query(
        `UPDATE company_subscriptions 
         SET billing_cycle = $1, end_date = $2, updated_at = NOW()
         WHERE company_id = $3`,
        [newBillingCycle, newEndDate, companyId]
    );

    return {
        success: true,
        message: `Billing cycle changed to ${newBillingCycle}`,
        new_end_date: newEndDate,
        prorated_amount: proratedAmount,
        prorated_display: proratedAmount > 0 ? `₹${(proratedAmount / 100).toLocaleString('en-IN')}` : 'No charge'
    };
}

// Get subscription summary with all details
export async function getSubscriptionSummary(companyId) {
    const subscription = await getCompanySubscription(companyId);

    // Get user count
    const userCountResult = await pool.query(
        `SELECT COUNT(*) as count FROM users WHERE company_id = $1 AND is_active = true`,
        [companyId]
    );
    const userCount = parseInt(userCountResult.rows[0].count);

    // Calculate days remaining
    let daysRemaining = null;
    if (subscription.end_date) {
        const now = new Date();
        const endDate = new Date(subscription.end_date);
        daysRemaining = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
    }

    return {
        ...subscription,
        current_users: userCount,
        days_remaining: daysRemaining,
        is_cancelled: subscription.status === 'cancelled',
        can_cancel: subscription.plan_name !== 'free' && subscription.status === 'active',
        can_reactivate: subscription.status === 'cancelled' && daysRemaining > 0
    };
}

