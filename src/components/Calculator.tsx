import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calculator as CalcIcon, Coins, Bitcoin, Target, ShieldAlert, RefreshCw } from 'lucide-react';

export default function Calculator() {
  const [asset, setAsset] = useState<'gold' | 'crypto' | 'forex'>('gold');
  const [entry, setEntry] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [target, setTarget] = useState('');
  const [lotSize, setLotSize] = useState('0.01');
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  
  const [results, setResults] = useState({
    riskAmount: 0,
    rewardAmount: 0,
    riskRewardRatio: 0,
    pipsRisk: 0,
    pipsReward: 0
  });

  const fetchLivePrice = async () => {
    setIsFetching(true);
    try {
      let symbol = '';
      if (asset === 'gold') symbol = 'PAXGUSDT';
      else if (asset === 'crypto') symbol = 'BTCUSDT';
      
      if (symbol) {
        const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
        const data = await res.json();
        if (data.price) {
          const price = parseFloat(data.price);
          setLivePrice(price);
          setEntry(price.toString());
        }
      }
    } catch (error) {
      console.error('Failed to fetch live price:', error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (asset !== 'forex') {
      fetchLivePrice();
    } else {
      setLivePrice(null);
    }
  }, [asset]);

  useEffect(() => {
    const e = parseFloat(entry);
    const sl = parseFloat(stopLoss);
    const tp = parseFloat(target);
    const ls = parseFloat(lotSize);

    if (!e || !sl || !tp || !ls) return;

    let pipsRisk = 0;
    let pipsReward = 0;
    let riskAmount = 0;
    let rewardAmount = 0;

    if (asset === 'gold') {
      // Gold: 1 pip = 0.10 price change
      pipsRisk = Math.abs(e - sl) * 10;
      pipsReward = Math.abs(e - tp) * 10;
      // 0.01 lot = $1 per 1.00 price change ($0.10 per 0.10 pip)
      riskAmount = Math.abs(e - sl) * ls * 100;
      rewardAmount = Math.abs(e - tp) * ls * 100;
    } else if (asset === 'crypto') {
      pipsRisk = Math.abs(e - sl);
      pipsReward = Math.abs(e - tp);
      riskAmount = pipsRisk * ls;
      rewardAmount = pipsReward * ls;
    } else {
      // Forex: 1 pip = 0.0001 (standard)
      pipsRisk = Math.abs(e - sl) * 10000;
      pipsReward = Math.abs(e - tp) * 10000;
      riskAmount = pipsRisk * ls * 10; // Approx for USD pairs
      rewardAmount = pipsReward * ls * 10;
    }

    setResults({
      riskAmount,
      rewardAmount,
      riskRewardRatio: rewardAmount / riskAmount,
      pipsRisk,
      pipsReward
    });
  }, [entry, stopLoss, target, lotSize, asset]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold">Trading Calculator</h2>
          <p className="text-zinc-400">Calculate your risk and targets with precision.</p>
        </div>
        {livePrice && (
          <div className="text-right">
            <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest mb-1">Live {asset === 'gold' ? 'Gold' : 'BTC'} Price</p>
            <div className="flex items-center gap-3">
              <span className="text-xl font-mono font-bold text-emerald-400">${livePrice.toLocaleString()}</span>
              <button 
                onClick={fetchLivePrice}
                disabled={isFetching}
                className={`p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors ${isFetching ? 'animate-spin' : ''}`}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="flex gap-4 p-1 glass rounded-2xl w-fit">
        <button 
          onClick={() => setAsset('gold')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${asset === 'gold' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Coins className="w-4 h-4" /> Gold (XAU)
        </button>
        <button 
          onClick={() => setAsset('crypto')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${asset === 'crypto' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Bitcoin className="w-4 h-4" /> Crypto / BTC
        </button>
        <button 
          onClick={() => setAsset('forex')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${asset === 'forex' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <CalcIcon className="w-4 h-4" /> Forex
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Entry Price</label>
            <input 
              type="number" 
              value={entry}
              onChange={e => setEntry(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-xl font-mono focus:outline-none focus:ring-2 focus:ring-zinc-500"
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Stop Loss</label>
            <input 
              type="number" 
              value={stopLoss}
              onChange={e => setStopLoss(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-xl font-mono focus:outline-none focus:ring-2 focus:ring-red-500/50"
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Take Profit</label>
            <input 
              type="number" 
              value={target}
              onChange={e => setTarget(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Lot Size / Quantity</label>
            <input 
              type="number" 
              value={lotSize}
              onChange={e => setLotSize(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-xl font-mono focus:outline-none focus:ring-2 focus:ring-zinc-500"
              placeholder="0.01"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-2xl p-8 space-y-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <span className="text-zinc-400 uppercase tracking-widest text-xs font-bold">Total Risk</span>
              </div>
              <span className="text-2xl font-mono font-bold text-red-400">-${results.riskAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-emerald-400" />
                <span className="text-zinc-400 uppercase tracking-widest text-xs font-bold">Total Reward</span>
              </div>
              <span className="text-2xl font-mono font-bold text-emerald-400">+${results.rewardAmount.toFixed(2)}</span>
            </div>

            <div className="h-px bg-white/10" />

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">Pips at Risk</p>
                <p className="text-xl font-mono">{results.pipsRisk.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">Risk/Reward</p>
                <p className="text-xl font-mono">1 : {results.riskRewardRatio.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
            <p className="text-sm text-emerald-400/80 leading-relaxed italic">
              "Trading is not about being right, it's about being profitable. Manage your risk first, and the profits will follow."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
