
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

  if (event.action === 'view') {
    event.waitUntil(
      self.clients.openWindow('https://plant-patho-pal.lovable.app/')
    );
  } else if (event.action === 'dismiss') {
    // Non fare nulla, la notifica è già chiusa
  } else {
    // Click principale sulla notifica
    event.waitUntil(
      self.clients.openWindow('https://plant-patho-pal.lovable.app/')
    );
  }
});
