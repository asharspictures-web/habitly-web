import React, { useState } from 'react';

export default function EntryScreen({ onSave }) {
  // State for each field – matches the visual sections used elsewhere in the app
  const [workoutType, setWorkoutType] = useState('Running');
  const [workoutDuration, setWorkoutDuration] = useState(30);
  const [sleep, setSleep] = useState(7);
  const [water, setWater] = useState(8);
  const [steps, setSteps] = useState(10000);
  const [meals, setMeals] = useState('Oatmeal, Salad, Chicken & Rice');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Persist the entry using the app's hook (passed as onSave from a parent)
    onSave({
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      workoutType,
      workoutDuration: Number(workoutDuration),
      sleep: Number(sleep),
      water: Number(water),
      steps: Number(steps),
      meals,
    });
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-[#18181b] border border-[#27272a] rounded-2xl shadow-xl space-y-6">
      <h2 className="text-2xl font-black text-white text-center mb-4">Log Today</h2>

      {/* Workout Section – red accent */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <label className="block text-sm font-semibold text-red-400 mb-2">Workout</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={workoutType}
            onChange={(e) => setWorkoutType(e.target.value)}
            placeholder="e.g. Running, Gym"
            className="flex-1 bg-[#09090b] border border-red-500/20 rounded-xl px-3 py-2 text-white placeholder-red-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
          <input
            type="number"
            value={workoutDuration}
            onChange={(e) => setWorkoutDuration(e.target.value)}
            placeholder="Mins"
            className="w-24 bg-[#09090b] border border-red-500/20 rounded-xl px-3 py-2 text-white placeholder-red-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
        </div>
      </div>

      {/* Sleep Section – indigo theme */}
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
        <label className="block text-sm font-semibold text-indigo-400 mb-2">Sleep (hrs)</label>
        <input
          type="number"
          step="0.5"
          value={sleep}
          onChange={(e) => setSleep(e.target.value)}
          className="w-full bg-[#09090b] border border-indigo-500/20 rounded-xl px-3 py-2 text-white placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>

      {/* Water Section – blue theme */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <label className="block text-sm font-semibold text-blue-400 mb-2">Water (glasses)</label>
        <input
          type="number"
          value={water}
          onChange={(e) => setWater(e.target.value)}
          className="w-full bg-[#09090b] border border-blue-500/20 rounded-xl px-3 py-2 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Steps Section – orange theme */}
      <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
        <label className="block text-sm font-semibold text-orange-400 mb-2">Daily Steps</label>
        <input
          type="number"
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          placeholder="e.g. 12 500"
          className="w-full bg-[#09090b] border border-orange-500/20 rounded-xl px-3 py-2 text-white placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Meals Section – amber theme */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
        <label className="block text-sm font-semibold text-amber-400 mb-2">Meals Eaten</label>
        <input
          type="text"
          value={meals}
          onChange={(e) => setMeals(e.target.value)}
          placeholder="What did you eat today?"
          className="w-full bg-[#09090b] border border-amber-500/20 rounded-xl px-3 py-2 text-white placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <button
        type="submit"
        onClick={handleSubmit}
        className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all active:scale-95"
      >
        Save Entry
      </button>
    </div>
  );
}
