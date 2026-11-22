import { useCallback, useEffect, useState } from 'react';
import { useGame } from './hooks';
import { BottomPanelsRow } from './BottomRow';
import { TopBar } from './components/TopBar';
import { Ticker } from './components/Ticker';
import { CheckpointBanner } from './components/CheckpointBanner';
import { WorldPanel } from './components/WorldPanel';
import { MarketsPanel } from './components/MarketsPanel';
import { ChartPanel } from './components/ChartPanel';
import { TradePanel } from './components/TradePanel';
import { Toasts } from './components/Toasts';
import { TitleScreen } from './components/TitleScreen';
import { Cutscene } from './components/Cutscene';
import { EndScreen } from './components/EndScreen';
import { store } from './store';
import { Icon } from './components/icons';

export function App() {
  const g = useGame();
  const [theme, setTheme] = useState(() => localStorage.getItem('tradeinc.theme') ?? 'dark');
  const [asset, setAsset] = useState('MOO');
  const [story, setStory] = useState<number | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('tradeinc.theme', theme);
  }, [theme]);

  const focusNews = useCallback((id: number) => {
    setStory(id);
    store.read(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const status = store.state?.status;
      if (e.code !== 'Space' || e.altKey || e.ctrlKey || e.metaKey) return;
      if (store.phase !== 'game' || (status !== 'running' && status !== 'paused')) return;

      // Consume Space before it can activate a focused trade control.
      e.preventDefault();
      e.stopPropagation();
      if (!e.repeat) store.togglePause();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  const s = g.state;
  if (g.phase === 'title' || !s) return <TitleScreen />;
  if (g.phase === 'cutscene') return <Cutscene />;
  const ended = s.status === 'won' || s.status === 'lost';

  return (
    <div className="app">
      <TopBar theme={theme} onTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
      <Ticker />
      <CheckpointBanner />
      {s.status === 'paused' && (
        <div className="pause-banner" role="status">
          <span><Icon name="pause" /> Game paused. Trading is disabled. You can still read news and inspect charts.</span>
          <button className="btn primary" onClick={() => store.togglePause()}><Icon name="play" /> Resume</button>
        </div>
      )}
      <main className="grid">
        <WorldPanel selectedId={story} onSelect={setStory} onAsset={setAsset} />
        <MarketsPanel selected={asset} onSelect={setAsset} />
        <ChartPanel assetId={asset} />
        <TradePanel assetId={asset} />
      </main>
      <BottomPanelsRow onNews={focusNews} />
      <Toasts onNews={focusNews} />
      {ended && <EndScreen />}
    </div>
  );
}
