import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppComposition } from './app/app-composition';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppComposition />
  </StrictMode>,
);
