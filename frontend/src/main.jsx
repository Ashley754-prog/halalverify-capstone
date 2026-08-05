import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('HalalVerify Service Worker registered successfully:', reg.scope))
        .catch((err) => console.error('Service Worker registration failed:', err));
    } else {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => registrations.forEach((registration) => registration.unregister()))
        .catch((err) => console.error('Service Worker unregister failed:', err));

      if ('caches' in window) {
        caches.keys()
          .then((keys) => keys.forEach((key) => caches.delete(key)))
          .catch((err) => console.error('Cache cleanup failed:', err));
      }
    }
  });
}
