import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Registo do Service Worker para suporte 100% Offline e PWA a partir da memória do telemóvel
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js', { scope: './' })
      .then(reg => {
        console.log('[Relógio Kongo] Service Worker registado:', reg.scope);
      })
      .catch(() => {
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
