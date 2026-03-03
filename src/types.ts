export interface Trade {
  id: number;
  date: string;
  asset: string;
  entry_price: number | null;
  exit_price: number | null;
  profit_loss: number;
  day_total: number | null;
  rules_followed: number;
  notes_good: string | null;
  notes_bad: string | null;
  created_at: string;
}

export interface Withdrawal {
  id: number;
  date: string;
  amount: number;
  notes: string | null;
  created_at: string;
}

export interface Settings {
  initial_balance: string;
}

export type View = 'dashboard' | 'journal' | 'calculator' | 'history' | 'withdrawals';
