import React from 'react';
import { useNavigate } from 'react-router-dom';

// Define images with target routes
const cards = [
  { src: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80', route: 'dashboard', label: 'Dashboard' },
  { src: 'https://images.unsplash.com/photo-1583454110551-21f0fa5dd3cb?auto=format&fit=crop&w=800&q=80', route: 'exercise', label: 'Exercise' },
  { src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80', route: 'food', label: 'Food' },
  { src: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?auto=format&fit=crop&w=800&q=80', route: 'steps', label: 'Steps' },
  { src: 'https://images.unsplash.com/photo-1526401485004-2c1f4d9c1b7b?auto=format&fit=crop&w=800&q=80', route: 'goals', label: 'Goals' },
  { src: 'https://images.unsplash.com/photo-1519985176271-adb1088fa94c?auto=format&fit=crop&w=800&q=80', route: 'pricing', label: 'Pricing' },
];

export default function HomePage() {
  const navigate = useNavigate();
  return (
    <div className="max-w-6xl mx-auto py-12 px-4 md:px-8">
      <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-8">
        Welcome to Habitly
      </h1>
      <p className="text-lg text-zinc-300 text-center mb-12 max-w-3xl mx-auto">
        Track your workouts, water, sleep, steps, meals and gain insights with AI. All in one sleek, dark‑themed app.
      </p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className="relative rounded-lg overflow-hidden shadow-lg cursor-pointer"
            onClick={() => navigate(card.route)}
          >
            <img
              src={card.src}
              alt={card.label}
              className="w-full h-48 object-cover transition-transform duration-300 hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <span className="text-white text-xl font-medium">{card.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
