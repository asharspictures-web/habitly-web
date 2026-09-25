import React from 'react';

export default function PricingPage() {
  const tiers = [
    { name: 'Basic', price: '$5/mo', features: ['Log workouts', 'Track water', 'Basic dashboard'] },
    { name: 'Pro', price: '$12/mo', features: ['All Basic features', 'Advanced analytics', 'AI suggestions', 'Priority support'] },
    { name: 'Premium', price: '$20/mo', features: ['All Pro features', 'Personalized coaching', 'Multi‑device sync', 'Early access to new features'] },
  ];
  return (
    <div className="max-w-5xl mx-auto py-12 px-4 md:px-8">
      <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-8">Habitly Pricing</h1>
      <p className="text-lg text-zinc-300 text-center mb-12 max-w-2xl mx-auto">
        Choose the plan that fits your fitness journey. All plans include unlimited logging and a dark‑mode UI.
      </p>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {tiers.map((tier) => (
          <div key={tier.name} className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 shadow-lg flex flex-col">
            <h2 className="text-2xl font-semibold text-white mb-4 text-center">{tier.name}</h2>
            <p className="text-3xl font-bold text-red-500 mb-6 text-center">{tier.price}</p>
            <ul className="flex-1 mb-6 space-y-2">
              {tier.features.map((feat, i) => (
                <li key={i} className="text-zinc-300 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 5.292a1 1 0 010 1.416l-7.5 7.5a1 1 0 01-1.416 0l-3.5-3.5a1 1 0 111.416-1.416L9 12.085l6.792-6.793a1 1 0 011.416 0z" clipRule="evenodd"/></svg>
                  {feat}
                </li>
              ))}
            </ul>
            <button className="mt-auto bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition-colors">
              Choose {tier.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
