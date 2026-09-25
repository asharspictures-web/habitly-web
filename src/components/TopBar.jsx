import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Bell, BellOff, LogOut, Dumbbell, Utensils, X, Check } from 'lucide-react';

export function TopBar({ searchQuery = '', setSearchQuery = () => {}, habits = [], setCurrentView = () => {}, tier = 'free', updateTier = () => {} }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const searchContainerRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNotifOpen(false);
        setIsProfileOpen(false);
        if (searchInputRef.current) {
          searchInputRef.current.blur();
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Collect all historical logged entries from habits (workouts and foods)
  const historicalEntries = useMemo(() => {
    const list = [];
    (habits || []).forEach(day => {
      // Workouts
      (day.workouts || []).forEach((w, idx) => {
        list.push({
          id: `workout-${day.date}-${idx}-${w.type}`,
          name: w.type || 'Workout',
          category: 'Workout',
          date: w.date || day.date,
          detail: `${w.duration} min${w.calories ? ` • ${w.calories} kcal` : ''}`,
          targetView: 'exercise',
        });
      });

      // Foods
      (day.foods || []).forEach((f, idx) => {
        const foodName = f.name || f.text || 'Meal';
        const parts = [];
        if (f.cal !== undefined) parts.push(`${f.cal} kcal`);
        if (f.p !== undefined && f.c !== undefined && f.f !== undefined && (f.p || f.c || f.f)) {
          parts.push(`P:${f.p}g C:${f.c}g F:${f.f}g`);
        }
        list.push({
          id: `food-${day.date}-${idx}-${foodName}`,
          name: foodName,
          category: 'Food',
          date: f.timestamp || day.date,
          detail: parts.join(' • ') || 'Logged meal',
          targetView: 'food',
        });
      });
    });

    // Sort newest first
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [habits]);

  // Filter entries based on typed search query
  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return historicalEntries.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.category.toLowerCase().includes(query) ||
      item.detail.toLowerCase().includes(query)
    );
  }, [historicalEntries, searchQuery]);

  const handleSelectEntry = (entry) => {
    setIsSearchOpen(false);
    if (entry.targetView) {
      setCurrentView(entry.targetView);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearchOpen(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleSignOut = () => {
    setIsProfileOpen(false);
    setToastMessage('Signed out successfully (Demo session reset)');
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <header className="h-20 bg-[#09090b]/80 backdrop-blur-md border-b border-[#27272a] flex items-center justify-between px-8 sticky top-0 z-50">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-8 z-[100] flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200">
          <Check size={18} className="text-emerald-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Search Input Container */}
      <div ref={searchContainerRef} className="flex-1 max-w-xl relative">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            ref={searchInputRef}
            type="text" 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => {
              if (searchQuery.trim().length > 0) {
                setIsSearchOpen(true);
              }
            }}
            placeholder="Search your logs (workouts, meals, activities)..." 
            className="w-full bg-[#18181b] border border-[#27272a] text-white pl-10 pr-10 py-2.5 rounded-full text-sm placeholder-zinc-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition-colors"
              title="Clear search"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown Panel */}
        {isSearchOpen && searchQuery.trim().length > 0 && (
          <div className="absolute left-0 right-0 mt-2 bg-[#18181b] border border-[#27272a] rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-2.5 bg-[#27272a]/40 border-b border-[#27272a] flex items-center justify-between text-xs text-zinc-400 font-medium">
              <span>Matching Logs for &ldquo;<span className="text-white font-semibold">{searchQuery}</span>&rdquo;</span>
              <span>{filteredEntries.length} {filteredEntries.length === 1 ? 'result' : 'results'}</span>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-[#27272a]/50">
              {filteredEntries.length > 0 ? (
                filteredEntries.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectEntry(item)}
                    className="w-full px-4 py-3 text-left hover:bg-zinc-800/60 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        item.category === 'Workout' 
                          ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {item.category === 'Workout' ? <Dumbbell size={18} /> : <Utensils size={18} />}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold text-sm text-white group-hover:text-red-400 transition-colors truncate">
                            {item.name}
                          </p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            item.category === 'Workout'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {item.category}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5 truncate">{item.detail}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <span className="text-xs text-zinc-500 font-medium">{formatDate(item.date)}</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-zinc-800/80 flex items-center justify-center mx-auto mb-3 text-zinc-500">
                    <Search size={20} />
                  </div>
                  <p className="font-semibold text-sm text-zinc-300">No matching logs found</p>
                  <p className="text-xs text-zinc-500 mt-1">No recorded workouts or meals match &ldquo;{searchQuery}&rdquo;.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Right Action Icons: Notification Bell & Profile Dropdown */}
      <div className="flex items-center space-x-4 ml-4">
        {/* Notification Bell Dropdown */}
        <div ref={notifRef} className="relative">
          <button 
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsProfileOpen(false);
              setIsSearchOpen(false);
            }}
            className={`p-2 rounded-xl transition-all ${
              isNotifOpen 
                ? 'bg-zinc-800 text-white' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell size={21} />
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-[#18181b] border border-[#27272a] rounded-2xl shadow-2xl p-5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
                <h4 className="font-bold text-white text-sm">Notifications</h4>
                <span className="text-[10px] font-semibold bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                  0 new
                </span>
              </div>
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-800/80 flex items-center justify-center mx-auto mb-3 text-zinc-500">
                  <BellOff size={22} />
                </div>
                <p className="font-semibold text-sm text-zinc-200">No new notifications yet</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-[220px] mx-auto leading-relaxed">
                  You&apos;re all caught up! Activity alerts, reminders, and streak updates will appear here.
                </p>
              </div>
              <div className="pt-3 border-t border-[#27272a] text-center">
                <span className="text-[11px] text-zinc-500">All systems synced</span>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button 
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotifOpen(false);
              setIsSearchOpen(false);
            }}
            className={`flex items-center space-x-2 p-1.5 rounded-xl transition-all ${
              isProfileOpen 
                ? 'bg-zinc-800 text-white' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
            title="User Profile"
            aria-label="User Profile"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-md">
              AM
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-72 bg-[#18181b] border border-[#27272a] rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center space-x-3 pb-3 border-b border-[#27272a]">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-lg">
                  AM
                </div>
                <div className="truncate">
                  <p className="font-bold text-white text-sm truncate">Alex Morgan</p>
                  <p className="text-xs text-zinc-400 truncate">alex.morgan@example.com</p>
                  <span className="inline-block mt-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                    Active Member
                  </span>
                </div>
              </div>

              <div className="py-2.5 my-1 text-xs text-zinc-400 space-y-1.5">
                <div className="flex justify-between items-center py-1">
                  <span>Current Streak</span>
                  <span className="text-amber-400 font-bold">7 Days 🔥</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span>Demo Tier</span>
                  <select 
                    value={tier}
                    onChange={(e) => updateTier(e.target.value)}
                    className={`text-xs font-bold rounded-lg px-2 py-1 outline-none transition-colors ${
                      tier === 'premium' ? 'bg-amber-500 text-black' : 
                      tier === 'pro' ? 'bg-amber-600/20 text-amber-500 border border-amber-500/30' : 
                      'bg-zinc-700 text-white border border-transparent'
                    }`}
                  >
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-[#27272a]">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
