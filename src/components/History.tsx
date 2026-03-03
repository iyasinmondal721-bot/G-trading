import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trade, Withdrawal } from '../types';
import { Calendar, ArrowUpRight, FileText, Tag, ArrowDownLeft, Trash2, Check, AlertCircle, Search, Filter, TrendingUp, TrendingDown, Wallet, Zap, Download } from 'lucide-react';
import { format, isWithinInterval, parseISO, startOfDay, endOfDay, subDays } from 'date-fns';
import { calculateScoreForRange } from '../utils/scoring';

interface HistoryProps {
  trades: Trade[];
  withdrawals: Withdrawal[];
  onDeleteTrade: (id: number) => void;
  initialBalance: number;
  filterDays?: number | null;
}

type HistoryTab = 'all' | 'journal' | 'withdrawals';

export default function History({ trades, withdrawals, onDeleteTrade, initialBalance, filterDays }: HistoryProps) {
  const [activeTab, setActiveTab] = useState<HistoryTab>('all');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const filteredData = useMemo(() => {
    const start = startOfDay(parseISO(startDate));
    const end = endOfDay(parseISO(endDate));

    const filteredTrades = trades.filter(t => {
      const date = parseISO(t.date);
      return isWithinInterval(date, { start, end });
    });

    const filteredWithdrawals = withdrawals.filter(w => {
      const date = parseISO(w.date);
      return isWithinInterval(date, { start, end });
    });

    return { trades: filteredTrades, withdrawals: filteredWithdrawals };
  }, [trades, withdrawals, startDate, endDate]);

  const stats = useMemo(() => {
    const totalProfit = filteredData.trades.filter(t => t.profit_loss > 0).reduce((sum, t) => sum + t.profit_loss, 0);
    const totalLoss = Math.abs(filteredData.trades.filter(t => t.profit_loss < 0).reduce((sum, t) => sum + t.profit_loss, 0));
    const totalWithdrawals = filteredData.withdrawals.reduce((sum, w) => sum + w.amount, 0);
    const score = calculateScoreForRange(trades, initialBalance, startDate, endDate);

    return { totalProfit, totalLoss, totalWithdrawals, score };
  }, [filteredData, trades, initialBalance, startDate, endDate]);

  const combinedHistory = useMemo(() => {
    const tradeItems = filteredData.trades.map(t => ({ ...t, type: 'trade' as const }));
    const withdrawalItems = filteredData.withdrawals.map(w => ({ ...w, type: 'withdrawal' as const }));
    return [...tradeItems, ...withdrawalItems].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [filteredData]);

  const handleDownloadCSV = () => {
    const headers = ['Date', 'Type', 'Asset', 'Amount/PL', 'Rules Followed', 'Notes'];
    const rows = combinedHistory.map(item => {
      if (item.type === 'trade') {
        const t = item as Trade;
        return [
          t.date,
          'Trade',
          t.asset,
          t.profit_loss.toFixed(2),
          t.rules_followed ? 'Yes' : 'No',
          `"${(t.notes_good || '') + ' ' + (t.notes_bad || '')}"`.trim()
        ];
      } else {
        const w = item as Withdrawal;
        return [
          w.date,
          'Withdrawal',
          '-',
          `-${w.amount.toFixed(2)}`,
          '-',
          `"${w.notes || ''}"`
        ];
      }
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `trading_history_${startDate}_to_${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold">
            {filterDays ? `Last ${filterDays} Days Activity` : 'Account History'}
          </h2>
          <p className="text-zinc-400">Review your financial movements, trades, and withdrawals.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 glass p-4 rounded-2xl border border-white/5">
          <button 
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all border border-white/5"
          >
            <Download className="w-3.5 h-3.5" />
            Download CSV
          </button>
          <div className="w-px h-4 bg-white/10 hidden md:block" />
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <input 
              type="date" 
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-transparent border-none text-sm focus:ring-0 p-0 w-32"
            />
          </div>
          <span className="text-zinc-600">to</span>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <input 
              type="date" 
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-transparent border-none text-sm focus:ring-0 p-0 w-32"
            />
          </div>
        </div>
      </header>

      {/* Summary Stats for Range */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass p-4 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Total Profit</span>
          </div>
          <p className="text-xl font-mono font-bold text-emerald-400">${stats.totalProfit.toFixed(2)}</p>
        </div>
        <div className="glass p-4 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Total Loss</span>
          </div>
          <p className="text-xl font-mono font-bold text-red-400">-${stats.totalLoss.toFixed(2)}</p>
        </div>
        <div className="glass p-4 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Withdrawals</span>
          </div>
          <p className="text-xl font-mono font-bold text-amber-400">-${stats.totalWithdrawals.toFixed(2)}</p>
        </div>
        <div className="glass p-4 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Period Score</span>
          </div>
          <p className="text-xl font-mono font-bold text-blue-400">{stats.score ?? 'N/A'}<span className="text-xs text-zinc-500 ml-1">/100</span></p>
        </div>
      </div>

      <div className="flex gap-4 p-1 glass rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('all')}
          className={`px-6 py-2.5 rounded-xl transition-all text-sm font-medium ${activeTab === 'all' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          All Activity
        </button>
        <button 
          onClick={() => setActiveTab('journal')}
          className={`px-6 py-2.5 rounded-xl transition-all text-sm font-medium ${activeTab === 'journal' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Journal History
        </button>
        <button 
          onClick={() => setActiveTab('withdrawals')}
          className={`px-6 py-2.5 rounded-xl transition-all text-sm font-medium ${activeTab === 'withdrawals' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Withdrawals
        </button>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {activeTab === 'all' && (
              combinedHistory.length === 0 ? (
                <EmptyState />
              ) : (
                combinedHistory.map((item) => (
                  item.type === 'trade' ? (
                    <TradeRow key={`trade-${item.id}`} trade={item as Trade} onDelete={() => onDeleteTrade(item.id)} />
                  ) : (
                    <WithdrawalRow key={`withdrawal-${item.id}`} withdrawal={item as Withdrawal} />
                  )
                ))
              )
            )}

            {activeTab === 'journal' && (
              filteredData.trades.length === 0 ? (
                <EmptyState message="No journal entries found for this period." />
              ) : (
                filteredData.trades.map((trade) => (
                  <TradeRow key={`trade-${trade.id}`} trade={trade} onDelete={() => onDeleteTrade(trade.id)} />
                ))
              )
            )}

            {activeTab === 'withdrawals' && (
              filteredData.withdrawals.length === 0 ? (
                <EmptyState message="No withdrawals found for this period." />
              ) : (
                filteredData.withdrawals.map((withdrawal) => (
                  <WithdrawalRow key={`withdrawal-${withdrawal.id}`} withdrawal={withdrawal} />
                ))
              )
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function EmptyState({ message = "No activity found for this period." }: { message?: string }) {
  return (
    <div className="glass rounded-2xl p-12 text-center text-zinc-500">
      {message}
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
        className="p-5 flex flex-wrap items-center gap-6 cursor-pointer hover:bg-white/5 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <ArrowDownLeft className={`w-5 h-5 ${isProfit ? 'text-emerald-400' : 'text-red-400'}`} />
        </div>
        
        <div className="flex items-center gap-3 min-w-[120px]">
          <Calendar className="w-4 h-4 text-zinc-500" />
          <span className="font-mono text-sm">{trade.date}</span>
        </div>
        
        <div className="flex items-center gap-3 min-w-[100px]">
          <Tag className="w-4 h-4 text-zinc-500" />
          <span className="font-bold tracking-tight">{trade.asset}</span>
        </div>

        <div className="flex-1 flex items-center justify-end gap-8">
          <div className="text-right">
            <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Trade P/L</p>
            <p className={`text-lg font-mono font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
              {isProfit ? '+' : ''}${trade.profit_loss.toFixed(2)}
            </p>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${trade.rules_followed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {trade.rules_followed ? 'Rules OK' : 'Broken'}
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-2 text-zinc-600 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
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
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass bg-white/5 p-3 rounded-xl">
                    <p className="text-[10px] uppercase text-zinc-500 mb-1">Entry</p>
                    <p className="font-mono text-sm">{trade.entry_price || 'N/A'}</p>
                  </div>
                  <div className="glass bg-white/5 p-3 rounded-xl">
                    <p className="text-[10px] uppercase text-zinc-500 mb-1">Exit</p>
                    <p className="font-mono text-sm">{trade.exit_price || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="flex items-center gap-2 text-[10px] uppercase font-bold text-emerald-400 mb-1">
                    <Check className="w-3 h-3" /> Wins
                  </h4>
                  <p className="text-zinc-400 text-xs leading-relaxed italic">
                    {trade.notes_good || 'No notes.'}
                  </p>
                </div>
                <div>
                  <h4 className="flex items-center gap-2 text-[10px] uppercase font-bold text-red-400 mb-1">
                    <AlertCircle className="w-3 h-3" /> Mistakes
                  </h4>
                  <p className="text-zinc-400 text-xs leading-relaxed italic">
                    {trade.notes_bad || 'No notes.'}
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

interface WithdrawalRowProps {
  withdrawal: Withdrawal;
  key?: React.Key;
}

function WithdrawalRow({ withdrawal }: WithdrawalRowProps) {
  return (
    <div className="glass rounded-2xl p-5 flex items-center gap-6 border-l-4 border-amber-500/30">
      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
        <ArrowUpRight className="w-5 h-5 text-amber-400" />
      </div>
      
      <div className="flex items-center gap-3 min-w-[120px]">
        <Calendar className="w-4 h-4 text-zinc-500" />
        <span className="font-mono text-sm">{withdrawal.date}</span>
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-zinc-500" />
          <span className="text-sm text-zinc-400 truncate max-w-md">{withdrawal.notes || 'Payout Withdrawal'}</span>
        </div>
      </div>

      <div className="text-right">
        <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Withdrawal</p>
        <p className="text-lg font-mono font-bold text-amber-400">
          -${withdrawal.amount.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
