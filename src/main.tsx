import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { applyThemeColor, getInitialThemeColor, applyHeaderColor, getInitialHeaderColor } from './utils/themeColors';

// Apply stored theme and header colors before render to prevent color flashing
applyThemeColor(getInitialThemeColor());
applyHeaderColor(getInitialHeaderColor());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
