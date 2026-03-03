import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Calculator as CalcIcon, 
  History as HistoryIcon, 
  Menu, 
  X,
  TrendingUp,
  LogOut,
  ArrowUpRight
} from 'lucide-react';
import { Trade, View, Withdrawal, Settings } from './types';
import Dashboard from './components/Dashboard';
import Journal from './components/Journal';
import Calculator from './components/Calculator';
import History from './components/History';

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [settings, setSettings] = useState<Settings>({ initial_balance: '0' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [filterDays, setFilterDays] = useState<number | null>(null);

  useEffect(() => {
    fetchTrades();
    fetchWithdrawals();
    fetchSettings();
  }, []);

  const fetchTrades = async () => {
    try {
      const res = await fetch('/api/trades');
      const data = await res.json();
      setTrades(data);
    } catch (error) {
      console.error('Failed to fetch trades:', error);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch('/api/withdrawals');
      const data = await res.json();
      setWithdrawals(data);
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleAddTrade = async (trade: Partial<Trade>) => {
    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trade)
      });
      if (res.ok) {
        fetchTrades();
      }
    } catch (error) {
      console.error('Failed to add trade:', error);
    }
  };

  const handleAddWithdrawal = async (withdrawal: Partial<Withdrawal>) => {
    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(withdrawal)
      });
      if (res.ok) {
        fetchWithdrawals();
      }
    } catch (error) {
      console.error('Failed to add withdrawal:', error);
    }
  };

  const updateSettings = async (key: string, value: string) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      if (res.ok) {
        fetchSettings();
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const handleResetData = async () => {
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        fetchTrades();
        fetchWithdrawals();
        fetchSettings();
        setView('dashboard');
      }
    } catch (error) {
      console.error('Failed to reset data:', error);
    }
  };

  const handleDeleteTrade = async (id: number) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    try {
      const res = await fetch(`/api/trades/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTrades();
      }
    } catch (error) {
      console.error('Failed to delete trade:', error);
    }
  };

  const handleViewHistory = (days: number) => {
    setFilterDays(days);
    setView('history');
  };

  const filteredTrades = filterDays 
    ? trades.filter(t => {
        const tradeDate = new Date(t.date);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - filterDays);
        return tradeDate >= cutoff;
      })
    : trades;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'journal', label: 'Trading Journal', icon: BookOpen },
    { id: 'calculator', label: 'Pip Calculator', icon: CalcIcon },
    { id: 'history', label: 'History & Activity', icon: HistoryIcon },
  ];

  return (
    <div className="min-h-screen flex bg-[#0A0A0B]">
      {/* Sidebar Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0F0F11] border-r border-white/5 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-12 px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-zinc-900 w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight">TradeMaster</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-zinc-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id as View);
                  if (item.id !== 'history') setFilterDays(null);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${view === item.id ? 'bg-white/5 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'}`}
              >
                <item.icon className={`w-5 h-5 ${view === item.id ? 'text-zinc-100' : 'text-zinc-600'}`} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-white/5">
            <div className="flex items-center gap-3 px-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/10" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Trader Pro</p>
                <p className="text-xs text-zinc-500 truncate">iyasinmondal721@gmail.com</p>
              </div>
            </div>
            <button 
              onClick={() => setIsResetConfirmOpen(true)}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-all"
            >
              <LogOut className="w-5 h-5 rotate-180" />
              <span className="font-medium">Reset All Data</span>
            </button>
            <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-all">
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Global Modals */}
      <AnimatePresence>
        {isResetConfirmOpen && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setIsResetConfirmOpen(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass rounded-3xl p-8 w-full max-w-md relative overflow-hidden shadow-2xl border border-red-500/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
              <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mb-6 mx-auto">
                <LogOut className="w-8 h-8 text-red-400 rotate-180" />
              </div>
              <h3 className="text-2xl font-bold text-center mb-2">Reset All Data?</h3>
              <p className="text-zinc-400 text-center text-sm mb-8 leading-relaxed">
                This action is irreversible. All your trades, withdrawals, and settings will be permanently deleted from the database.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-bold hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    handleResetData();
                    setIsResetConfirmOpen(false);
                    setIsSidebarOpen(false);
                  }}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg active:scale-95"
                >
                  Yes, Reset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto">
        <header className="sticky top-0 z-40 bg-[#0A0A0B]/80 backdrop-blur-xl border-b border-white/5 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-zinc-100 w-6 h-6" />
            <span className="text-lg font-bold">TradeMaster</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-zinc-400 hover:text-white transition-colors">
            {isSidebarOpen ? <X /> : <Menu />}
          </button>
        </header>

        <div className="max-w-6xl mx-auto p-8 lg:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={view + (filterDays || '')}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {view === 'dashboard' && (
                <Dashboard 
                  trades={trades} 
                  withdrawals={withdrawals}
                  settings={settings}
                  onViewHistory={handleViewHistory} 
                  onUpdateSettings={updateSettings}
                  onAddWithdrawal={handleAddWithdrawal}
                />
              )}
              {view === 'journal' && (
                <Journal 
                  trades={filteredTrades} 
                  onAddTrade={handleAddTrade} 
                  onDeleteTrade={handleDeleteTrade}
                  filterDays={filterDays}
                />
              )}
              {view === 'calculator' && (
                <Calculator />
              )}
              {view === 'history' && (
                <History 
                  trades={filteredTrades}
                  withdrawals={withdrawals}
                  onDeleteTrade={handleDeleteTrade}
                  initialBalance={parseFloat(settings.initial_balance || '0')}
                  filterDays={filterDays}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
