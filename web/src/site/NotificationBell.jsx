import { useEffect, useState } from 'react';
import { Link } from '../lib/router.jsx';
import { useStore } from '../lib/store.jsx';
import { useNotifications } from '../data/hooks.js';
import { markNotificationRead, markAllNotificationsRead } from '../data/actions.js';
import { useBump, useLockBody } from '../lib/motion.jsx';
import { Icon, Button, Empty, Portal } from '../ui/index.jsx';
import { ago, cx } from '../lib/format.js';

const ICON = { order: 'bag', rx: 'file', appointment: 'calendar', gps: 'target', community: 'users', system: 'bell' };
const TONE = { order: 'teal', rx: 'yellow', appointment: 'teal', gps: 'red', community: '', system: '' };

export default function NotificationBell() {
  const { user } = useStore();
  const { items, unread } = useNotifications(user);
  const [open, setOpen] = useState(false);
  const bump = useBump(unread);
  useLockBody(open);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!user) return null;

  return (
    <>
      <button
        className="btn btn-ghost btn-square notif-btn"
        onClick={() => setOpen(true)}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
      >
        <Icon name="bell" />
        {unread > 0 && <span className={cx('notif-dot', bump && 'bump')}>{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <Portal>
          <div className="scrim" onClick={() => setOpen(false)} />
          <aside className="drawer notif-drawer" role="dialog" aria-modal="true" aria-label="Notifications">
            <div className="drawer-head">
              <div>
                <h2 className="display-3">Notifications</h2>
                <div className="sub" style={{ fontSize: 14, marginTop: 4 }}>{unread ? `${unread} unread` : 'You’re all caught up'}</div>
              </div>
              <button className="btn btn-outline btn-square" onClick={() => setOpen(false)} aria-label="Close"><Icon name="x" /></button>
            </div>

            <div className="drawer-body">
              {items.length === 0 ? (
                <Empty icon="bell" title="Nothing yet">Order updates, prescription approvals and vet reminders will appear here.</Empty>
              ) : items.map((n) => {
                const Row = n.url ? Link : 'div';
                return (
                  <Row
                    key={n.id}
                    {...(n.url ? { to: n.url } : {})}
                    className={cx('notif-row slide-in', !n.read && 'unread')}
                    onClick={() => { if (!n.read) markNotificationRead(user, n.id); if (n.url) setOpen(false); }}
                  >
                    <span className={cx('well round', TONE[n.category])}><Icon name={ICON[n.category] || 'bell'} size={16} /></span>
                    <div className="grow">
                      <div className="row between gap-8">
                        <b style={{ fontSize: 14 }}>{n.title}</b>
                        <span className="sub" style={{ fontSize: 11, flex: 'none' }}>{ago(n.time)}</span>
                      </div>
                      <p className="muted" style={{ fontSize: 13, marginTop: 3 }}>{n.body}</p>
                    </div>
                    {!n.read && <span className="dot" style={{ marginTop: 6 }} />}
                  </Row>
                );
              })}
            </div>

            {unread > 0 && (
              <div className="drawer-foot">
                <Button variant="soft" block icon="check" onClick={() => markAllNotificationsRead(user, items.filter((n) => !n.read).map((n) => n.id))}>
                  Mark all as read
                </Button>
              </div>
            )}
          </aside>
        </Portal>
      )}
    </>
  );
}
