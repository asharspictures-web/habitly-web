import React, { useState } from 'react';
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
import { useHabits } from './hooks/useHabits';

function App() {
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
  } = useHabits();
  const [currentView, setCurrentView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');

  const renderScreen = () => {
    switch (currentView) {
      case 'home':
        return <HomePage onNavigate={setCurrentView} />;
      case 'pricing':
        return <PricingPage />;
      case 'exercise':
        return <ExerciseScreen habits={habits} onSave={addWorkout} searchQuery={searchQuery} />;
      case 'food':
        return <FoodScreen habits={habits} onSave={addFood} onRemove={removeFood} />;
      case 'steps':
        return <StepsScreen habits={habits} onSave={updateSteps} />;
      case 'goals':
        return <GoalsScreen goals={goals} updateGoals={updateGoals} addFood={addFood} />;
      case 'connect':
        return <DeviceConnectScreen onNavigate={setCurrentView} />;
      case 'ai':
        return <AIAssistantScreen habits={habits} onLogFood={addFood} />;
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

  return (
    <div className="flex h-screen bg-[#09090b] text-white overflow-hidden font-sans">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          habits={habits}
          setCurrentView={setCurrentView}
        />
        
        <main className="flex-1 overflow-y-auto p-6 md:p-10 relative">
          {renderScreen()}
        </main>
      </div>
    </div>
  );
}

export default App;
