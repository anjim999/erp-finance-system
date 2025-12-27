// src/routes/subscriptions.js
import express from 'express';
import { authMiddleware, requireCompany } from '../middleware/auth.js';
import * as subscriptionController from '../controllers/subscription/subscriptionController.js';

const router = express.Router();

// =====================================================
// PUBLIC ROUTES (No auth required)
// =====================================================

// Get all plans (public - for pricing page)
router.get('/plans', subscriptionController.getPlans);

// Razorpay webhook (no auth, verified by signature)
router.post('/webhook', express.raw({ type: 'application/json' }), subscriptionController.handleWebhook);

// =====================================================
// PROTECTED ROUTES (Auth required)
// =====================================================

// Get current subscription
router.get('/current', authMiddleware, requireCompany, subscriptionController.getCurrentSubscription);

// Check feature access
router.get('/feature/:feature', authMiddleware, requireCompany, subscriptionController.checkFeature);

// Get payment history
router.get('/payments', authMiddleware, requireCompany, subscriptionController.getPaymentHistory);

// Create payment order for subscription
router.post('/create-order', authMiddleware, requireCompany, subscriptionController.createOrder);

// Verify payment after Razorpay checkout
router.post('/verify-payment', authMiddleware, requireCompany, subscriptionController.verifyPayment);

// Upgrade to free plan
router.post('/upgrade-free', authMiddleware, requireCompany, subscriptionController.upgradeFree);

// Get subscription summary
router.get('/summary', authMiddleware, requireCompany, subscriptionController.getSubscriptionSummary);

// Cancel subscription
router.post('/cancel', authMiddleware, requireCompany, subscriptionController.cancelSubscription);

// Reactivate subscription
router.post('/reactivate', authMiddleware, requireCompany, subscriptionController.reactivateSubscription);

// Change billing cycle
router.post('/change-billing-cycle', authMiddleware, requireCompany, subscriptionController.changeBillingCycle);

export default router;
