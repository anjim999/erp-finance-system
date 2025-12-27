// src/components/pricing/BillingToggle.jsx

export default function BillingToggle({ billingCycle, setBillingCycle }) {
    return (
        <div className="inline-flex items-center bg-gray-800/50 rounded-full p-1">
            <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${billingCycle === 'monthly'
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
            >
                Monthly
            </button>
            <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${billingCycle === 'yearly'
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
            >
                Yearly
                <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                    Save 17%
                </span>
            </button>
        </div>
    );
}
