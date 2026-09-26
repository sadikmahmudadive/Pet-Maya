// Pet Maya Web Push & Notification Service Worker
const CACHE_NAME = 'petmaya-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Native Push Event Listener (Web Push / FCM)
self.addEventListener('push', (event) => {
  let data = {
    title: 'Pet Maya Alert',
    body: 'You have a new update from Pet Maya.',
    icon: '/favicon-96x96.png',
    badge: '/favicon-48x48.png',
    tag: 'petmaya-notification',
    url: '/'
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (_) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/favicon-96x96.png',
    badge: data.badge || '/favicon-48x48.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      timestamp: Date.now()
    },
    tag: data.tag || 'petmaya-general',
    renotify: true,
    actions: data.actions || [
      { action: 'open', title: 'Open Pet Maya' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click Handler - Focuses or opens the application
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window open with this URL
      for (let client of windowClients) {
        if ('focus' in client) {
          if (client.url.includes(self.location.origin)) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Direct Message Handler from client window
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, {
      icon: '/favicon-96x96.png',
      badge: '/favicon-48x48.png',
      vibrate: [100, 50, 100],
      ...options
    });
  }
});
