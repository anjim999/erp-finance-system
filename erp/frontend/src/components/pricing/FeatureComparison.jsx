// src/components/pricing/FeatureComparison.jsx
import { FiCheck, FiX } from 'react-icons/fi';

const comparisonRows = [
    { key: 'max_users', label: 'Users', format: (v) => v === -1 ? 'Unlimited' : v },
    { key: 'max_storage_gb', label: 'Storage', format: (v) => `${v} GB` },
    { key: 'hr', label: 'HR Module', isBool: true },
    { key: 'finance', label: 'Finance Module', isBool: true },
    { key: 'inventory', label: 'Inventory', isBool: true },
    { key: 'crm', label: 'CRM', isBool: true },
    { key: 'projects', label: 'Projects', isBool: true },
    { key: 'teams', label: 'Team Chat', isBool: true },
    { key: 'api', label: 'API Access', isBool: true },
    { key: 'ai_insights', label: 'AI Insights', isBool: true },
    { key: 'support', label: 'Support', format: (v) => v?.charAt(0).toUpperCase() + v?.slice(1) }
];

export default function FeatureComparison({ plans }) {
    return (
        <div className="mt-20">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
                Compare All Features
            </h2>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-700">
                            <th className="text-left py-4 px-4 text-gray-400 font-medium">Feature</th>
                            {plans.map(plan => (
                                <th key={plan.id} className="text-center py-4 px-4 text-white font-medium">
                                    {plan.display_name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {comparisonRows.map((row, idx) => (
                            <tr key={row.key} className={idx % 2 === 0 ? 'bg-gray-800/30' : ''}>
                                <td className="py-3 px-4 text-gray-300">{row.label}</td>
                                {plans.map(plan => {
                                    const value = row.isBool
                                        ? plan.features[row.key]
                                        : (row.key === 'support' ? plan.features[row.key] : plan[row.key]);

                                    return (
                                        <td key={plan.id} className="text-center py-3 px-4">
                                            {row.isBool ? (
                                                value ? (
                                                    <FiCheck className="w-5 h-5 text-green-400 mx-auto" />
                                                ) : (
                                                    <FiX className="w-5 h-5 text-gray-600 mx-auto" />
                                                )
                                            ) : (
                                                <span className="text-gray-300">
                                                    {row.format ? row.format(value) : value}
                                                </span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
