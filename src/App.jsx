import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import DashboardScreen from './components/DashboardScreen';
import ExerciseScreen from './components/ExerciseScreen';
import FoodScreen from './components/FoodScreen';
import StepsScreen from './components/StepsScreen';
import GoalsScreen from './components/GoalsScreen';
import DeviceConnectScreen from './components/DeviceConnectScreen';
import AIAssistantScreen from './components/AIAssistantScreen';
import HomePage from './components/HomePage';
import PricingPage from './components/PricingPage';
import AuthScreen from './components/AuthScreen';
import { useHabits } from './hooks/useHabits';
import { useAuth } from './hooks/useAuth';
import { migrateLocalDataToSupabase } from './lib/migrateLocalData';


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-[#09090b] text-white">
          <div className="bg-[#18181b] p-6 rounded-2xl border border-red-500/30 shadow-2xl text-center max-w-sm">
            <h2 className="text-xl font-bold text-red-500 mb-2">Something went wrong</h2>
            <p className="text-sm text-zinc-400 mb-4">An unexpected error occurred while rendering this screen.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-xl"
            >
              Tap to reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const {
    user,
    loading: authLoading,
    tier,
    updateTier,
    signInWithPassword,
    signUpWithPassword,
    signInWithGoogle,
    signOut
  } = useAuth();

  const {
    habits,
    goals,
    addWorkout,
    addFood,
    removeFood,
    updateSteps,
    updateGoals,
    updateWater,
    addWater,
    updateSleep
  } = useHabits(user?.id);

  useEffect(() => {
    if (user?.id) migrateLocalDataToSupabase(user.id);
  }, [user?.id]);

  const [currentView, setCurrentView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');

  const [modalConfig, setModalConfig] = useState(null);

  const showAlert = (message) => setModalConfig({ type: 'alert', message });
  const showConfirm = (message, onConfirm, onCancel, confirmText, cancelText) => {
    setModalConfig({ type: 'confirm', message, onConfirm, onCancel, confirmText, cancelText });
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Home and Pricing are the unauthenticated marketing pages; every other
  // screen needs a signed-in user since it reads/writes account data.
  const requiresAuth = currentView !== 'home' && currentView !== 'pricing';
  const isAuthed = Boolean(user);

  const renderScreen = () => {
    switch (currentView) {
      case 'home':
        return <HomePage onNavigate={setCurrentView} />;
      case 'pricing':
        return <PricingPage updateTier={updateTier} showAlert={showAlert} onNavigate={setCurrentView} />;
      case 'exercise':
        return <ExerciseScreen habits={habits} onSave={addWorkout} searchQuery={searchQuery} goals={goals} updateGoals={updateGoals} showAlert={showAlert} showConfirm={showConfirm} tier={tier} updateTier={updateTier} />;
      case 'food':
        return <FoodScreen habits={habits} onSave={addFood} onRemove={removeFood} showAlert={showAlert} showConfirm={showConfirm} userId={user?.id} />;
      case 'steps':
        return <StepsScreen habits={habits} onSave={updateSteps} />;
      case 'goals':
        return <GoalsScreen goals={goals} updateGoals={updateGoals} addFood={addFood} showAlert={showAlert} showConfirm={showConfirm} tier={tier} updateTier={updateTier} />;
      case 'connect':
        return <DeviceConnectScreen onNavigate={setCurrentView} />;
      case 'ai':
        return <AIAssistantScreen habits={habits} onLogFood={addFood} showAlert={showAlert} showConfirm={showConfirm} />;
      case 'dashboard':
      default:
        return (
          <DashboardScreen 
            habits={habits} 
            goals={goals}
            updateWater={updateWater}
            addWater={addWater}
            updateSleep={updateSleep}
            updateSteps={updateSteps}
            addWorkout={addWorkout}
          />
        );
    }
  };

  if (requiresAuth && authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#09090b] text-zinc-400 text-sm">
        Loading...
      </div>
    );
  }

  if (requiresAuth && !isAuthed) {
    return (
      <AuthScreen
        onSignIn={signInWithPassword}
        onSignUp={signUpWithPassword}
        onGoogleSignIn={signInWithGoogle}
      />
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-[#09090b] text-white overflow-hidden font-sans">
        {currentView !== 'home' && (
          <Sidebar
            currentView={currentView}
            setCurrentView={setCurrentView}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />
        )}

        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {currentView !== 'home' && (
            <TopBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              habits={habits}
              setCurrentView={setCurrentView}
              tier={tier}
              updateTier={updateTier}
              isMobileMenuOpen={isMobileMenuOpen}
              setIsMobileMenuOpen={setIsMobileMenuOpen}
              user={user}
              onSignOut={signOut}
            />
          )}

          <main className="flex-1 overflow-y-auto p-4 md:p-10 relative">
            {renderScreen()}
          </main>
        </div>

        {/* Global Alert / Confirm Modal */}
        {modalConfig && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#18181b] border border-[#27272a] rounded-2xl max-w-sm w-full p-6 shadow-2xl relative font-sans">
              <h3 className="text-lg font-bold text-white mb-4">{modalConfig.type === 'confirm' ? 'Confirm' : 'Notice'}</h3>
              <p className="text-sm text-zinc-300 mb-6 leading-relaxed whitespace-pre-wrap">{modalConfig.message}</p>
              
              <div className="flex space-x-3 justify-end">
                {modalConfig.type === 'confirm' && (
                  <button
                    onClick={() => {
                      setModalConfig(null);
                      if (modalConfig.onCancel) modalConfig.onCancel();
                    }}
                    className="px-4 py-2 rounded-xl text-sm font-bold bg-[#27272a] text-white hover:bg-[#3f3f46] transition-colors"
                  >
                    {modalConfig.cancelText || 'Cancel'}
                  </button>
                )}
                <button
                  onClick={() => {
                    setModalConfig(null);
                    if (modalConfig.onConfirm) modalConfig.onConfirm();
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  {modalConfig.confirmText || 'OK'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
