import { LayoutDashboard, Dumbbell, Utensils, Footprints, Watch, Bot, Target, ChartLine, CreditCard, ShieldCheck } from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'exercise', label: 'Exercise', icon: Dumbbell },
  { id: 'food', label: 'Food', icon: Utensils },
  { id: 'steps', label: 'Steps', icon: Footprints },
  { id: 'connect', label: 'Connect Devices', icon: Watch },
  { id: 'ai', label: 'AI Assistant', icon: Bot },
  { id: 'goals', label: 'Goals', icon: ChartLine },
  { id: 'health-safety', label: 'Health & Safety', icon: ShieldCheck },
  { id: 'pricing', label: 'Pricing', icon: CreditCard },
];

export function Sidebar({ currentView, setCurrentView, isMobileMenuOpen, setIsMobileMenuOpen }) {
  const handleNav = (id) => {
    setCurrentView(id);
    if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#18181b] border-r border-[#27272a] flex flex-col
        transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="p-6">
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center space-x-3 cursor-pointer" onClick={() => handleNav('dashboard')}>
            <img 
              src="/logo.jpg" 
              alt="Habitly Logo" 
              className="w-8 h-8 rounded-lg object-cover border border-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.25)]" 
            />
            <span>Habitly</span>
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto pb-6">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-red-500/10 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
                    : 'text-zinc-400 hover:bg-[#27272a] hover:text-white'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-red-500' : 'text-zinc-400 group-hover:text-white'} />
                <span className="font-semibold">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
