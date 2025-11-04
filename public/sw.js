
// Service Worker per gestire le notifiche push
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installato');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker attivato');
  event.waitUntil(self.clients.claim());
});

// Gestisce le notifiche push ricevute
self.addEventListener('push', (event) => {
  console.log('📨 Notifica push ricevuta:', event);

  if (!event.data) {
    return;
  }

  const data = event.data.json();
  console.log('📋 Dati notifica:', data);

  const options = {
    body: data.body || 'Nuovo messaggio ricevuto',
    icon: data.icon || '/lovable-uploads/72d5a60c-404a-4167-9430-511af91c523b.png',
    badge: '/lovable-uploads/72d5a60c-404a-4167-9430-511af91c523b.png',
    tag: data.tag || 'dr-plant-message',
    data: data.data || {},
    actions: [
      {
        action: 'view',
        title: 'Visualizza',
        icon: '/lovable-uploads/72d5a60c-404a-4167-9430-511af91c523b.png'
      },
      {
        action: 'dismiss',
        title: 'Ignora'
      }
    ],
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Dr.Plant', options)
  );
});

// Gestisce i click sulle notifiche
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Click su notifica:', event);

  event.notification.close();

  const notificationData = event.notification.data || {};
  const urlToOpen = notificationData.url || 'https://drplant.lovable.app/';

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(urlToOpen).then((windowClient) => {
        // Invia messaggio al client per notificare il click
        if (windowClient) {
          windowClient.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: notificationData
          });
        }
      })
    );
  } else if (event.action === 'dismiss') {
    // Non fare nulla, la notifica è già chiusa
    console.log('🚫 Notifica ignorata');
  } else {
    // Click principale sulla notifica - apri URL e invia messaggio
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Cerca una finestra già aperta
        for (const client of clientList) {
          if (client.url.includes(new URL(urlToOpen).origin) && 'focus' in client) {
            client.focus();
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              data: notificationData
            });
            return;
          }
        }
        // Se non c'è una finestra aperta, aprila
        return clients.openWindow(urlToOpen).then((windowClient) => {
          if (windowClient) {
            windowClient.postMessage({
              type: 'NOTIFICATION_CLICKED',
              data: notificationData
            });
          }
        });
      })
    );
  }
});
