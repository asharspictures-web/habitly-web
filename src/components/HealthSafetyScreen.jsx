import React, { useState, useEffect } from 'react';
import { ShieldCheck, HeartPulse, Stethoscope, Users, X, AlertCircle, ArrowRight, Trash2, Plus } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const SECTIONS = [
  {
    id: 'emergency',
    name: 'Emergency Contacts',
    subtitle: 'Who to call in an emergency',
    category: 'Local Storage / Synced',
    icon: <ShieldCheck />,
    accentBg: 'bg-red-500/10 border-red-500/20 text-red-500',
    accentBorder: 'hover:border-red-500/50',
    status: 'Active'
  },
  {
    id: 'medical',
    name: 'Medical History',
    subtitle: 'Secure medical record storage',
    category: 'End-to-End Encrypted',
    icon: <Stethoscope />,
    accentBg: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
    accentBorder: 'hover:border-amber-500/50',
    status: 'In Development'
  },
  {
    id: 'womens_health',
    name: 'Women\'s Health',
    subtitle: 'Cycle & pregnancy tracking',
    category: 'Private Health Data',
    icon: <HeartPulse />,
    accentBg: 'bg-rose-500/10 border-rose-500/20 text-rose-500',
    accentBorder: 'hover:border-rose-500/50',
    status: 'Active'
  },
  {
    id: 'community',
    name: 'Community',
    subtitle: 'Follow friends & activities',
    category: 'Social Integrations',
    icon: <Users />,
    accentBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500',
    accentBorder: 'hover:border-indigo-500/50',
    status: 'On Roadmap'
  }
];

export default function HealthSafetyScreen({ 
  userId,
  fetchPeriodLogs,
  addPeriodLog,
  deletePeriodLog,
  getNextPredictedDate 
}) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  
  const [selectedSection, setSelectedSection] = useState(null);

  const [periods, setPeriods] = useState([]);
  const [loadingPeriods, setLoadingPeriods] = useState(true);
  const [periodStartDate, setPeriodStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [periodEndDate, setPeriodEndDate] = useState('');

  useEffect(() => {
    if (userId) {
      fetchContacts();
      loadPeriods();
    } else {
      setLoading(false);
      setLoadingPeriods(false);
    }
  }, [userId, fetchPeriodLogs]);

  const loadPeriods = async () => {
    if (fetchPeriodLogs) {
      const data = await fetchPeriodLogs();
      setPeriods(data || []);
    }
    setLoadingPeriods(false);
  };

  const handleAddPeriod = async (e) => {
    e.preventDefault();
    if (!periodStartDate || !addPeriodLog) return;
    await addPeriodLog(periodStartDate, periodEndDate);
    setPeriodStartDate(new Date().toISOString().split('T')[0]);
    setPeriodEndDate('');
    loadPeriods();
  };

  const handleDeletePeriod = async (id) => {
    if (!deletePeriodLog) return;
    await deletePeriodLog(id);
    loadPeriods();
  };

  const fetchContacts = async () => {
    const { data, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Error fetching contacts:', error);
    } else {
      setContacts(data || []);
    }
    setLoading(false);
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!name || !phone || !userId) return;
    
    const { error } = await supabase
      .from('emergency_contacts')
      .insert({
        user_id: userId,
        name,
        relationship,
        phone
      });
      
    if (error) {
      console.error('Error adding contact:', error);
    } else {
      setName('');
      setRelationship('');
      setPhone('');
      fetchContacts();
    }
  };

  const handleDeleteContact = async (id) => {
    const { error } = await supabase
      .from('emergency_contacts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error deleting contact:', error);
    } else {
      fetchContacts();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setSelectedSection(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-[#27272a] shadow-xl p-8 md:p-10">
        <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-[#09090b]/80"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-red-900/10"></div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex-1">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold mb-3">
              <ShieldCheck size={14} />
              <span>Safety & Security</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center space-x-3">
              <span>Health & Safety</span>
            </h2>
            <p className="text-zinc-400 text-sm mt-1 max-w-xl">
              Keep the people who matter informed and your health information secure.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Emergency Contacts Card (Functional) */}
        <div className={`bg-[#18181b] border border-[#27272a] rounded-2xl p-6 flex flex-col transition-all duration-300 ${SECTIONS[0].accentBorder} group relative`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl shadow-sm ${SECTIONS[0].accentBg}`}>
                {SECTIONS[0].icon}
              </div>
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-zinc-700 bg-zinc-800/80 text-zinc-400 flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>{SECTIONS[0].status}</span>
              </span>
            </div>

            <h4 className="text-lg font-bold text-white tracking-tight group-hover:text-red-400 transition-colors">
              {SECTIONS[0].name}
            </h4>
            <p className="text-xs font-semibold text-zinc-400 mt-0.5">
              {SECTIONS[0].subtitle}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#27272a]/60 flex-1 flex flex-col">
            {loading ? (
              <p className="text-zinc-500 text-xs">Loading contacts...</p>
            ) : (
              <div className="space-y-3 mb-6 flex-1">
                {contacts.length === 0 ? (
                  <p className="text-zinc-500 text-xs italic">No emergency contacts saved.</p>
                ) : (
                  contacts.map(contact => (
                    <div key={contact.id} className="bg-[#09090b] border border-[#27272a] rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-white">{contact.name}</p>
                        <p className="text-xs text-zinc-400">{contact.relationship} • {contact.phone}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="p-2 text-zinc-500 hover:text-red-500 bg-[#18181b] hover:bg-[#27272a] rounded-lg transition-colors cursor-pointer"
                        title="Delete Contact"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            <form onSubmit={handleAddContact} className="mt-auto space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Name (e.g. Jane)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#09090b] border border-[#27272a] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-red-500/50"
                  required
                />
                <input
                  type="text"
                  placeholder="Relation (e.g. Wife)"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full bg-[#09090b] border border-[#27272a] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-red-500/50"
                />
              </div>
              <div className="flex space-x-2">
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 bg-[#09090b] border border-[#27272a] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-red-500/50"
                  required
                />
                <button
                  type="submit"
                  disabled={!name || !phone}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 active:scale-95 text-white text-xs font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)] flex items-center justify-center cursor-pointer"
                >
                  <Plus size={14} className="mr-1" /> Add
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Women's Health Card (Functional) */}
        <div className={`bg-[#18181b] border border-[#27272a] rounded-2xl p-6 flex flex-col transition-all duration-300 ${SECTIONS[2].accentBorder} group relative`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl shadow-sm ${SECTIONS[2].accentBg}`}>
                {SECTIONS[2].icon}
              </div>
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-zinc-700 bg-zinc-800/80 text-zinc-400 flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>{SECTIONS[2].status}</span>
              </span>
            </div>

            <h4 className="text-lg font-bold text-white tracking-tight group-hover:text-rose-400 transition-colors">
              {SECTIONS[2].name}
            </h4>
            <p className="text-xs font-semibold text-zinc-400 mt-0.5 mb-1.5">
              {SECTIONS[2].subtitle}
            </p>
            <p className="text-[10px] text-zinc-500 italic">This data is private and only visible to you.</p>
          </div>

          <div className="mt-4 pt-4 border-t border-[#27272a]/60 flex-1 flex flex-col">
            {loadingPeriods ? (
              <p className="text-zinc-500 text-xs">Loading...</p>
            ) : (
              <div className="space-y-3 mb-6 flex-1">
                {periods.length === 0 ? (
                  <div className="bg-[#09090b] border border-[#27272a] rounded-xl p-3 text-center">
                    <p className="text-zinc-400 text-xs font-medium">No periods logged yet.</p>
                    <p className="text-zinc-500 text-[10px] mt-1">Predicted next: Not enough data yet</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 mb-4">
                      <p className="text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">Predicted Next</p>
                      <p className="text-white text-sm font-semibold">
                        {getNextPredictedDate && getNextPredictedDate(periods)
                          ? new Date(getNextPredictedDate(periods) + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'Not enough data yet'}
                      </p>
                    </div>
                    {periods.map(period => (
                      <div key={period.id} className="bg-[#09090b] border border-[#27272a] rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-white">{new Date(period.start_date + 'T00:00:00').toLocaleDateString()}</p>
                          {period.end_date && <p className="text-xs text-zinc-400">Ended: {new Date(period.end_date + 'T00:00:00').toLocaleDateString()}</p>}
                        </div>
                        <button
                          onClick={() => handleDeletePeriod(period.id)}
                          className="p-2 text-zinc-500 hover:text-rose-500 bg-[#18181b] hover:bg-[#27272a] rounded-lg transition-colors cursor-pointer"
                          title="Delete Log"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            <form onSubmit={handleAddPeriod} className="mt-auto space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={periodStartDate}
                    onChange={(e) => setPeriodStartDate(e.target.value)}
                    className="w-full bg-[#09090b] border border-[#27272a] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-rose-500/50"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">End Date <span className="lowercase font-normal text-zinc-600">(opt)</span></label>
                  <input
                    type="date"
                    value={periodEndDate}
                    onChange={(e) => setPeriodEndDate(e.target.value)}
                    className="w-full bg-[#09090b] border border-[#27272a] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-rose-500/50"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={!periodStartDate}
                className="w-full py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 active:scale-95 text-white text-xs font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(225,29,72,0.2)] flex items-center justify-center cursor-pointer"
              >
                <Plus size={14} className="mr-1" /> Log Period
              </button>
            </form>
          </div>
        </div>

        {/* Other Sections (Coming Soon) */}
        {SECTIONS.filter(s => s.status !== 'Active').map((section) => (
          <div
            key={section.id}
            onClick={() => setSelectedSection(section)}
            className={`bg-[#18181b] border border-[#27272a] rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl ${section.accentBorder} group relative cursor-pointer`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl shadow-sm ${section.accentBg}`}>
                  {section.icon}
                </div>
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-zinc-700 bg-zinc-800/80 text-zinc-400 flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                  <span>{section.status}</span>
                </span>
              </div>

              <h4 className="text-lg font-bold text-white tracking-tight group-hover:text-red-400 transition-colors">
                {section.name}
              </h4>
              <p className="text-xs font-semibold text-zinc-400 mt-0.5">
                {section.subtitle}
              </p>
              <p className="text-xs text-zinc-500 mt-2 line-clamp-2">
                {section.category}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#27272a]/60 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 font-medium">Access features</span>
              <div className="p-2 bg-[#27272a] text-zinc-400 group-hover:text-white group-hover:bg-[#3f3f46] rounded-xl transition-colors">
                <ArrowRight size={14} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* "Coming Soon" Modal Dialog */}
      {selectedSection && (
        <div 
          role="dialog"
          aria-modal="true"
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div 
            className="bg-[#18181b] border border-[#27272a] rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedSection(null)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white bg-[#27272a]/60 hover:bg-[#27272a] p-2 rounded-full transition cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-2xl ${selectedSection.accentBg}`}>
                {selectedSection.icon}
              </div>
              <div>
                <h3 className="text-xl font-black text-white">
                  {selectedSection.name}
                </h3>
                <p className="text-xs text-zinc-400">{selectedSection.subtitle}</p>
              </div>
            </div>

            <div className="bg-[#09090b] border border-amber-500/30 rounded-2xl p-4 my-5 space-y-2">
              <div className="flex items-center space-x-2 text-amber-400 text-sm font-bold">
                <AlertCircle size={18} className="flex-shrink-0" />
                <span>Feature in active development</span>
              </div>
              <p className="text-zinc-300 text-xs md:text-sm leading-relaxed">
                {selectedSection.id === 'medical' && 'Secure storage for medical history is in development and this needs a real security review before it stores anything, so it\'s not available yet.'}
                {selectedSection.id === 'womens_health' && 'Cycle and pregnancy tracking is on our roadmap, and it needs careful handling before it\'s built.'}
                {selectedSection.id === 'community' && 'Following friends and planning activities together is on the roadmap.'}
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setSelectedSection(null)}
                className="w-full bg-[#27272a] hover:bg-[#3f3f46] text-white py-3 px-4 rounded-xl font-semibold text-sm transition cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
