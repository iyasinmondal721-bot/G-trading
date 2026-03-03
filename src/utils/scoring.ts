import { Trade } from '../types';
import { subDays, isAfter, parseISO } from 'date-fns';

export function calculateTraderScore(trades: Trade[], initialBalance: number, days: number = 30) {
  if (trades.length === 0) return { total: 0, label: 'N/A', factors: { winRate: { score: 0, value: 0 }, discipline: { score: 0, value: 0 }, profitFactor: { score: 0, value: 0 }, overtrading: { score: 0, value: 0 } }, isViolation: false };

  // 1. Check for Critical Violations (Entire History)
  let hasCriticalViolation = false;
  const tradesByDateAll: Record<string, Trade[]> = {};
  
  // Calculate current balance from trades only (for recovery check)
  let tradingBalance = initialBalance;
  
  for (const t of trades) {
    tradingBalance += t.profit_loss;
    
    // Single Trade Loss > 10%
    if (t.profit_loss < 0 && Math.abs(t.profit_loss) > initialBalance * 0.1) {
      hasCriticalViolation = true;
    }
    
    if (!tradesByDateAll[t.date]) tradesByDateAll[t.date] = [];
    tradesByDateAll[t.date].push(t);
  }

  // Daily Loss > 30%
  for (const dayTrades of Object.values(tradesByDateAll)) {
    const dailyPL = dayTrades.reduce((sum, t) => sum + t.profit_loss, 0);
    if (dailyPL < 0 && Math.abs(dailyPL) > initialBalance * 0.3) {
      hasCriticalViolation = true;
    }
  }

  const isUnderViolation = hasCriticalViolation && tradingBalance < initialBalance;

  // 2. Filter trades for the given period (Last 30 days)
  const cutoff = subDays(new Date(), days);
  const recentTrades = trades.filter(t => isAfter(parseISO(t.date), cutoff));
  
  if (recentTrades.length === 0) {
    return { 
      total: isUnderViolation ? 30 : 0, 
      label: isUnderViolation ? 'Poor' : 'N/A', 
      factors: { winRate: { score: 0, value: 0 }, discipline: { score: 0, value: 0 }, profitFactor: { score: 0, value: 0 }, overtrading: { score: 0, value: 0 } },
      isViolation: isUnderViolation
    };
  }

  // Group trades by date to calculate daily penalties
  const tradesByDate: Record<string, Trade[]> = {};
  recentTrades.forEach(t => {
    if (!tradesByDate[t.date]) tradesByDate[t.date] = [];
    tradesByDate[t.date].push(t);
  });

  let totalOvertradingPenalty = 0;
  let totalDisciplinePenalty = 0;
  let totalLossPenalty = 0;
  let totalRulesFollowed = 0;
  let totalWins = 0;

  const daysCount = Object.keys(tradesByDate).length;

  Object.values(tradesByDate).forEach(dayTrades => {
    // Over-trading Penalty (> 3 trades/day: -5 points per extra trade)
    if (dayTrades.length > 3) {
      totalOvertradingPenalty += (dayTrades.length - 3) * 5;
    }

    // Discipline Penalty (Rules broken or > 3 trades/day: -5 points per extra trade)
    const brokenRules = dayTrades.filter(t => !t.rules_followed).length;
    totalDisciplinePenalty += brokenRules * 5;
    if (dayTrades.length > 3) {
      totalDisciplinePenalty += (dayTrades.length - 3) * 5;
    }

    // Loss Penalty (> 2 losses/day: -5 points per extra loss)
    const losses = dayTrades.filter(t => t.profit_loss < 0).length;
    if (losses > 2) {
      totalLossPenalty += (losses - 2) * 5;
    }

    totalRulesFollowed += dayTrades.filter(t => t.rules_followed).length;
    totalWins += dayTrades.filter(t => t.profit_loss > 0).length;
  });

  // Factor 1: Win Ratio (25 points)
  const winRate = (totalWins / recentTrades.length) * 100;
  const winScore = Math.max(0, Math.min(25, (winRate / 60) * 25));

  // Factor 2: Discipline (25 points base - penalties)
  const disciplineScore = Math.max(0, 25 - (totalDisciplinePenalty / daysCount));

  // Factor 3: Over-trading (25 points base - penalties)
  const overtradingScore = Math.max(0, 25 - (totalOvertradingPenalty / daysCount));

  // Factor 4: Profit Factor / Loss Limit (25 points base - penalties)
  const grossProfit = recentTrades.filter(t => t.profit_loss > 0).reduce((sum, t) => sum + t.profit_loss, 0);
  const grossLoss = Math.abs(recentTrades.filter(t => t.profit_loss < 0).reduce((sum, t) => sum + t.profit_loss, 0));
  const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 3 : 1) : grossProfit / grossLoss;
  const basePFScore = Math.min(25, (profitFactor / 2) * 25);
  const pfScore = Math.max(0, basePFScore - (totalLossPenalty / daysCount));

  let total = Math.round(winScore + disciplineScore + overtradingScore + pfScore);
  
  // Apply Critical Violation Cap
  if (isUnderViolation) {
    total = Math.min(total, 35); // Force score to be low
  }

  let label = 'Poor';
  if (total >= 70) label = 'Excellent';
  else if (total >= 60) label = 'Good';

  return {
    total,
    label,
    factors: {
      winRate: { score: Math.round(winScore), value: winRate },
      discipline: { score: Math.round(disciplineScore), value: (totalRulesFollowed / recentTrades.length) * 100 },
      profitFactor: { score: Math.round(pfScore), value: profitFactor },
      overtrading: { score: Math.round(overtradingScore), value: recentTrades.length / daysCount }
    },
    isViolation: isUnderViolation
  };
}

export function calculateScoreForRange(trades: Trade[], initialBalance: number, startDate: string, endDate: string) {
  const rangeTrades = trades.filter(t => t.date >= startDate && t.date <= endDate);
  if (rangeTrades.length === 0) return null;

  // Check for Critical Violations in this range
  let hasCriticalViolation = false;
  const tradesByDateAll: Record<string, Trade[]> = {};
  
  for (const t of rangeTrades) {
    if (t.profit_loss < 0 && Math.abs(t.profit_loss) > initialBalance * 0.1) {
      hasCriticalViolation = true;
    }
    if (!tradesByDateAll[t.date]) tradesByDateAll[t.date] = [];
    tradesByDateAll[t.date].push(t);
  }

  for (const dayTrades of Object.values(tradesByDateAll)) {
    const dailyPL = dayTrades.reduce((sum, t) => sum + t.profit_loss, 0);
    if (dailyPL < 0 && Math.abs(dailyPL) > initialBalance * 0.3) {
      hasCriticalViolation = true;
    }
  }

  // Group trades by date
  const tradesByDate: Record<string, Trade[]> = {};
  rangeTrades.forEach(t => {
    if (!tradesByDate[t.date]) tradesByDate[t.date] = [];
    tradesByDate[t.date].push(t);
  });

  let totalOvertradingPenalty = 0;
  let totalDisciplinePenalty = 0;
  let totalLossPenalty = 0;
  let totalWins = 0;
  const daysCount = Object.keys(tradesByDate).length;

  Object.values(tradesByDate).forEach(dayTrades => {
    if (dayTrades.length > 3) totalOvertradingPenalty += (dayTrades.length - 3) * 5;
    const brokenRules = dayTrades.filter(t => !t.rules_followed).length;
    totalDisciplinePenalty += brokenRules * 5;
    if (dayTrades.length > 3) totalDisciplinePenalty += (dayTrades.length - 3) * 5;
    const losses = dayTrades.filter(t => t.profit_loss < 0).length;
    if (losses > 2) totalLossPenalty += (losses - 2) * 5;
    totalWins += dayTrades.filter(t => t.profit_loss > 0).length;
  });

  const winRate = (totalWins / rangeTrades.length) * 100;
  const winScore = Math.max(0, Math.min(25, (winRate / 60) * 25));
  const disciplineScore = Math.max(0, 25 - (totalDisciplinePenalty / daysCount));
  const overtradingScore = Math.max(0, 25 - (totalOvertradingPenalty / daysCount));
  const grossProfit = rangeTrades.filter(t => t.profit_loss > 0).reduce((sum, t) => sum + t.profit_loss, 0);
  const grossLoss = Math.abs(rangeTrades.filter(t => t.profit_loss < 0).reduce((sum, t) => sum + t.profit_loss, 0));
  const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 3 : 1) : grossProfit / grossLoss;
  const basePFScore = Math.min(25, (profitFactor / 2) * 25);
  const pfScore = Math.max(0, basePFScore - (totalLossPenalty / daysCount));

  let total = Math.round(winScore + disciplineScore + overtradingScore + pfScore);
  if (hasCriticalViolation) {
    total = Math.min(total, 35);
  }
  return total;
}
