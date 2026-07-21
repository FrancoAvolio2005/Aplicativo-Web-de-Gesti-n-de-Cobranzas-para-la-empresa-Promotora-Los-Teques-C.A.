import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Aplicar modo oscuro antes de renderizar para evitar flash
if (localStorage.theme === 'dark' ||
  (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
