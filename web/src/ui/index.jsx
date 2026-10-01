import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon.jsx';
import { Link } from '../lib/router.jsx';
import { cx, initials } from '../lib/format.js';

export { Icon };

export function Button({ variant = 'dark', size, icon, iconRight, block, to, className, children, ...rest }) {
  const cls = cx('btn', `btn-${variant}`, size && `btn-${size}`, block && 'btn-block', !children && 'btn-square', className);
  const inner = (
    <>
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 14 : 16} />}
    </>
  );
  if (to) return <Link to={to} className={cls} {...rest}>{inner}</Link>;
  return <button type="button" className={cls} {...rest}>{inner}</button>;
}

export function Pill({ tone, icon, mono, sm, className, children, ...rest }) {
  return (
    <span className={cx('pill', tone, mono && 'mono', sm && 'sm', className)} {...rest}>
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  );
}

export function Well({ icon, tone, size, round, className, iconSize }) {
  return (
    <span className={cx('well', tone, size, round && 'round', className)}>
      <Icon name={icon} size={iconSize || (size === 'sm' ? 15 : size === 'lg' ? 22 : 18)} />
    </span>
  );
}

export function Avatar({ name, src, tone, size, className }) {
  return (
    <span className={cx('avatar', tone, size, className)} aria-hidden="true">
      {src ? <img src={src} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : initials(name)}
    </span>
  );
}

/** Striped image placeholder; shows the real image when `src` is set. */
export function Ph({ label, src, tone, style, className, children }) {
  return (
    <div className={cx('ph', tone, className)} style={style}>
      {src ? <img src={src} alt={label || ''} loading="lazy" onError={(e) => { e.currentTarget.remove(); }} /> : <span>[{label || ' '}]</span>}
      {children}
    </div>
  );
}

export function Stat({ label, value, icon, delta, deltaTone = 'teal', note }) {
  return (
    <div className="card stat">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        {icon && <Well icon={icon} size="sm" round iconSize={14} />}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-foot">
        {delta != null && <Pill tone={deltaTone} sm>{delta}</Pill>}
        {note && <span>{note}</span>}
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!checked}
      aria-label={label}
      className="toggle"
      onClick={() => onChange?.(!checked)}
    />
  );
}

export function Tabs({ items, value, onChange, className }) {
  return (
    <div className={cx('tabs', className)} role="tablist">
      {items.map((it) => (
        <button
          key={it.value}
          role="tab"
          aria-selected={value === it.value}
          className={cx('tab', value === it.value && 'active')}
          onClick={() => onChange(it.value)}
        >
          {it.label}
          {it.count != null && <span className="count">{it.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, hint, className, children, ...input }) {
  return (
    <label className={cx('field', className)}>
      {label && <span className="label">{label}{hint && <span className="subtle" style={{ fontWeight: 400 }}> · {hint}</span>}</span>}
      {children || <input className="input" {...input} />}
    </label>
  );
}

export function Stars({ value = 5, size = 13 }) {
  return (
    <span className="row gap-4" style={{ color: '#E0A526' }} aria-label={`${value} out of 5`}>
      <Icon name="star" size={size} style={{ fill: 'currentColor' }} stroke={1} />
      <b style={{ color: 'var(--ink)', fontSize: 13 }}>{Number(value).toFixed(1)}</b>
    </span>
  );
}

export function StarRow({ n = 5, size = 13 }) {
  return (
    <span className="row" style={{ color: '#E0A526', gap: 2 }} aria-label={`${n} stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon key={i} name="star" size={size} stroke={1} style={{ fill: i < n ? 'currentColor' : 'none' }} />
      ))}
    </span>
  );
}

export function Empty({ icon = 'paw', title, children }) {
  return (
    <div className="empty">
      <Well icon={icon} size="lg" round />
      <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{title}</div>
      {children && <div className="sub" style={{ marginTop: 4 }}>{children}</div>}
    </div>
  );
}

export function Segmented({ items, value, onChange }) {
  return (
    <div className="row gap-4" style={{ background: 'var(--sunk)', borderRadius: 999, padding: 4 }}>
      {items.map((it) => (
        <button
          key={it.value}
          className={cx('tab', value === it.value && 'active')}
          style={{ height: 32, flex: 1, justifyContent: 'center', background: value === it.value ? 'var(--surface)' : undefined, color: 'var(--ink)', boxShadow: value === it.value ? 'var(--shadow-sm)' : undefined }}
          onClick={() => onChange(it.value)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

/** Renders overlays at document.body so no ancestor stacking context can trap them. */
export function Portal({ children }) {
  const [host] = useState(() => (typeof document === 'undefined' ? null : document.createElement('div')));
  useEffect(() => {
    if (!host) return undefined;
    host.className = 'pm-portal';
    document.body.appendChild(host);
    return () => { document.body.removeChild(host); };
  }, [host]);
  if (!host) return null;
  return createPortal(children, host);
}
