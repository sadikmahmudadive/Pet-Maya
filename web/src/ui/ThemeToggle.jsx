import { useTheme } from '../context/ThemeContext.jsx';
import Icon from './Icon.jsx';
import { cx } from '../lib/format.js';

export default function ThemeToggle({ mode = 'button', className }) {
  const { theme, resolvedTheme, isDark, setTheme, toggleTheme } = useTheme();

  if (mode === 'segmented') {
    return (
      <div className={cx('segmented-theme', className)} style={{ display: 'inline-flex', background: 'var(--sunk-2)', padding: 3, borderRadius: 999, gap: 2 }}>
        {[
          { key: 'light', label: 'Light', icon: 'sun' },
          { key: 'dark', label: 'Dark', icon: 'moon' },
          { key: 'system', label: 'Auto', icon: 'laptop' },
        ].map((opt) => {
          const active = theme === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setTheme(opt.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: active ? 600 : 500,
                background: active ? 'var(--surface)' : 'transparent',
                color: active ? 'var(--ink)' : 'var(--muted)',
                boxShadow: active ? 'var(--shadow-sm)' : 'none',
                border: 0,
                cursor: 'pointer',
                transition: 'all .15s ease',
              }}
              title={`${opt.label} mode`}
            >
              <Icon name={opt.icon} size={14} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={cx('btn btn-ghost btn-square theme-toggle-btn', className)}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <Icon
        name={isDark ? 'sun' : 'moon'}
        size={18}
        style={{
          transition: 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      />
    </button>
  );
}
