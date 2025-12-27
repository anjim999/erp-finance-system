// src/services/subscriptionService.js
import api from '../api/axiosClient';

// Get all subscription plans (public - no auth needed)
export async function getPlans() {
    const response = await api.get('/api/subscriptions/plans');
    return response.data;
}

// Get current company subscription
export async function getCurrentSubscription() {
    const response = await api.get('/api/subscriptions/current');
    return response.data;
}

// Check feature access
export async function checkFeatureAccess(feature) {
    const response = await api.get(`/api/subscriptions/feature/${feature}`);
    return response.data;
}

// Create payment order for upgrade
export async function createOrder(planId, billingCycle = 'monthly') {
    const response = await api.post('/api/subscriptions/create-order', { planId, billingCycle });
    return response.data;
}

// Verify payment after Razorpay checkout
export async function verifyPayment(paymentData) {
    const response = await api.post('/api/subscriptions/verify-payment', paymentData);
    return response.data;
}

// Upgrade to free plan
export async function upgradeFree(planId) {
    const response = await api.post('/api/subscriptions/upgrade-free', { planId });
    return response.data;
}

// Get payment history
export async function getPaymentHistory() {
    const response = await api.get('/api/subscriptions/payments');
    return response.data;
}

// Get subscription summary with all details
export async function getSubscriptionSummary() {
    const response = await api.get('/api/subscriptions/summary');
    return response.data;
}

// Cancel subscription
export async function cancelSubscription(reason = '') {
    const response = await api.post('/api/subscriptions/cancel', { reason });
    return response.data;
}

// Reactivate cancelled subscription
export async function reactivateSubscription() {
    const response = await api.post('/api/subscriptions/reactivate');
    return response.data;
}

// Change billing cycle
export async function changeBillingCycle(billingCycle) {
    const response = await api.post('/api/subscriptions/change-billing-cycle', { billingCycle });
    return response.data;
}

export default {
    getPlans,
    getCurrentSubscription,
    checkFeatureAccess,
    createOrder,
    verifyPayment,
    upgradeFree,
    getPaymentHistory,
    getSubscriptionSummary,
    cancelSubscription,
    reactivateSubscription,
    changeBillingCycle
};
