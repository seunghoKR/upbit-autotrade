import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// 🧹 브라우저 및 PWA에 잔존하는 모든 구버전 서비스워커 및 캐시 강제 삭제
if (typeof window !== 'undefined') {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (let reg of registrations) {
        reg.unregister();
      }
    });
  }
  if ('caches' in window) {
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
