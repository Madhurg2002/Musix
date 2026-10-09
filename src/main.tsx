import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './tailwind.css';
import './style.css';
import { applyTheme, readTheme } from './utils/theme';

// Apply the saved theme before the first paint so the page never flashes the default palette.
applyTheme(readTheme());

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
