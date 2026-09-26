import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Plus, Check } from 'lucide-react';
import { chatWithAI } from '../lib/gemini';

const SUGGESTED_PROMPTS = [
  "Log 2 Rotis and Paneer Butter Masala",
  "How many calories have I consumed today?",
  "Healthy high-protein snack ideas",
  "Log 1 bowl of oatmeal with berries",
  "What was my sleep last night?"
];

export default function AIAssistantScreen({ habits = [], goals = {}, onLogFood }) {
  const counterRef = useRef(1);
  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome-init',
      sender: 'ai',
      text: "Hello! I'm your Habitly AI Health & Nutrition Assistant. Ask me anything about your progress, or tell me what you ate (e.g., 'Log 2 Rotis and Paneer Butter Masala') and I'll analyze the macros and log it to your food diary!",
      timestamp: 'Just now',
      card: null
    }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom whenever messages or thinking state updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend !== undefined ? textToSend : input).trim();
    if (!text || isThinking) return;

    const userMessage = {
      id: `user-${++counterRef.current}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      card: null
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    try {
      const response = await chatWithAI(text, habits, goals);
      const replyText = typeof response === 'string' ? response : (response.text || response.toString());
      const rawCard = response.card ? { ...response.card } : null;

      let cardData = null;
      if (rawCard && rawCard.type === 'food_confirmation') {
        cardData = {
          ...rawCard,
          logged: true // Automatically log when AI detects food intent
        };

        // Invoke food logging callback to persist entry
        if (typeof onLogFood === 'function') {
          onLogFood({
            name: cardData.foodName,
            text: cardData.foodName,
            cal: cardData.cal,
            p: cardData.p,
            c: cardData.c,
            f: cardData.f,
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString()
          });
        }
      }

      const aiMessage = {
        id: `ai-${++counterRef.current}`,
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        card: cardData
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${++counterRef.current}`,
          sender: 'ai',
          text: "I encountered a brief hiccup retrieving that answer. Please try again!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          card: null
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleManualConfirmLog = (msgId, card) => {
    if (!card) return;
    if (typeof onLogFood === 'function') {
      onLogFood({
        name: card.foodName,
        text: card.foodName,
        cal: card.cal,
        p: card.p,
        c: card.c,
        f: card.f,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      });
    }

    setMessages(prev => prev.map(msg => {
      if (msg.id === msgId && msg.card) {
        return {
          ...msg,
          card: { ...msg.card, logged: true }
        };
      }
      return msg;
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Hero Banner with subtle dark fitness overlay */}
      <div className="relative overflow-hidden rounded-3xl border border-[#27272a] shadow-xl p-5 mb-4 flex-shrink-0">
        <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/90 to-transparent"></div>
        <div className="absolute inset-0 bg-red-600/10 mix-blend-overlay"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-[0_0_12px_rgba(239,68,68,0.2)]">
              <Bot size={22} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white flex items-center space-x-2">
                <span>Habitly AI Assistant</span>
                <Sparkles size={16} className="text-red-400 animate-pulse" />
              </h2>
              <p className="text-zinc-400 text-xs md:text-sm">Personalized fitness coaching & nutrition logging powered by AI.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-3 mb-2 flex-shrink-0 scrollbar-none">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap pl-1">
          Suggestions:
        </span>
        {SUGGESTED_PROMPTS.map((prompt, idx) => (
          <button
            key={`prompt-${idx}`}
            onClick={() => handleSendMessage(prompt)}
            disabled={isThinking}
            className="text-xs bg-[#18181b] border border-[#27272a] hover:border-red-500/40 hover:bg-[#27272a] text-zinc-300 hover:text-white px-3 py-1.5 rounded-full whitespace-nowrap transition-all duration-200 disabled:opacity-50 flex items-center space-x-1.5"
          >
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 bg-[#18181b] rounded-2xl border border-[#27272a] p-4 md:p-6 overflow-y-auto space-y-4 shadow-lg">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm shadow-sm ${
                  isUser
                    ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                    : 'bg-[#27272a] text-red-500 border border-[#3f3f46]'
                }`}
              >
                {isUser ? <User size={18} /> : <Bot size={18} />}
              </div>

              {/* Message Content */}
              <div className={`max-w-[85%] md:max-w-[75%] ${isUser ? 'text-right' : 'text-left'}`}>
                <div
                  className={`inline-block rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md ${
                    isUser
                      ? 'bg-red-600/20 text-white border border-red-500/30 text-left'
                      : 'bg-[#09090b] text-zinc-200 border border-[#27272a]'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Rich Confirmation Card for Food Logging */}
                  {msg.card && msg.card.type === 'food_confirmation' && (
                    <div className="mt-3 bg-[#18181b] border border-red-500/40 rounded-xl p-4 shadow-xl text-left">
                      <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">🍽️</span>
                          <span className="font-bold text-white text-base">
                            {msg.card.foodName}
                          </span>
                        </div>
                        {msg.card.logged ? (
                          <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center space-x-1">
                            <Check size={12} className="stroke-[3]" />
                            <span>✓ Logged to Food Diary</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleManualConfirmLog(msg.id, msg.card)}
                            className="text-xs font-bold bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-full transition flex items-center space-x-1 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                          >
                            <Plus size={12} className="stroke-[3]" />
                            <span>Confirm & Log</span>
                          </button>
                        )}
                      </div>

                      <div className="mt-3 flex items-baseline space-x-2">
                        <span className="text-3xl font-black text-white">{msg.card.cal}</span>
                        <span className="text-zinc-400 text-sm font-semibold">kcal</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#27272a]/60">
                        <div className="bg-[#09090b] p-2 rounded-lg text-center border border-[#27272a]">
                          <span className="text-[11px] text-zinc-400 block font-medium">Protein</span>
                          <span className="text-sm font-bold text-red-500">{msg.card.p}g</span>
                        </div>
                        <div className="bg-[#09090b] p-2 rounded-lg text-center border border-[#27272a]">
                          <span className="text-[11px] text-zinc-400 block font-medium">Carbs</span>
                          <span className="text-sm font-bold text-blue-400">{msg.card.c}g</span>
                        </div>
                        <div className="bg-[#09090b] p-2 rounded-lg text-center border border-[#27272a]">
                          <span className="text-[11px] text-zinc-400 block font-medium">Fat</span>
                          <span className="text-sm font-bold text-yellow-400">{msg.card.f}g</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-zinc-500 mt-1 px-1">
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {/* Thinking / Loading indicator */}
        {isThinking && (
          <div className="flex items-start space-x-3 text-left">
            <div className="w-9 h-9 rounded-xl bg-[#27272a] text-red-500 border border-[#3f3f46] flex items-center justify-center flex-shrink-0 text-sm">
              <Bot size={18} />
            </div>
            <div className="bg-[#09090b] border border-[#27272a] rounded-2xl px-4 py-3 text-sm text-zinc-400 flex items-center space-x-2">
              <Sparkles size={16} className="text-red-500 animate-spin" />
              <span>Analyzing nutritional breakdown & generating response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Field & Send Button */}
      <div className="mt-3 flex-shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isThinking}
            placeholder="Ask AI or say 'Log 2 Rotis and Paneer Butter Masala'..."
            className="flex-1 bg-[#18181b] border border-[#27272a] text-white px-4 py-3.5 rounded-xl focus:outline-none focus:border-red-500/50 placeholder:text-zinc-500 text-sm transition"
          />
          <button
            type="submit"
            disabled={isThinking || !input.trim()}
            className="bg-red-600 hover:bg-red-500 text-white px-6 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.25)] flex-shrink-0"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
