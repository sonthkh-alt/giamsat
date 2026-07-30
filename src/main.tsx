import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const goc = document.getElementById('goc');
if (!goc) throw new Error('Không tìm thấy phần tử gốc #goc trong index.html.');

createRoot(goc).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
