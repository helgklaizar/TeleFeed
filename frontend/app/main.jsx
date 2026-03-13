import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "../shared/ui/ErrorBoundary";

// Инициализируем CSS-переменные до первого рендера (предотвращает FOUC)
try {
  const scale = Number(localStorage.getItem('tg_text_scale')) || 1.0;
  document.documentElement.style.setProperty('--text-scale', scale);
  const theme = localStorage.getItem('tg_theme');
  if (theme && theme !== 'blue') {
    document.documentElement.classList.add(`theme-${theme}`);
  }
} catch { /* localStorage может быть недоступен */ }


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
