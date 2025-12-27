// src/components/settings/BillingSettings.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCreditCard, FiCheck, FiArrowUpRight, FiLoader, FiCalendar, FiZap, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { Card, Button } from '../common';
import {
    getSubscriptionSummary,
    getPaymentHistory,
    cancelSubscription,
    reactivateSubscription,
    changeBillingCycle
} from '../../services/subscriptionService';

export default function BillingSettings() {
    const navigate = useNavigate();
    const [subscription, setSubscription] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    useEffect(() => {
        loadBillingData();
    }, []);

    async function loadBillingData() {
        try {
            setLoading(true);
            const [subRes, payRes] = await Promise.all([
                getSubscriptionSummary(),
                getPaymentHistory()
            ]);
            if (subRes.success) setSubscription(subRes.data);
            if (payRes.success) setPayments(payRes.data);
        } catch (err) {
            console.error('Failed to load billing data:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleCancelSubscription() {
        try {
            setActionLoading('cancel');
            const result = await cancelSubscription(cancelReason);
            if (result.success) {
                toast.success(result.message);
                setShowCancelModal(false);
                loadBillingData();
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to cancel subscription');
        } finally {
            setActionLoading(null);
        }
    }

    async function handleReactivate() {
        try {
            setActionLoading('reactivate');
            const result = await reactivateSubscription();
            if (result.success) {
                toast.success(result.message);
                loadBillingData();
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to reactivate subscription');
        } finally {
            setActionLoading(null);
        }
    }

    async function handleChangeBillingCycle(newCycle) {
        try {
            setActionLoading('billing');
            const result = await changeBillingCycle(newCycle);
            if (result.success) {
                toast.success(result.message);
                loadBillingData();
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to change billing cycle');
        } finally {
            setActionLoading(null);
        }
    }

    if (loading) {
        return (
            <Card title="Billing & Subscription" padding="lg">
                <div className="flex items-center justify-center py-12">
                    <FiLoader className="w-6 h-6 animate-spin theme-text-muted" />
                </div>
            </Card>
        );
    }

    const planColors = {
        free: 'text-gray-400',
        starter: 'text-blue-500',
        professional: 'text-purple-500',
        enterprise: 'text-amber-500'
    };

    return (
        <div className="space-y-6">
            {/* Current Plan */}
            <Card title="Current Plan" padding="lg">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500`}>
                            <FiZap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className={`text-xl font-bold ${planColors[subscription?.plan_name] || 'theme-text-primary'}`}>
                                    {subscription?.plan_display_name || 'Free'} Plan
                                </h3>
                                {subscription?.is_cancelled && (
                                    <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                                        Cancelled
                                    </span>
                                )}
                            </div>
                            <p className="theme-text-muted text-sm mt-1">
                                {subscription?.max_users === -1 ? 'Unlimited' : subscription?.max_users || 5} users •
                                {subscription?.billing_cycle === 'yearly' ? ' Annual billing' : ' Monthly billing'}
                            </p>
                            {subscription?.end_date && (
                                <p className="text-sm mt-2 flex items-center gap-1 theme-text-muted">
                                    <FiCalendar className="w-4 h-4" />
                                    {subscription?.is_cancelled ? 'Access until' : 'Renews on'} {new Date(subscription.end_date).toLocaleDateString('en-IN')}
                                    {subscription?.days_remaining && ` (${subscription.days_remaining} days)`}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Button
                            variant="primary"
                            icon={<FiArrowUpRight />}
                            onClick={() => navigate('/pricing')}
                        >
                            {subscription?.plan_name === 'enterprise' ? 'Manage Plan' : 'Upgrade'}
                        </Button>
                        {subscription?.can_reactivate && (
                            <Button
                                variant="success"
                                icon={actionLoading === 'reactivate' ? <FiLoader className="animate-spin" /> : <FiRefreshCw />}
                                onClick={handleReactivate}
                                disabled={actionLoading === 'reactivate'}
                            >
                                Reactivate
                            </Button>
                        )}
                    </div>
                </div>

                {/* Features included */}
                <div className="mt-6 pt-6 border-t theme-border">
                    <p className="text-sm font-medium theme-text-secondary mb-3">Features included:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {subscription?.features && Object.entries(subscription.features).map(([key, value]) => (
                            value === true && (
                                <div key={key} className="flex items-center gap-2 text-sm">
                                    <FiCheck className="w-4 h-4 text-green-500" />
                                    <span className="theme-text-muted capitalize">{key.replace('_', ' ')}</span>
                                </div>
                            )
                        ))}
                    </div>
                </div>
            </Card>

            {/* Billing Cycle */}
            {subscription?.plan_name !== 'free' && !subscription?.is_cancelled && (
                <Card title="Billing Cycle" padding="lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <p className="theme-text-primary font-medium">
                                Currently on <span className="capitalize">{subscription?.billing_cycle}</span> billing
                            </p>
                            <p className="text-sm theme-text-muted mt-1">
                                {subscription?.billing_cycle === 'monthly'
                                    ? 'Switch to yearly billing and save 17%!'
                                    : 'You are saving 17% with annual billing'}
                            </p>
                        </div>
                        {subscription?.billing_cycle === 'monthly' ? (
                            <Button
                                variant="secondary"
                                onClick={() => handleChangeBillingCycle('yearly')}
                                disabled={actionLoading === 'billing'}
                            >
                                {actionLoading === 'billing' ? <FiLoader className="animate-spin mr-2" /> : null}
                                Switch to Yearly
                            </Button>
                        ) : (
                            <Button
                                variant="secondary"
                                onClick={() => handleChangeBillingCycle('monthly')}
                                disabled={actionLoading === 'billing'}
                            >
                                {actionLoading === 'billing' ? <FiLoader className="animate-spin mr-2" /> : null}
                                Switch to Monthly
                            </Button>
                        )}
                    </div>
                </Card>
            )}

            {/* Usage Stats */}
            <Card title="Usage" padding="lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg theme-bg-tertiary">
                        <p className="text-sm theme-text-muted">Users</p>
                        <p className="text-2xl font-bold theme-text-primary mt-1">
                            {subscription?.current_users || 1}
                            <span className="text-sm font-normal theme-text-muted">
                                / {subscription?.max_users === -1 ? '∞' : subscription?.max_users || 5}
                            </span>
                        </p>
                    </div>
                    <div className="p-4 rounded-lg theme-bg-tertiary">
                        <p className="text-sm theme-text-muted">Storage</p>
                        <p className="text-2xl font-bold theme-text-primary mt-1">
                            0.2 GB
                            <span className="text-sm font-normal theme-text-muted">
                                / {subscription?.max_storage_gb || 1} GB
                            </span>
                        </p>
                    </div>
                    <div className="p-4 rounded-lg theme-bg-tertiary">
                        <p className="text-sm theme-text-muted">API Calls</p>
                        <p className="text-2xl font-bold theme-text-primary mt-1">
                            {subscription?.features?.api ? '∞' : 'N/A'}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Payment History */}
            <Card title="Payment History" padding="lg">
                {payments.length === 0 ? (
                    <div className="text-center py-8">
                        <FiCreditCard className="w-10 h-10 mx-auto theme-text-muted mb-3" />
                        <p className="theme-text-muted">No payment history yet</p>
                        <p className="text-sm theme-text-muted mt-1">
                            Payments will appear here after you upgrade
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b theme-border">
                                    <th className="text-left py-3 px-2 text-sm font-medium theme-text-secondary">Date</th>
                                    <th className="text-left py-3 px-2 text-sm font-medium theme-text-secondary">Amount</th>
                                    <th className="text-left py-3 px-2 text-sm font-medium theme-text-secondary">Plan</th>
                                    <th className="text-left py-3 px-2 text-sm font-medium theme-text-secondary">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((payment) => (
                                    <tr key={payment.id} className="border-b theme-border">
                                        <td className="py-3 px-2 text-sm theme-text-primary">{payment.date}</td>
                                        <td className="py-3 px-2 text-sm font-medium theme-text-primary">{payment.amount_display}</td>
                                        <td className="py-3 px-2 text-sm theme-text-muted">{payment.plan_name || '-'}</td>
                                        <td className="py-3 px-2">
                                            <span className={`px-2 py-1 text-xs rounded-full ${payment.status === 'success'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : payment.status === 'failed'
                                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                }`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Cancel Subscription */}
            {subscription?.can_cancel && (
                <Card padding="lg">
                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                            <FiAlertTriangle className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium theme-text-primary">Cancel Subscription</h4>
                            <p className="text-sm theme-text-muted mt-1">
                                You'll continue to have access until the end of your billing period.
                            </p>
                        </div>
                        <Button
                            variant="danger"
                            onClick={() => setShowCancelModal(true)}
                        >
                            Cancel Plan
                        </Button>
                    </div>
                </Card>
            )}

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold theme-text-primary mb-4">Cancel Subscription?</h3>
                        <p className="theme-text-muted text-sm mb-4">
                            You'll continue to have access to your current plan until{' '}
                            <strong>{new Date(subscription?.end_date).toLocaleDateString('en-IN')}</strong>.
                            After that, you'll be downgraded to the Free plan.
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium theme-text-secondary mb-2">
                                Reason for cancellation (optional)
                            </label>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg theme-bg-secondary theme-border theme-text-primary"
                                rows={3}
                                placeholder="Help us improve by sharing your feedback..."
                            />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
                                Keep Plan
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleCancelSubscription}
                                disabled={actionLoading === 'cancel'}
                            >
                                {actionLoading === 'cancel' ? <FiLoader className="animate-spin mr-2" /> : null}
                                Confirm Cancellation
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
