// src/hooks/pricing/useCheckout.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder, verifyPayment, upgradeFree } from '../../services/subscriptionService';

export function useCheckout({ user, setCurrentPlan, setError }) {
    const navigate = useNavigate();
    const [processingPlan, setProcessingPlan] = useState(null);

    async function handleSelectPlan(plan, billingCycle) {
        // If not logged in, redirect to register
        if (!user) {
            navigate('/register', { state: { selectedPlan: plan.name } });
            return;
        }

        // If no company, redirect to create company
        if (!user.companyId) {
            navigate('/request-company', { state: { selectedPlan: plan.name } });
            return;
        }

        setProcessingPlan(plan.id);
        setError(null);

        try {
            // Free plan - no payment needed
            if (plan.price_monthly === 0) {
                const result = await upgradeFree(plan.id);
                if (result.success) {
                    setCurrentPlan(plan.name);
                    alert('Successfully upgraded to Free plan!');
                }
                setProcessingPlan(null);
                return;
            }

            // Paid plan - create Razorpay order
            const orderRes = await createOrder(plan.id, billingCycle);

            if (!orderRes.success) {
                throw new Error(orderRes.error || 'Failed to create order');
            }

            if (orderRes.free) {
                setCurrentPlan(plan.name);
                alert('Successfully upgraded!');
                setProcessingPlan(null);
                return;
            }

            // Open Razorpay checkout
            openRazorpayCheckout(orderRes, plan, billingCycle);

        } catch (err) {
            setError(err.message || 'Failed to process');
            console.error(err);
            setProcessingPlan(null);
        }
    }

    function openRazorpayCheckout(orderRes, plan, billingCycle) {
        const options = {
            key: orderRes.order.key,
            amount: orderRes.order.amount,
            currency: orderRes.order.currency,
            name: 'Vyapar360',
            description: `${plan.display_name} Plan - ${billingCycle}`,
            order_id: orderRes.order.id,
            handler: async function (response) {
                try {
                    const verifyRes = await verifyPayment({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature
                    });

                    if (verifyRes.success) {
                        setCurrentPlan(plan.name);
                        alert('🎉 Payment successful! Your subscription is now active.');
                        navigate('/dashboard');
                    }
                } catch (err) {
                    setError('Payment verification failed');
                    console.error(err);
                }
                setProcessingPlan(null);
            },
            prefill: {
                name: user.name,
                email: user.email
            },
            theme: { color: '#7c3aed' },
            modal: {
                ondismiss: function () {
                    setProcessingPlan(null);
                }
            }
        };

        if (window.Razorpay) {
            const rzp = new window.Razorpay(options);
            rzp.open();
        } else {
            alert('🧪 Test Mode: Razorpay SDK not loaded. Simulating successful payment...');
            setCurrentPlan(plan.name);
            setProcessingPlan(null);
        }
    }

    return { processingPlan, handleSelectPlan };
}
