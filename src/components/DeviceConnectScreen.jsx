import React, { useState, useEffect } from 'react';
import { Watch, X, AlertCircle, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

const WEARABLE_DEVICES = [
  {
    id: 'fitbit',
    name: 'Fitbit',
    subtitle: 'Activity & Sleep Tracker',
    category: 'Daily Steps, Sleep Stages & Heart Rate',
    icon: '⌚',
    brandColor: '#00B0B9',
    accentBorder: 'hover:border-teal-500/40',
    accentBg: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    status: 'Ready to Sync',
  },
  {
    id: 'apple',
    name: 'Apple Health',
    subtitle: 'Vitals & Motion Sync',
    category: 'Active Calories, Workouts & Biomarkers',
    icon: '🍎',
    brandColor: '#FA2D48',
    accentBorder: 'hover:border-rose-500/40',
    accentBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    status: 'Ready to Sync',
  },
  {
    id: 'whoop',
    name: 'Whoop',
    subtitle: 'Biometrics & Recovery',
    category: 'Strain, Recovery & Sleep Performance',
    icon: '⚫',
    brandColor: '#FF3344',
    accentBorder: 'hover:border-red-500/40',
    accentBg: 'bg-red-500/10 text-red-400 border-red-500/20',
    status: 'Ready to Sync',
  },
  {
    id: 'garmin',
    name: 'Garmin',
    subtitle: 'GPS Multisport & Vitals',
    category: 'Body Battery, GPS Runs & Training Load',
    icon: '🛰️',
    brandColor: '#007CC3',
    accentBorder: 'hover:border-cyan-500/40',
    accentBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    status: 'Ready to Sync',
  },
  {
    id: 'oura',
    name: 'Oura',
    subtitle: 'Sleep & Readiness Ring',
    category: 'Readiness Index, Night HRV & Temperature',
    icon: '💍',
    brandColor: '#D4AF37',
    accentBorder: 'hover:border-amber-500/40',
    accentBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    status: 'Ready to Sync',
  },
];

export default function DeviceConnectScreen({ onNavigate, onBack } = {}) {
  const [selectedDevice, setSelectedDevice] = useState(null);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedDevice(null);
      }
    };
    if (selectedDevice) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedDevice]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setSelectedDevice(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Hero Header with fitness background imagery and dark overlay */}
      <div className="relative overflow-hidden rounded-3xl border border-[#27272a] shadow-xl p-6 md:p-8">
        <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-25"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/85 to-[#09090b]/50"></div>
        <div className="absolute inset-0 bg-red-600/10 mix-blend-overlay"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center space-x-1.5 text-zinc-400 hover:text-white text-xs font-semibold mb-3 mr-3 bg-[#27272a]/80 hover:bg-[#27272a] px-3 py-1 rounded-full transition cursor-pointer"
              >
                <span>&larr; Back</span>
              </button>
            )}
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold mb-3">
              <Watch size={14} />
              <span>Wearable Hardware Integrations</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center space-x-3">
              <span>Connect Devices</span>
            </h2>
            <p className="text-zinc-400 text-sm mt-1 max-w-xl">
              Pair your favorite fitness trackers, smart watches, and rings to automatically synchronize activity, sleep, and recovery biometrics.
            </p>
          </div>
          
          <div className="hidden lg:flex items-center space-x-2 bg-[#18181b]/80 backdrop-blur-md border border-[#27272a] px-4 py-2 rounded-2xl text-xs text-zinc-400">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>End-to-End Privacy Guaranteed</span>
          </div>
        </div>
      </div>

      {/* Device Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <span>Supported Wearables</span>
            <span className="text-xs bg-[#27272a] text-zinc-400 font-semibold px-2 py-0.5 rounded-full">
              {WEARABLE_DEVICES.length}
            </span>
          </h3>
          <span className="text-xs text-zinc-500">Live API integrations coming soon</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {WEARABLE_DEVICES.map((device) => (
            <div
              key={device.id}
              className={`bg-[#18181b] border border-[#27272a] rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl ${device.accentBorder} group relative`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  {/* Brand Logo / Icon Badge */}
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl shadow-sm ${device.accentBg}`}>
                    {device.icon}
                  </div>
                  
                  {/* Status Badge */}
                  <span className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-zinc-700 bg-zinc-800/80 text-zinc-400 flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                    <span>{device.status}</span>
                  </span>
                </div>

                {/* Device Name and Category/Subtitle */}
                <h4 className="text-lg font-bold text-white tracking-tight group-hover:text-red-400 transition-colors">
                  {device.name}
                </h4>
                <p className="text-xs font-semibold text-zinc-400 mt-0.5">
                  {device.subtitle}
                </p>
                <p className="text-xs text-zinc-500 mt-2 line-clamp-2">
                  {device.category}
                </p>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-[#27272a]/60 flex items-center justify-between">
                <span className="text-[11px] text-zinc-500 font-medium">Auto-Sync</span>
                <button
                  type="button"
                  onClick={() => setSelectedDevice(device)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-[0_0_15px_rgba(239,68,68,0.2)] flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>Connect</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* "Coming Soon" Modal Dialog */}
      {selectedDevice && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="device-modal-title"
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div 
            className="bg-[#18181b] border border-[#27272a] rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedDevice(null)}
              aria-label="Close modal"
              className="absolute top-5 right-5 text-zinc-400 hover:text-white bg-[#27272a]/60 hover:bg-[#27272a] p-2 rounded-full transition cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Modal Device Header */}
            <div className="flex items-center space-x-3 mb-5">
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-2xl ${selectedDevice.accentBg}`}>
                {selectedDevice.icon}
              </div>
              <div>
                <h3 id="device-modal-title" className="text-xl font-black text-white">
                  Connect {selectedDevice.name}
                </h3>
                <p className="text-xs text-zinc-400">{selectedDevice.subtitle}</p>
              </div>
            </div>

            {/* Notice Callout */}
            <div className="bg-[#09090b] border border-amber-500/30 rounded-2xl p-4 my-5 space-y-2">
              <div className="flex items-center space-x-2 text-amber-400 text-sm font-bold">
                <AlertCircle size={18} className="flex-shrink-0" />
                <span>Coming soon, log manually for now</span>
              </div>
              <p className="text-zinc-300 text-xs md:text-sm leading-relaxed">
                Direct live synchronization with <strong className="text-white">{selectedDevice.name}</strong> is currently under active development. Please log your workouts, steps, water, and nutrition manually for now through Dashboard or Quick-Log.
              </p>
            </div>

            {/* Guidance tips */}
            <div className="bg-[#27272a]/40 rounded-xl p-3 border border-[#27272a] mb-6">
              <p className="text-zinc-400 text-xs flex items-center space-x-2">
                <Sparkles size={14} className="text-red-400 flex-shrink-0" />
                <span>Tip: Use the quick-log floating button (+) on your Dashboard for instant 1-tap logging.</span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setSelectedDevice(null)}
                className="flex-1 bg-[#27272a] hover:bg-[#3f3f46] text-white py-3 px-4 rounded-xl font-semibold text-sm transition cursor-pointer"
              >
                Got It
              </button>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDevice(null);
                    onNavigate('exercise');
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-500 active:scale-95 text-white py-3 px-4 rounded-xl font-bold text-sm transition shadow-[0_0_15px_rgba(239,68,68,0.25)] cursor-pointer"
                >
                  Log Manually
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
