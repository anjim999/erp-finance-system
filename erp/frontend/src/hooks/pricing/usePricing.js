// src/hooks/pricing/usePricing.js
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPlans, getCurrentSubscription } from '../../services/subscriptionService';

export function usePricing() {
    const { user } = useAuth();
    const [plans, setPlans] = useState([]);
    const [currentPlan, setCurrentPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, [user]);

    async function loadData() {
        try {
            setLoading(true);
            const plansRes = await getPlans();
            if (plansRes.success) {
                setPlans(plansRes.data);
            }

            if (user?.companyId) {
                try {
                    const subRes = await getCurrentSubscription();
                    if (subRes.success) {
                        setCurrentPlan(subRes.data.plan_name);
                    }
                } catch (e) {
                    // Might not have subscription yet
                }
            }
        } catch (err) {
            setError('Failed to load plans');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    return {
        plans,
        currentPlan,
        setCurrentPlan,
        loading,
        error,
        setError,
        user
    };
}
