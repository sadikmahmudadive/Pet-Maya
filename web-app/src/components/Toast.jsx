import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function Toast() {
  const { toasts } = useApp();

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className="toast-box">
          {t.type === 'success' && <CheckCircle2 size={18} color="#4ade80" />}
          {t.type === 'error' && <AlertCircle size={18} color="#f87171" />}
          {t.type === 'info' && <Info size={18} color="#60a5fa" />}
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
