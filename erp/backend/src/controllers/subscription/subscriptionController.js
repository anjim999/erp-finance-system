// src/controllers/subscription/subscriptionController.js
import * as subscriptionService from '../../services/subscriptionService.js';

// Get all available plans
export async function getPlans(req, res) {
    try {
        const plans = await subscriptionService.getAllPlans();

        // Format prices for display
        const formattedPlans = plans.map(plan => ({
            ...plan,
            price_monthly_display: plan.price_monthly === 0 ? 'Free' : `₹${(plan.price_monthly / 100).toLocaleString('en-IN')}`,
            price_yearly_display: plan.price_yearly === 0 ? 'Free' : `₹${(plan.price_yearly / 100).toLocaleString('en-IN')}`,
            yearly_savings: plan.price_monthly > 0
                ? Math.round(100 - (plan.price_yearly / (plan.price_monthly * 12)) * 100)
                : 0
        }));

        res.json({ success: true, data: formattedPlans });
    } catch (err) {
        console.error('Error fetching plans:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch plans' });
    }
}

// Get current company subscription
export async function getCurrentSubscription(req, res) {
    try {
        const { companyId } = req.user;

        if (!companyId) {
            return res.status(400).json({ success: false, error: 'No company associated' });
        }

        const subscription = await subscriptionService.getCompanySubscription(companyId);
        const limits = await subscriptionService.getCompanyLimits(companyId);

        res.json({
            success: true,
            data: {
                ...subscription,
                limits
            }
        });
    } catch (err) {
        console.error('Error fetching subscription:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch subscription' });
    }
}

// Create payment order for upgrade
export async function createOrder(req, res) {
    try {
        const { companyId } = req.user;
        const { planId, billingCycle = 'monthly' } = req.body;

        if (!companyId) {
            return res.status(400).json({ success: false, error: 'No company associated' });
        }

        if (!planId) {
            return res.status(400).json({ success: false, error: 'Plan ID required' });
        }

        const result = await subscriptionService.createPaymentOrder(companyId, planId, billingCycle);
        res.json(result);
    } catch (err) {
        console.error('Error creating order:', err);
        res.status(500).json({ success: false, error: err.message || 'Failed to create order' });
    }
}

// Verify payment after Razorpay checkout
export async function verifyPayment(req, res) {
    try {
        const { companyId } = req.user;
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!companyId) {
            return res.status(400).json({ success: false, error: 'No company associated' });
        }

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, error: 'Missing payment details' });
        }

        const result = await subscriptionService.verifyPayment(companyId, {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        });

        res.json(result);
    } catch (err) {
        console.error('Error verifying payment:', err);
        res.status(500).json({ success: false, error: err.message || 'Payment verification failed' });
    }
}

// Handle Razorpay webhook
export async function handleWebhook(req, res) {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const result = await subscriptionService.handleWebhook(req.body, signature);
        res.json(result);
    } catch (err) {
        console.error('Webhook error:', err);
        res.status(500).json({ success: false, error: 'Webhook processing failed' });
    }
}

// Check if company has access to a feature
export async function checkFeature(req, res) {
    try {
        const { companyId } = req.user;
        const { feature } = req.params;

        if (!companyId) {
            return res.status(400).json({ success: false, error: 'No company associated' });
        }

        const hasAccess = await subscriptionService.checkFeatureAccess(companyId, feature);
        res.json({ success: true, hasAccess, feature });
    } catch (err) {
        console.error('Error checking feature:', err);
        res.status(500).json({ success: false, error: 'Failed to check feature access' });
    }
}

// Get payment history
export async function getPaymentHistory(req, res) {
    try {
        const { companyId } = req.user;

        if (!companyId) {
            return res.status(400).json({ success: false, error: 'No company associated' });
        }

        const history = await subscriptionService.getPaymentHistory(companyId);

        // Format for display
        const formattedHistory = history.map(payment => ({
            ...payment,
            amount_display: `₹${(payment.amount / 100).toLocaleString('en-IN')}`,
            date: new Date(payment.created_at).toLocaleDateString('en-IN')
        }));

        res.json({ success: true, data: formattedHistory });
    } catch (err) {
        console.error('Error fetching payment history:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch payment history' });
    }
}

// Upgrade to free plan (no payment needed)
export async function upgradeFree(req, res) {
    try {
        const { companyId } = req.user;
        const { planId } = req.body;

        if (!companyId) {
            return res.status(400).json({ success: false, error: 'No company associated' });
        }

        const plan = await subscriptionService.getPlanById(planId);

        if (!plan) {
            return res.status(404).json({ success: false, error: 'Plan not found' });
        }

        if (plan.price_monthly > 0) {
            return res.status(400).json({ success: false, error: 'This plan requires payment' });
        }

        await subscriptionService.updateCompanyPlan(companyId, planId, 'monthly');
        res.json({ success: true, message: 'Upgraded to free plan' });
    } catch (err) {
        console.error('Error upgrading:', err);
        res.status(500).json({ success: false, error: 'Failed to upgrade' });
    }
}

// Cancel subscription
export async function cancelSubscription(req, res) {
    try {
        const { companyId } = req.user;
        const { reason } = req.body;

        if (!companyId) {
            return res.status(400).json({ success: false, error: 'No company associated' });
        }

        const result = await subscriptionService.cancelSubscription(companyId, reason);
        res.json(result);
    } catch (err) {
        console.error('Error cancelling subscription:', err);
        res.status(400).json({ success: false, error: err.message || 'Failed to cancel subscription' });
    }
}

// Reactivate cancelled subscription
export async function reactivateSubscription(req, res) {
    try {
        const { companyId } = req.user;

        if (!companyId) {
            return res.status(400).json({ success: false, error: 'No company associated' });
        }

        const result = await subscriptionService.reactivateSubscription(companyId);
        res.json(result);
    } catch (err) {
        console.error('Error reactivating subscription:', err);
        res.status(400).json({ success: false, error: err.message || 'Failed to reactivate subscription' });
    }
}

// Change billing cycle
export async function changeBillingCycle(req, res) {
    try {
        const { companyId } = req.user;
        const { billingCycle } = req.body;

        if (!companyId) {
            return res.status(400).json({ success: false, error: 'No company associated' });
        }

        if (!billingCycle || !['monthly', 'yearly'].includes(billingCycle)) {
            return res.status(400).json({ success: false, error: 'Invalid billing cycle' });
        }

        const result = await subscriptionService.changeBillingCycle(companyId, billingCycle);
        res.json(result);
    } catch (err) {
        console.error('Error changing billing cycle:', err);
        res.status(400).json({ success: false, error: err.message || 'Failed to change billing cycle' });
    }
}

// Get subscription summary with all details
export async function getSubscriptionSummary(req, res) {
    try {
        const { companyId } = req.user;

        if (!companyId) {
            return res.status(400).json({ success: false, error: 'No company associated' });
        }

        const summary = await subscriptionService.getSubscriptionSummary(companyId);
        res.json({ success: true, data: summary });
    } catch (err) {
        console.error('Error fetching subscription summary:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch subscription summary' });
    }
}
