import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Plus, Upload, X, Image as ImageIcon, Utensils, Camera, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { parseFoodFromQuery } from '../lib/gemini';
import { supabase } from '../lib/supabaseClient';
import { loadFoodCatalog } from '../lib/catalogs';

import { COMMON_FOODS } from '../lib/foodUtils';

const CATEGORIES = ['All', 'Indian', 'International', 'Healthy', 'Quick Snacks'];

export default function FoodScreen({ habits = [], onSave, onRemove, showAlert, showConfirm, userId }) {
  const [foodCatalog, setFoodCatalog] = useState(COMMON_FOODS);
  useEffect(() => {
    let mounted = true;
    loadFoodCatalog().then((catalog) => {
      if (mounted) setFoodCatalog(catalog);
    });
    return () => {
      mounted = false;
    };
  }, []);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  // Custom Food Modal state
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCal, setCustomCal] = useState('');
  const [customP, setCustomP] = useState('');
  const [customC, setCustomC] = useState('');
  const [customF, setCustomF] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [isSavingCustomFood, setIsSavingCustomFood] = useState(false);
  const fileInputRef = useRef(null);

  // Quantity Modal state
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);
  const [selectedFoodForQuantity, setSelectedFoodForQuantity] = useState(null);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayData = (Array.isArray(habits) ? habits : []).find(h => h.date === todayStr) || { foods: [] };
  const foods = todayData.foods || [];

  const totals = foods.reduce((acc, f) => {
    acc.cal += Number(f.cal) || 0;
    acc.p += Number(f.p) || 0;
    acc.c += Number(f.c) || 0;
    acc.f += Number(f.f) || 0;
    return acc;
  }, { cal: 0, p: 0, c: 0, f: 0 });

  const chartData = [
    { name: 'Protein', value: totals.p * 4, color: '#ef4444' },
    { name: 'Carbs', value: totals.c * 4, color: '#3b82f6' },
    { name: 'Fat', value: totals.f * 9, color: '#eab308' },
  ].filter(d => d.value > 0);

  const handleQuickAdd = (food) => {
    setSelectedFoodForQuantity(food);
    setFoodQuantity(1);
    setIsQuantityModalOpen(true);
  };

  const handleAIAssist = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 400));

    const nutrition = parseFoodFromQuery(inputText, foodCatalog);

    setSelectedFoodForQuantity({
      name: nutrition.foodName,
      text: nutrition.foodName,
      cal: nutrition.cal,
      p: nutrition.p,
      c: nutrition.c,
      f: nutrition.f,
      icon: '✨'
    });
    setFoodQuantity(1);
    setIsQuantityModalOpen(true);

    setInputText('');
    setIsProcessing(false);
  };

  const cameraInputRef = useRef(null);

  const handleCameraScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    // Simulate AI processing the image
    await new Promise(r => setTimeout(r, 1500));
    
    // Hardcoded mock response for the demo
    const nutrition = {
      foodName: 'Grilled Chicken Salad (AI Vision)',
      cal: 320,
      p: 28,
      c: 12,
      f: 18,
    };

    setSelectedFoodForQuantity({
      name: nutrition.foodName,
      text: nutrition.foodName,
      cal: nutrition.cal,
      p: nutrition.p,
      c: nutrition.c,
      f: nutrition.f,
      icon: '📸'
    });
    setFoodQuantity(1);
    setIsQuantityModalOpen(true);
    setIsProcessing(false);
    
    // reset input
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const confirmQuantityAndSave = (e) => {
    if (e) e.preventDefault();
    if (!selectedFoodForQuantity) return;
    
    const q = Math.max(0.1, parseFloat(foodQuantity) || 1);
    
    onSave({
      ...selectedFoodForQuantity,
      text: selectedFoodForQuantity.name,
      cal: Math.round(selectedFoodForQuantity.cal * q),
      p: Math.round(selectedFoodForQuantity.p * q),
      c: Math.round(selectedFoodForQuantity.c * q),
      f: Math.round(selectedFoodForQuantity.f * q),
      quantity: q,
      date: todayStr,
      timestamp: new Date().toISOString()
    });
    
    setIsQuantityModalOpen(false);
    setSelectedFoodForQuantity(null);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCustomFood = async (e) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const cal = Math.max(0, parseInt(customCal, 10) || 0);
    const p = Math.max(0, parseFloat(customP) || 0);
    const c = Math.max(0, parseFloat(customC) || 0);
    const f = Math.max(0, parseFloat(customF) || 0);

    let photoUrl = null;
    if (photoFile && userId) {
      setIsSavingCustomFood(true);
      const ext = (photoFile.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('food-photos').upload(path, photoFile);
      if (uploadError) {
        console.error('Photo upload failed', uploadError);
        showAlert('Could not upload the photo, saving the entry without it.');
      } else {
        photoUrl = path;
      }
      setIsSavingCustomFood(false);
    }

    onSave({
      name: customName.trim(),
      text: customName.trim(),
      cal,
      p,
      c,
      f,
      photo: photoPreview || null,
      photo_url: photoUrl,
      date: todayStr,
      timestamp: new Date().toISOString(),
      category: 'Custom'
    });

    // Reset and close
    setCustomName('');
    setCustomCal('');
    setCustomP('');
    setCustomC('');
    setCustomF('');
    setPhotoPreview(null);
    setPhotoFile(null);
    setIsCustomModalOpen(false);
  };

  const toggleListen = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      showAlert("Speech recognition not supported in this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(prev => (prev ? prev + " " + transcript : transcript));
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };
  };

  const filteredFoods = foodCatalog.filter(food => {
    if (activeCategory === 'All') return true;
    if (food.category === activeCategory) return true;
    if (food.tags && food.tags.includes(activeCategory)) return true;
    return false;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Top Banner with subtle fitness background image overlay */}
      <div className="relative overflow-hidden rounded-3xl border border-[#27272a] shadow-xl p-6 md:p-8">
        <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/90 to-transparent"></div>
        <div className="absolute inset-0 bg-red-600/10 mix-blend-overlay"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center space-x-3">
              <Utensils className="text-red-500" size={28} />
              <span>Food & Nutrition</span>
            </h2>
            <p className="text-zinc-400 text-sm mt-1">
              Browse 22+ Indian & international dishes, upload custom meals with photos, or log with AI.
            </p>
          </div>
          <button
            onClick={() => setIsCustomModalOpen(true)}
            className="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-3 rounded-xl transition flex items-center space-x-2 shadow-[0_0_15px_rgba(239,68,68,0.25)] self-start sm:self-auto cursor-pointer"
          >
            <Plus size={18} />
            <span>Add Custom Food</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Entry, Quick Add, and Logged History */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* AI Entry */}
          <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-6 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">Log Food with AI</h3>
            <form onSubmit={handleAIAssist} className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="e.g., 'two rotis and a bowl of dal' or 'Chicken Biryani'"
                  className="w-full bg-[#09090b] border border-[#27272a] text-white pl-4 pr-12 py-4 rounded-xl focus:outline-none focus:border-red-500/50"
                  disabled={isProcessing}
                />
                <button 
                  type="button"
                  onClick={toggleListen}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors cursor-pointer ${
                    isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-zinc-400 hover:text-white hover:bg-[#27272a]'
                  }`}
                  aria-label="Toggle voice input"
                >
                  <Mic size={20} />
                </button>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="bg-[#27272a] hover:bg-[#3f3f46] text-white px-5 rounded-xl font-bold transition-all flex items-center justify-center cursor-pointer"
                  title="Scan Plate with Camera"
                  disabled={isProcessing}
                >
                  <Camera size={20} />
                </button>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  ref={cameraInputRef}
                  onChange={handleCameraScan}
                />
                <button
                  type="submit"
                  disabled={isProcessing || !inputText.trim()}
                  className="bg-red-600 hover:bg-red-500 text-white px-6 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center shadow-[0_0_15px_rgba(239,68,68,0.2)] cursor-pointer"
                >
                  {isProcessing ? 'Thinking...' : <Send size={20} />}
                </button>
              </div>
            </form>
            <p className="text-xs text-zinc-500 mt-3">The AI will automatically estimate calories and macros.</p>
          </div>

          {/* Quick Add Section with Category Filter Tabs */}
          <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-6 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white">Quick Add Dishes</h3>
                <p className="text-xs text-zinc-400">Click any dish to instantly log it to your day.</p>
              </div>
              <span className="text-xs font-semibold bg-[#27272a] text-zinc-300 px-3 py-1 rounded-full self-start sm:self-auto">
                {filteredFoods.length} items
              </span>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORIES.map(category => {
                const isActive = activeCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                        : 'bg-[#09090b] text-zinc-400 border border-[#27272a] hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            {/* Food Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {filteredFoods.map(food => (
                <button
                  key={food.name}
                  onClick={() => handleQuickAdd(food)}
                  className="bg-[#09090b] border border-[#27272a] p-3.5 rounded-xl text-left hover:border-red-500/50 hover:bg-[#18181b] transition group flex items-center space-x-3 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-105 transition-transform">
                    {food.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-zinc-200 text-sm truncate group-hover:text-white">
                        {food.name}
                      </span>
                      <Plus size={14} className="text-zinc-500 group-hover:text-red-500 flex-shrink-0 ml-1" />
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-zinc-500 mt-0.5">
                      <span className="text-zinc-300 font-medium">{food.cal} kcal</span>
                      <span>•</span>
                      <span className="text-red-400">{food.p}g P</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Today's Logged Foods List */}
          <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <span>Today's Logged Foods</span>
                  <span className="text-xs bg-red-500/20 text-red-400 px-2.5 py-0.5 rounded-full font-semibold">
                    {foods.length}
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">History of all meals and custom foods logged today.</p>
              </div>
            </div>

            {foods.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 text-sm border border-dashed border-[#27272a] rounded-xl bg-[#09090b]/50">
                <Utensils className="mx-auto mb-2 text-zinc-600" size={24} />
                No foods logged yet today. Use Quick Add, AI, or Add Custom Food to track your first meal!
              </div>
            ) : (
              <div className="space-y-3">
                {foods.map((food, idx) => {
                  const foodName = food.name || food.text || 'Meal';
                  return (
                    <div
                      key={`logged-food-${idx}-${food.timestamp || idx}`}
                      className="group bg-[#09090b] border border-[#27272a] p-3.5 rounded-xl flex items-center justify-between hover:border-zinc-700 transition"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        {food.photo ? (
                          <img
                            src={food.photo}
                            alt={foodName}
                            className="w-12 h-12 rounded-lg object-cover border border-[#27272a] flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-center text-2xl flex-shrink-0">
                            {food.icon || '🍽️'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-white text-sm truncate flex items-center space-x-2">
                            <span>{foodName}</span>
                            {food.photo && (
                              <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-medium">
                                Photo
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-zinc-400 mt-1">
                            <span className="text-red-400 font-semibold">{food.cal || 0} kcal</span>
                            <span>•</span>
                            <span>Protein: {food.p || 0}g</span>
                            <span>•</span>
                            <span>Carbs: {food.c || 0}g</span>
                            <span>•</span>
                            <span>Fat: {food.f || 0}g</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="text-xs text-zinc-500 mr-4">
                          {food.timestamp
                            ? new Date(food.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'Logged'}
                        </div>
                        {onRemove && (
                          <button
                            onClick={() => onRemove(food.timestamp)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                            title="Remove Food"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Totals & Donut */}
        <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-6 h-fit sticky top-24 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-6">Today's Nutrition</h3>
          
          <div className="text-center mb-8">
            <span className="text-4xl font-black text-white">{totals.cal}</span>
            <span className="text-zinc-500 ml-2">kcal</span>
          </div>

          {totals.cal > 0 ? (
            <div className="h-48 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center border border-dashed border-[#27272a] rounded-full w-48 mx-auto mb-6">
              <span className="text-zinc-500 text-sm">No food logged</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>Protein</span>
              <span className="font-bold">{totals.p}g</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>Carbs</span>
              <span className="font-bold">{totals.c}g</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>Fat</span>
              <span className="font-bold">{totals.f}g</span>
            </div>
          </div>
        </div>

      </div>

      {/* Add Custom Food Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#27272a] mb-5">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center font-bold">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Add Custom Food</h3>
                  <p className="text-xs text-zinc-400">Log a custom meal with macros and a photo from your device.</p>
                </div>
              </div>
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-[#27272a] transition cursor-pointer"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Custom Food Form */}
            <form onSubmit={handleSaveCustomFood} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Food Name *
                </label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="e.g., Mom's Special Chicken Curry"
                  className="w-full bg-[#09090b] border border-[#27272a] text-white px-4 py-3 rounded-xl focus:outline-none focus:border-red-500/50 text-sm"
                />
              </div>

              {/* Macro Inputs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Calories *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={customCal}
                    onChange={e => setCustomCal(e.target.value)}
                    placeholder="kcal"
                    className="w-full bg-[#09090b] border border-[#27272a] text-white px-3 py-2.5 rounded-xl focus:outline-none focus:border-red-500/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={customP}
                    onChange={e => setCustomP(e.target.value)}
                    placeholder="g"
                    className="w-full bg-[#09090b] border border-[#27272a] text-white px-3 py-2.5 rounded-xl focus:outline-none focus:border-red-500/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={customC}
                    onChange={e => setCustomC(e.target.value)}
                    placeholder="g"
                    className="w-full bg-[#09090b] border border-[#27272a] text-white px-3 py-2.5 rounded-xl focus:outline-none focus:border-red-500/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Fat (g)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={customF}
                    onChange={e => setCustomF(e.target.value)}
                    placeholder="g"
                    className="w-full bg-[#09090b] border border-[#27272a] text-white px-3 py-2.5 rounded-xl focus:outline-none focus:border-red-500/50 text-sm"
                  />
                </div>
              </div>

              {/* Photo File Upload Section */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Meal Photo (Device Upload)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="custom-food-photo-file-input"
                />

                {photoPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-[#27272a] bg-[#09090b] p-3 flex items-center space-x-4">
                    <img
                      src={photoPreview}
                      alt="Custom Food Preview"
                      className="w-20 h-20 rounded-lg object-cover border border-[#27272a]"
                    />
                    <div className="space-y-2">
                      <p className="text-xs text-emerald-400 font-semibold flex items-center space-x-1">
                        <span>✓ Photo ready</span>
                      </p>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs bg-[#27272a] hover:bg-[#3f3f46] text-white px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          Change Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => setPhotoPreview(null)}
                          className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-[#27272a] hover:border-red-500/40 rounded-xl p-5 text-center transition bg-[#09090b]/50 group cursor-pointer flex flex-col items-center justify-center space-y-2"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#18181b] flex items-center justify-center text-zinc-400 group-hover:text-red-500 transition-colors">
                      <ImageIcon size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-300 group-hover:text-white">
                        Click to upload meal photo
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        PNG, JPG, WebP supported from local storage
                      </p>
                    </div>
                  </button>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex space-x-3 pt-4 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="flex-1 bg-[#27272a] hover:bg-[#3f3f46] text-zinc-300 py-3 rounded-xl font-semibold text-sm transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCustomFood}
                  className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-sm transition shadow-[0_0_15px_rgba(239,68,68,0.25)] flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Upload size={16} />
                  <span>{isSavingCustomFood ? 'Uploading...' : 'Save Food Entry'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quantity Modal */}
      {isQuantityModalOpen && selectedFoodForQuantity && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#27272a] mb-5">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center font-bold text-xl">
                  {selectedFoodForQuantity.icon || '🍽️'}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-white truncate max-w-[200px]">{selectedFoodForQuantity.name}</h3>
                  <p className="text-xs text-zinc-400">Specify serving size</p>
                </div>
              </div>
              <button
                onClick={() => setIsQuantityModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-[#27272a] transition cursor-pointer flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={confirmQuantityAndSave} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">
                  Number of Servings
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    required
                    value={foodQuantity}
                    onChange={e => setFoodQuantity(e.target.value)}
                    className="w-full bg-[#09090b] border border-[#27272a] text-white px-4 py-3 rounded-xl focus:outline-none focus:border-red-500/50 text-center font-bold text-lg"
                  />
                </div>
              </div>

              <div className="bg-[#09090b] border border-[#27272a] rounded-xl p-4">
                <p className="text-xs text-zinc-500 mb-2 font-semibold uppercase tracking-wider text-center">Total Estimated Macros</p>
                <div className="flex justify-between items-center text-sm">
                  <div className="text-center">
                    <span className="block text-red-400 font-bold">{Math.round(selectedFoodForQuantity.cal * (parseFloat(foodQuantity) || 1))}</span>
                    <span className="text-zinc-500 text-[10px] uppercase">kcal</span>
                  </div>
                  <div className="w-px h-8 bg-[#27272a]"></div>
                  <div className="text-center">
                    <span className="block text-white font-bold">{Math.round((selectedFoodForQuantity.p || 0) * (parseFloat(foodQuantity) || 1))}g</span>
                    <span className="text-zinc-500 text-[10px] uppercase">Protein</span>
                  </div>
                  <div className="w-px h-8 bg-[#27272a]"></div>
                  <div className="text-center">
                    <span className="block text-white font-bold">{Math.round((selectedFoodForQuantity.c || 0) * (parseFloat(foodQuantity) || 1))}g</span>
                    <span className="text-zinc-500 text-[10px] uppercase">Carbs</span>
                  </div>
                  <div className="w-px h-8 bg-[#27272a]"></div>
                  <div className="text-center">
                    <span className="block text-white font-bold">{Math.round((selectedFoodForQuantity.f || 0) * (parseFloat(foodQuantity) || 1))}g</span>
                    <span className="text-zinc-500 text-[10px] uppercase">Fat</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-500 text-white py-3.5 rounded-xl font-bold text-sm transition shadow-[0_0_15px_rgba(239,68,68,0.25)] flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Plus size={18} />
                  <span>Log Food</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
