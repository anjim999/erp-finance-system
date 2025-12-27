// src/pages/pricing/PricingPage.jsx
import { useState } from 'react';
import { FiLoader } from 'react-icons/fi';
import { usePricing } from '../../hooks/pricing/usePricing';
import { useCheckout } from '../../hooks/pricing/useCheckout';
import { PlanCard, BillingToggle, FeatureComparison, PricingFAQ } from '../../components/pricing';

export default function PricingPage() {
    const [billingCycle, setBillingCycle] = useState('monthly');
    const { plans, currentPlan, setCurrentPlan, loading, error, setError, user } = usePricing();
    const { processingPlan, handleSelectPlan } = useCheckout({ user, setCurrentPlan, setError });

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
                <FiLoader className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Choose the perfect plan for your business. All plans include core features.
                        Upgrade or downgrade anytime.
                    </p>
                    <div className="mt-8">
                        <BillingToggle billingCycle={billingCycle} setBillingCycle={setBillingCycle} />
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="max-w-md mx-auto mb-8 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-center">
                        {error}
                    </div>
                )}

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map((plan) => (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            billingCycle={billingCycle}
                            currentPlan={currentPlan}
                            processingPlan={processingPlan}
                            onSelect={(p) => handleSelectPlan(p, billingCycle)}
                        />
                    ))}
                </div>

                {/* Contact Sales CTA */}
                <div className="mt-16 text-center">
                    <p className="text-gray-400 mb-4">
                        Need a custom plan? Contact our sales team.
                    </p>
                    <a
                        href="mailto:sales@vyapar360.com"
                        className="inline-flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    >
                        Contact Sales
                    </a>
                </div>

                {/* Feature Comparison Table */}
                <FeatureComparison plans={plans} />

                {/* FAQ Section */}
                <PricingFAQ />
            </div>
        </div>
    );
}
