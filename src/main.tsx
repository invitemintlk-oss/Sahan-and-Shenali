import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import AdminPage from './AdminPage.tsx';
import { readGuestFromLocation } from './guest.ts';
import './index.css';

const path = window.location.pathname.replace(/\/+$/, '').toLowerCase();
const isAdmin = path === '/admin';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdmin ? <AdminPage /> : <App guestName={readGuestFromLocation()} />}
  </StrictMode>,
);
