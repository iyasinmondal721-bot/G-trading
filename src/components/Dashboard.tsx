import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, TrendingDown, Calendar, ArrowRight, Wallet, ArrowUpRight, ArrowDownLeft, Plus, Settings as SettingsIcon, X, Target, Shield, Zap, AlertTriangle, Info } from 'lucide-react';
import { Trade, Withdrawal, Settings } from '../types';
import { subDays, isAfter, parseISO, format, differenceInDays } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { calculateTraderScore } from '../utils/scoring';

interface DashboardProps {
  trades: Trade[];
  withdrawals: Withdrawal[];
  settings: Settings;
  onViewHistory: (days: number) => void;
  onUpdateSettings: (key: string, value: string) => void;
  onAddWithdrawal: (withdrawal: Partial<Withdrawal>) => void;
}

export default function Dashboard({ trades, withdrawals, settings, onViewHistory, onUpdateSettings, onAddWithdrawal }: DashboardProps) {
  const [isSettingBalance, setIsSettingBalance] = useState(false);
  const [isAddingWithdrawal, setIsAddingWithdrawal] = useState(false);
  const [isScoreDetailOpen, setIsScoreDetailOpen] = useState(false);
  const [newBalance, setNewBalance] = useState(settings.initial_balance);
  const [withdrawalData, setWithdrawalData] = useState({
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });

  const stats15 = useMemo(() => calculateStats(trades, withdrawals, 15), [trades, withdrawals]);
  const stats30 = useMemo(() => calculateStats(trades, withdrawals, 30), [trades, withdrawals]);

  const traderScore = useMemo(() => calculateTraderScore(trades, parseFloat(settings.initial_balance || '0')), [trades, settings.initial_balance]);

  const currentBalance = useMemo(() => {
    const initial = parseFloat(settings.initial_balance || '0');
    const totalPL = trades.reduce((sum, t) => sum + t.profit_loss, 0);
    const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0);
    return initial + totalPL - totalWithdrawals;
  }, [trades, withdrawals, settings]);

  const chartData = useMemo(() => {
    let balance = parseFloat(settings.initial_balance || '0');
    const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return sortedTrades.slice(-15).map(t => {
      balance += t.profit_loss;
      return {
        date: t.date,
        balance: balance,
      };
    });
  }, [trades, settings]);

  const handleSetBalance = () => {
    onUpdateSettings('initial_balance', newBalance);
    setIsSettingBalance(false);
  };

  const handleAddWithdrawalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddWithdrawal({
      amount: parseFloat(withdrawalData.amount),
      date: withdrawalData.date,
      notes: withdrawalData.notes
    });
    setIsAddingWithdrawal(false);
    setWithdrawalData({ amount: '', date: format(new Date(), 'yyyy-MM-dd'), notes: '' });
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold mb-2">Welcome back, Trader</h1>
          <p className="text-zinc-400">Your trading journey is evolving. Keep up the discipline.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsSettingBalance(true)}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-zinc-500"
            title="Set Initial Balance"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsAddingWithdrawal(true)}
            className="bg-zinc-100 text-zinc-900 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-white transition-all shadow-lg active:scale-95"
          >
            <ArrowUpRight className="w-4 h-4" /> Withdraw
          </button>
        </div>
      </header>

      {/* Trader Score Modal */}
      <AnimatePresence>
        {isScoreDetailOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setIsScoreDetailOpen(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass rounded-3xl p-6 w-full max-w-md relative overflow-hidden shadow-2xl border border-white/10 max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-red-500" />
              
              <div className="flex justify-between items-start mb-6 shrink-0">
                <div>
                  <h3 className="text-xl font-bold tracking-tight mb-1">Trader Score Breakdown</h3>
                  <p className="text-zinc-400 text-[10px]">A comprehensive analysis of your trading discipline.</p>
                </div>
                <button 
                  onClick={() => setIsScoreDetailOpen(false)} 
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-all group active:scale-90"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                </button>
              </div>

              <div className="overflow-y-auto pr-2 space-y-6 pb-4 custom-scrollbar">
                {traderScore.isViolation && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-3xl -mr-12 -mt-12" />
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0 shadow-inner">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="relative z-10">
                      <h4 className="text-red-400 font-bold text-sm mb-1">Critical Violation Active</h4>
                      <p className="text-red-400/80 text-[10px] leading-relaxed">
                        Your score is currently capped because you violated a critical risk rule. 
                        <span className="block mt-1 font-bold text-red-400">Your score will remain "Poor" until you recover your initial capital of ${settings.initial_balance}.</span>
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                  <ScoreFactor 
                    icon={<Target className="text-emerald-400 w-4 h-4" />}
                    label="Win Ratio"
                    score={traderScore.factors.winRate.score}
                    max={25}
                    value={`${traderScore.factors.winRate.value.toFixed(1)}%`}
                    description="Percentage of profitable trades."
                  />
                  <ScoreFactor 
                    icon={<Shield className="text-blue-400 w-4 h-4" />}
                    label="Discipline"
                    score={traderScore.factors.discipline.score}
                    max={25}
                    value={`${traderScore.factors.discipline.value.toFixed(1)}%`}
                    description="How well you follow your trading rules."
                  />
                  <ScoreFactor 
                    icon={<Zap className="text-amber-400 w-4 h-4" />}
                    label="Profit Factor"
                    score={traderScore.factors.profitFactor.score}
                    max={25}
                    value={traderScore.factors.profitFactor.value.toFixed(2)}
                    description="Ratio of gross profit to gross loss."
                  />
                  <ScoreFactor 
                    icon={<AlertTriangle className="text-red-400 w-4 h-4" />}
                    label="Over-trading"
                    score={traderScore.factors.overtrading.score}
                    max={25}
                    value={`${traderScore.factors.overtrading.value.toFixed(1)} trades/day`}
                    description="Maintaining a healthy trade frequency."
                  />
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-zinc-500/5 blur-2xl -mr-12 -mt-12" />
                  <h4 className="font-bold mb-2 flex items-center gap-2 text-zinc-200 text-sm">
                    <Info className="w-3 h-3 text-zinc-500" />
                    Improvement Roadmap
                  </h4>
                  <ul className="text-[10px] text-zinc-400 space-y-2">
                    {traderScore.total < 60 && (
                      <li className="flex gap-2">
                        <span className="w-1 h-1 rounded-full bg-red-400 mt-1 shrink-0" />
                        <span>Focus on following your rules strictly to boost your Discipline score.</span>
                      </li>
                    )}
                    {traderScore.factors.winRate.value < 40 && (
                      <li className="flex gap-2">
                        <span className="w-1 h-1 rounded-full bg-blue-400 mt-1 shrink-0" />
                        <span>Review your entry criteria to improve your Win Ratio.</span>
                      </li>
                    )}
                    {traderScore.factors.overtrading.value > 5 && (
                      <li className="flex gap-2">
                        <span className="w-1 h-1 rounded-full bg-amber-400 mt-1 shrink-0" />
                        <span>Try to limit yourself to 2-3 high-quality setups per day.</span>
                      </li>
                    )}
                    {traderScore.factors.profitFactor.value < 1.5 && (
                      <li className="flex gap-2">
                        <span className="w-1 h-1 rounded-full bg-zinc-400 mt-1 shrink-0" />
                        <span>Work on letting your winners run and cutting losses early.</span>
                      </li>
                    )}
                    {traderScore.total >= 70 && (
                      <li className="flex gap-2">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1 shrink-0" />
                        <span>Excellent work! Maintain this consistency to grow your account steadily.</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="pt-4 shrink-0">
                <button 
                  onClick={() => setIsScoreDetailOpen(false)}
                  className="w-full py-3 bg-white text-zinc-900 rounded-xl font-bold hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-lg text-xs"
                >
                  Got it, thanks
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Balance Modal */}
        {isSettingBalance && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setIsSettingBalance(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass rounded-3xl p-8 w-full max-w-md relative overflow-hidden shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-zinc-400" />
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold tracking-tight">Set Initial Balance</h3>
                <button 
                  onClick={() => setIsSettingBalance(false)}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
              <p className="text-zinc-400 text-sm mb-8">Enter the amount you started your trading journey with. This is used to calculate your risk limits and score.</p>
              <div className="relative mb-8">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-2xl font-mono">$</span>
                <input 
                  type="number" 
                  value={newBalance}
                  onChange={e => setNewBalance(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-5 text-3xl font-mono focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsSettingBalance(false)}
                  className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-bold hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSetBalance}
                  className="flex-1 py-4 bg-white text-zinc-900 rounded-2xl font-bold hover:bg-zinc-200 transition-all shadow-lg active:scale-95"
                >
                  Save Balance
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Withdrawal Modal */}
        {isAddingWithdrawal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setIsAddingWithdrawal(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass rounded-3xl p-8 w-full max-w-md relative overflow-hidden shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-400" />
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold tracking-tight">Record Withdrawal</h3>
                <button 
                  onClick={() => setIsAddingWithdrawal(false)}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
              
              <form onSubmit={handleAddWithdrawalSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">$</span>
                    <input 
                      type="number" 
                      required
                      value={withdrawalData.amount}
                      onChange={e => setWithdrawalData({ ...withdrawalData, amount: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-4 text-xl font-mono focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Date</label>
                  <input 
                    type="date" 
                    required
                    value={withdrawalData.date}
                    onChange={e => setWithdrawalData({ ...withdrawalData, date: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-all text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Notes (Optional)</label>
                  <textarea 
                    value={withdrawalData.notes}
                    onChange={e => setWithdrawalData({ ...withdrawalData, notes: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-all text-white h-24 resize-none"
                    placeholder="e.g., Monthly profit payout"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsAddingWithdrawal(false)}
                    className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-bold hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-amber-400 text-black rounded-2xl font-bold hover:bg-amber-300 transition-all shadow-lg active:scale-95"
                  >
                    Confirm
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Balance Card */}
        <div className="glass rounded-2xl p-8 relative overflow-hidden lg:col-span-1">
          <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full blur-3xl opacity-20 bg-zinc-100" />
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-5 h-5 text-zinc-400" />
            <span className="text-zinc-500 text-xs uppercase tracking-widest font-bold">Account Balance</span>
          </div>
          <h2 className="text-4xl font-mono font-bold tracking-tighter mb-2">
            ${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-500">Initial:</span>
            <span className="font-mono">${parseFloat(settings.initial_balance).toLocaleString()}</span>
          </div>
        </div>

        {/* Trader Score Card */}
        <div 
          onClick={() => setIsScoreDetailOpen(true)}
          className="glass rounded-2xl p-8 relative overflow-hidden lg:col-span-1 cursor-pointer group hover:bg-white/[0.02] transition-colors"
        >
          <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full blur-3xl opacity-20 ${traderScore.total >= 70 ? 'bg-emerald-500' : traderScore.total >= 60 ? 'bg-blue-500' : 'bg-red-500'}`} />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-zinc-400" />
              <span className="text-zinc-500 text-xs uppercase tracking-widest font-bold">Trader Score</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${traderScore.total >= 70 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : traderScore.total >= 60 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {traderScore.label}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <h2 className="text-5xl font-mono font-bold tracking-tighter">{traderScore.total}</h2>
            <span className="text-zinc-500 text-xl font-mono">/100</span>
          </div>
          <p className="text-xs text-zinc-500 mt-2 group-hover:text-zinc-300 transition-colors">Click to see impact factors →</p>
        </div>

        {/* Performance Cards */}
        <PerformanceCard 
          title="Last 15 Days" 
          stats={stats15} 
          onClick={() => onViewHistory(15)} 
        />
        <PerformanceCard 
          title="Last 30 Days" 
          stats={stats30} 
          onClick={() => onViewHistory(30)} 
        />
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          Account Equity Growth (Last 15 Trades)
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#71717a" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="#71717a" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                domain={['auto', 'auto']}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                itemStyle={{ color: '#ffffff' }}
                formatter={(value: any) => [`$${value.toLocaleString()}`, 'Balance']}
              />
              <Area 
                type="monotone" 
                dataKey="balance" 
                stroke="#ffffff" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorBalance)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function ScoreFactor({ icon, label, score, max, value, description }: { icon: React.ReactNode, label: string, score: number, max: number, value: string, description: string }) {
  const percentage = (score / max) * 100;
  const colorClass = percentage >= 70 ? 'bg-emerald-400' : percentage >= 50 ? 'bg-blue-400' : 'bg-red-400';
  const shadowClass = percentage >= 70 ? 'shadow-[0_0_10px_rgba(52,211,153,0.3)]' : percentage >= 50 ? 'shadow-[0_0_10px_rgba(96,165,250,0.3)]' : 'shadow-[0_0_10px_rgba(248,113,113,0.3)]';

  return (
    <div className="glass bg-white/5 p-6 rounded-3xl border border-white/5 relative overflow-hidden group hover:bg-white/[0.07] transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/5 group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <span className="font-bold text-sm tracking-tight">{label}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs font-mono text-zinc-500">{score}/{max}</span>
        </div>
      </div>
      
      <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-4 p-[1px]">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClass} ${shadowClass}`}
        />
      </div>
      
      <div className="flex justify-between items-end">
        <p className="text-[10px] text-zinc-500 leading-relaxed pr-4 max-w-[140px]">{description}</p>
        <p className="text-xl font-mono font-bold text-white tracking-tighter">{value}</p>
      </div>
    </div>
  );
}

function PerformanceCard({ title, stats, onClick }: { title: string, stats: any, onClick: () => void }) {
  const isProfitable = stats.totalProfit >= 0;

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={`glass rounded-2xl p-8 cursor-pointer group relative overflow-hidden`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full blur-3xl opacity-20 ${isProfitable ? 'bg-emerald-500' : 'bg-red-500'}`} />
      
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-zinc-500 text-sm uppercase tracking-wider font-medium mb-1">{title}</p>
          <h2 className={`text-3xl font-mono font-bold ${isProfitable ? 'text-emerald-400' : 'text-red-400'}`}>
            {isProfitable ? '+' : ''}${stats.totalProfit.toFixed(2)}
          </h2>
        </div>
        <div className={`p-3 rounded-xl ${isProfitable ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
          {isProfitable ? <TrendingUp className="text-emerald-400" /> : <TrendingDown className="text-red-400" />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="glass bg-white/5 rounded-xl p-3 border border-white/5">
          <p className="text-zinc-500 text-[9px] uppercase font-bold tracking-widest mb-1 opacity-70">Withdrawals</p>
          <p className="text-base font-mono font-bold text-amber-400">-${stats.totalWithdrawals.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="glass bg-white/5 rounded-xl p-3 border border-white/5">
          <p className="text-zinc-500 text-[9px] uppercase font-bold tracking-widest mb-1 opacity-70">Win Rate</p>
          <p className="text-base font-bold text-white">{stats.winRate.toFixed(1)}%</p>
        </div>
      </div>

      <div className="flex items-center text-sm text-zinc-400 group-hover:text-white transition-colors">
        View detailed history <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
      </div>
    </motion.div>
  );
}

function calculateStats(trades: Trade[], withdrawals: Withdrawal[], days: number) {
  const cutoff = subDays(new Date(), days);
  const filteredTrades = trades.filter(t => isAfter(parseISO(t.date), cutoff));
  const filteredWithdrawals = withdrawals.filter(w => isAfter(parseISO(w.date), cutoff));
  
  const totalProfit = filteredTrades.reduce((sum, t) => sum + t.profit_loss, 0);
  const totalWithdrawals = filteredWithdrawals.reduce((sum, w) => sum + w.amount, 0);
  const wins = filteredTrades.filter(t => t.profit_loss > 0).length;
  const winRate = filteredTrades.length > 0 ? (wins / filteredTrades.length) * 100 : 0;

  return {
    totalProfit,
    totalWithdrawals,
    winRate,
    count: filteredTrades.length
  };
}
