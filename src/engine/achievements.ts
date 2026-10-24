import type { RunState } from './types';
import { totalWealth } from './accounting';

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  /** Icon name from src/ui/components/icons.tsx */
  icon: string;
  check: (s: RunState) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_trade', title: 'Paper Hands Debut', description: 'Place your first order.', icon: 'swap', check: (s) => s.trades.length > 0 },
  { id: 'fifty_k', title: 'Pocket Rocket', description: 'Reach $50,000 total wealth.', icon: 'rocket', check: (s) => totalWealth(s) >= 5_000_000 },
  { id: 'six_figures', title: 'Six Figures, Zero Regrets', description: 'Reach $100,000 total wealth.', icon: 'coins', check: (s) => totalWealth(s) >= 10_000_000 },
  { id: 'quarter_mil', title: 'Chad Who?', description: 'Reach $250,000 total wealth.', icon: 'sunglasses', check: (s) => totalWealth(s) >= 25_000_000 },
  { id: 'bear_hug', title: 'Bear Hug', description: 'Close a short for a profit of $1,000 or more.', icon: 'bear', check: (s) => (s.flags.bestShortCents ?? 0) >= 100_000 },
  { id: 'dip_buyer', title: 'Bought the Dip (On Purpose)', description: 'Buy an asset in the middle of a near-collapse.', icon: 'bandage', check: (s) => (s.flags.boughtCollapse ?? 0) > 0 },
  { id: 'margin_call', title: 'Mom Called About the Margin', description: 'Get a short liquidated.', icon: 'phone', check: (s) => (s.flags.liquidations ?? 0) > 0 },
  { id: 'parent_approved', title: 'Parent-Approved', description: 'Pass three survival checkpoints.', icon: 'check', check: (s) => s.checkpointResults.filter((c) => c.passed).length >= 3 },
  {
    id: 'diversified',
    title: 'Diversified (Barely)',
    description: 'Hold positions in four different asset classes at once.',
    icon: 'basket',
    check: (s) => {
      const cats = new Set<string>();
      for (const id of [...Object.keys(s.longs), ...Object.keys(s.shorts)]) cats.add(s.flags['cat_' + id] ? String(s.flags['cat_' + id]) : id);
      return cats.size >= 4;
    },
  },
  { id: 'diamond', title: 'Diamond Hands', description: 'Sell a position for at least double what you paid.', icon: 'diamond', check: (s) => (s.flags.diamond ?? 0) > 0 },
];
