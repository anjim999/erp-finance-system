// src/components/pricing/PricingFAQ.jsx

const faqs = [
    {
        q: 'Can I change my plan later?',
        a: 'Yes! You can upgrade or downgrade your plan at any time. When upgrading, you\'ll be charged the prorated difference.'
    },
    {
        q: 'Is there a free trial?',
        a: 'Our Free plan lets you try core features forever. For paid plans, contact our sales team for a demo.'
    },
    {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit/debit cards, UPI, Net Banking, and wallets through Razorpay.'
    },
    {
        q: 'Can I get a refund?',
        a: 'Yes, we offer a 7-day money-back guarantee on all paid plans. No questions asked.'
    }
];

export default function PricingFAQ() {
    return (
        <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
                Frequently Asked Questions
            </h2>
            <div className="space-y-4">
                {faqs.map((faq, idx) => (
                    <div key={idx} className="bg-gray-800/50 rounded-xl p-5">
                        <h4 className="text-white font-medium mb-2">{faq.q}</h4>
                        <p className="text-gray-400 text-sm">{faq.a}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
