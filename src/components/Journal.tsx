import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Check, X, Trash2, Calendar, DollarSign, Tag, FileText, AlertCircle } from 'lucide-react';
import { Trade } from '../types';
import { format } from 'date-fns';

interface JournalProps {
  trades: Trade[];
  onAddTrade: (trade: Partial<Trade>) => void;
  onDeleteTrade: (id: number) => void;
  filterDays?: number | null;
}

export default function Journal({ trades, onAddTrade, onDeleteTrade, filterDays }: JournalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    asset: 'XAUUSD',
    entry_price: '',
    exit_price: '',
    profit_loss: '',
    day_total: '',
    rules_followed: true,
    notes_good: '',
    notes_bad: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTrade({
      ...formData,
      entry_price: formData.entry_price ? parseFloat(formData.entry_price) : null,
      exit_price: formData.exit_price ? parseFloat(formData.exit_price) : null,
      profit_loss: parseFloat(formData.profit_loss),
      day_total: formData.day_total ? parseFloat(formData.day_total) : null,
      rules_followed: formData.rules_followed ? 1 : 0
    });
    setIsAdding(false);
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      asset: 'XAUUSD',
      entry_price: '',
      exit_price: '',
      profit_loss: '',
      day_total: '',
      rules_followed: true,
      notes_good: '',
      notes_bad: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">
            {filterDays ? `Last ${filterDays} Days History` : 'Trading Journal'}
          </h2>
          <p className="text-zinc-400">Log your journey and learn from every trade.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-zinc-100 text-zinc-900 px-6 py-3 rounded-xl font-medium flex items-center gap-2 hover:bg-white transition-colors"
        >
          <Plus className="w-5 h-5" /> New Entry
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass rounded-2xl p-8"
          >
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Date</label>
                <input 
                  type="date" 
                  required
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Asset</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. XAUUSD, BTCUSD"
                  value={formData.asset}
                  onChange={e => setFormData({...formData, asset: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Profit / Loss ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={formData.profit_loss}
                  onChange={e => setFormData({...formData, profit_loss: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Entry Price</label>
                <input 
                  type="number" 
                  step="0.00001"
                  value={formData.entry_price}
                  onChange={e => setFormData({...formData, entry_price: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Exit Price</label>
                <input 
                  type="number" 
                  step="0.00001"
                  value={formData.exit_price}
                  onChange={e => setFormData({...formData, exit_price: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Day Overall P/L</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.day_total}
                  onChange={e => setFormData({...formData, day_total: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>

              <div className="md:col-span-3 flex items-center gap-4 py-2">
                <span className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Rules Followed?</span>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, rules_followed: true})}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${formData.rules_followed ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-white/10 text-zinc-500'}`}
                >
                  <Check className="w-4 h-4" /> Yes
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, rules_followed: false})}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${!formData.rules_followed ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-white/10 text-zinc-500'}`}
                >
                  <X className="w-4 h-4" /> No
                </button>
              </div>

              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">What went right?</label>
                  <textarea 
                    value={formData.notes_good}
                    onChange={e => setFormData({...formData, notes_good: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 h-24 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    placeholder="Describe your wins..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">What went wrong?</label>
                  <textarea 
                    value={formData.notes_bad}
                    onChange={e => setFormData({...formData, notes_bad: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 h-24 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    placeholder="Describe your mistakes..."
                  />
                </div>
              </div>

              <div className="md:col-span-3 flex justify-end gap-4">
                <button 
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-zinc-100 text-zinc-900 px-8 py-3 rounded-xl font-bold hover:bg-white transition-colors"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {trades.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center text-zinc-500">
            No trades logged yet. Start your journey today.
          </div>
        ) : (
          trades.map((trade) => (
            <TradeRow key={trade.id} trade={trade} onDelete={() => onDeleteTrade(trade.id)} />
          ))
        )}
      </div>
    </div>
  );
}

interface TradeRowProps {
  trade: Trade;
  onDelete: () => void;
  key?: React.Key;
}

function TradeRow({ trade, onDelete }: TradeRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isProfit = trade.profit_loss >= 0;

  return (
    <div className="glass rounded-2xl overflow-hidden group">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-6 flex flex-wrap items-center gap-6 cursor-pointer hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-[140px]">
          <Calendar className="w-4 h-4 text-zinc-500" />
          <span className="font-mono text-sm">{trade.date}</span>
        </div>
        
        <div className="flex items-center gap-3 min-w-[120px]">
          <Tag className="w-4 h-4 text-zinc-500" />
          <span className="font-bold tracking-tight">{trade.asset}</span>
        </div>

        <div className="flex-1 flex items-center justify-end gap-8">
          <div className="text-right">
            <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Profit/Loss</p>
            <p className={`text-lg font-mono font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
              {isProfit ? '+' : ''}${trade.profit_loss.toFixed(2)}
            </p>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${trade.rules_followed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {trade.rules_followed ? 'Rules Followed' : 'Rules Broken'}
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-2 text-zinc-600 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5 bg-white/[0.02]"
          >
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass bg-white/5 p-4 rounded-xl">
                    <p className="text-xs text-zinc-500 mb-1">Entry Price</p>
                    <p className="font-mono">{trade.entry_price || 'N/A'}</p>
                  </div>
                  <div className="glass bg-white/5 p-4 rounded-xl">
                    <p className="text-xs text-zinc-500 mb-1">Exit Price</p>
                    <p className="font-mono">{trade.exit_price || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="glass bg-white/5 p-4 rounded-xl">
                  <p className="text-xs text-zinc-500 mb-1">Day Total P/L</p>
                  <p className={`font-mono font-bold ${(trade.day_total || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ${trade.day_total?.toFixed(2) || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-bold text-emerald-400 mb-2">
                    <Check className="w-4 h-4" /> What went right
                  </h4>
                  <p className="text-zinc-400 text-sm leading-relaxed italic">
                    {trade.notes_good || 'No notes provided.'}
                  </p>
                </div>
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-bold text-red-400 mb-2">
                    <AlertCircle className="w-4 h-4" /> What went wrong
                  </h4>
                  <p className="text-zinc-400 text-sm leading-relaxed italic">
                    {trade.notes_bad || 'No notes provided.'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
