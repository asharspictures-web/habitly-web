import React from 'react';
import { Bot, Sparkles, Activity, ArrowRight, ChevronRight, Dumbbell, Utensils } from 'lucide-react';

export default function HomePage({ onNavigate }) {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 animate-in fade-in duration-700 min-h-screen flex flex-col">
      
      {/* Mini Nav for logged-out view */}
      <div className="flex items-center justify-between py-6">
        <div className="flex items-center space-x-3">
          <img 
            src="/logo.jpg" 
            alt="Habitly" 
            className="w-10 h-10 rounded-xl object-cover border border-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.25)]"
          />
          <span className="text-2xl font-black tracking-tight text-white">Habitly</span>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => onNavigate('pricing')} 
            className="text-sm font-bold text-zinc-300 hover:text-white transition-colors"
          >
            Pricing
          </button>
          <button 
            onClick={() => onNavigate('dashboard')} 
            className="bg-[#27272a] hover:bg-[#3f3f46] text-white text-sm font-bold px-5 py-2 rounded-lg transition-colors border border-[#3f3f46]"
          >
            Log In
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col justify-center text-center mt-10 mb-20 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="inline-flex items-center space-x-2 bg-[#27272a]/50 text-amber-500 border border-[#27272a] rounded-full px-4 py-1.5 text-sm font-bold mb-6">
          <Sparkles size={16} />
          <span>Now with Premium AI Coaching</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-6 leading-tight">
          Master your habits with <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-800">Habitly Intelligence.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          The ultimate dark-mode dashboard for tracking your fitness journey. Log your workouts, meals, water, and sleep—then let our AI build your perfect routine.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-4 rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
          >
            <span>Enter Dashboard</span>
            <ArrowRight size={20} />
          </button>
          <button 
            onClick={() => onNavigate('pricing')}
            className="w-full sm:w-auto bg-[#18181b] border border-[#27272a] hover:bg-[#27272a] text-white font-bold px-8 py-4 rounded-xl transition-all active:scale-95"
          >
            View Pricing
          </button>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid md:grid-cols-3 gap-6 mt-24">
        
        <div className="bg-[#18181b] border border-[#27272a] p-8 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={100} />
          </div>
          <div className="bg-[#27272a] w-12 h-12 rounded-xl flex items-center justify-center mb-6">
            <Activity className="text-white" size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Frictionless Logging</h3>
          <p className="text-zinc-400 leading-relaxed">
            Quickly track your daily steps, water intake, sleep, and workouts with our minimalist, distraction-free interface.
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#18181b] to-red-900/10 border border-red-500/20 p-8 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Bot size={100} />
          </div>
          <div className="bg-red-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
            <Bot className="text-red-500" size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">AI Assistant</h3>
          <p className="text-zinc-400 leading-relaxed">
            Chat with your personal AI coach. Just type what you ate, and the AI will automatically extract calories and macros for you.
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#18181b] to-amber-900/10 border border-amber-500/30 p-8 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles size={100} />
          </div>
          <div className="bg-amber-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
            <Sparkles className="text-amber-500" size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Premium Plans</h3>
          <p className="text-zinc-400 leading-relaxed">
            Generate highly personalized nutrition macros and custom workout routines based on your unique body metrics and goals.
          </p>
        </div>

      </div>

    </div>
  );
}
