import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import './styles.css';
import { store } from './ui/store';

// handy for demos and debugging: window.__store.state
if (import.meta.env.DEV) (window as unknown as { __store: typeof store }).__store = store;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
