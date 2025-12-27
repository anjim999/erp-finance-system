// src/components/pricing/PlanCard.jsx
import { FiCheck, FiX, FiLoader, FiZap, FiStar, FiShield, FiAward } from 'react-icons/fi';

const planIcons = {
    free: FiZap,
    starter: FiStar,
    professional: FiShield,
    enterprise: FiAward
};

const planColors = {
    free: 'from-gray-500 to-gray-600',
    starter: 'from-blue-500 to-blue-600',
    professional: 'from-purple-500 to-violet-600',
    enterprise: 'from-amber-500 to-orange-600'
};

function getFeatureList(features) {
    const allFeatures = [
        { key: 'hr', label: 'HR Management' },
        { key: 'finance', label: 'Finance & Invoicing' },
        { key: 'inventory', label: 'Inventory Management' },
        { key: 'crm', label: 'CRM & Sales' },
        { key: 'projects', label: 'Project Management' },
        { key: 'teams', label: 'Team Chat' },
        { key: 'api', label: 'API Access' },
        { key: 'ai_insights', label: 'AI Insights' }
    ];

    return allFeatures.map(f => ({
        ...f,
        enabled: features[f.key] === true
    }));
}

export default function PlanCard({ plan, billingCycle, currentPlan, processingPlan, onSelect }) {
    const Icon = planIcons[plan.name] || FiZap;
    const isCurrentPlan = currentPlan === plan.name;
    const isProfessional = plan.name === 'professional';

    return (
        <div className={`relative rounded-2xl overflow-hidden ${isProfessional ? 'ring-2 ring-purple-500 shadow-lg shadow-purple-500/20' : ''
            }`}>
            {/* Popular Badge */}
            {isProfessional && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-500 to-violet-500 text-white text-xs font-bold text-center py-1.5">
                    MOST POPULAR
                </div>
            )}

            <div className={`bg-gray-800/50 backdrop-blur-sm p-6 h-full flex flex-col ${isProfessional ? 'pt-10' : ''}`}>
                {/* Plan Header */}
                <div className="text-center mb-6">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${planColors[plan.name]} mb-4`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">{plan.display_name}</h3>
                    <p className="text-gray-400 text-sm mt-1">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center">
                        <span className="text-4xl font-bold text-white">
                            {billingCycle === 'monthly'
                                ? plan.price_monthly_display
                                : plan.price_yearly_display}
                        </span>
                        {plan.price_monthly > 0 && (
                            <span className="text-gray-400 ml-1">
                                /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                            </span>
                        )}
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                        {plan.max_users === -1 ? 'Unlimited' : plan.max_users} users
                    </p>
                </div>

                {/* Features */}
                <div className="flex-1 mb-6">
                    <ul className="space-y-3">
                        {getFeatureList(plan.features).map((feature) => (
                            <li key={feature.key} className="flex items-center text-sm">
                                {feature.enabled ? (
                                    <FiCheck className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                                ) : (
                                    <FiX className="w-4 h-4 text-gray-600 mr-2 flex-shrink-0" />
                                )}
                                <span className={feature.enabled ? 'text-gray-300' : 'text-gray-600'}>
                                    {feature.label}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* CTA Button */}
                <button
                    onClick={() => onSelect(plan)}
                    disabled={isCurrentPlan || processingPlan === plan.id}
                    className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${isCurrentPlan
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : isProfessional
                            ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white hover:from-purple-600 hover:to-violet-600 shadow-lg shadow-purple-500/25'
                            : 'bg-gray-700 text-white hover:bg-gray-600'
                        }`}
                >
                    {processingPlan === plan.id ? (
                        <span className="flex items-center justify-center">
                            <FiLoader className="w-4 h-4 animate-spin mr-2" />
                            Processing...
                        </span>
                    ) : isCurrentPlan ? (
                        'Current Plan'
                    ) : plan.price_monthly === 0 ? (
                        'Get Started Free'
                    ) : (
                        'Upgrade Now'
                    )}
                </button>
            </div>
        </div>
    );
}
