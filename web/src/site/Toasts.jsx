import { useStore } from '../lib/store.jsx';
import { Icon } from '../ui/index.jsx';

export default function Toasts() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <span className="well"><Icon name={t.tone === 'error' ? 'alert' : 'check'} size={14} stroke={2.4} /></span>
          <span style={{ paddingRight: 6 }}>{t.message}</span>
          {t.undo && <button onClick={() => { t.undo(); dismissToast(t.id); }}>Undo</button>}
        </div>
      ))}
    </div>
  );
}
