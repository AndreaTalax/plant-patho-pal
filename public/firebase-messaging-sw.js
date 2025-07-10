// Firebase Cloud Messaging Service Worker

// Import Firebase scripts in service worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBvZZ4z_YtXKjT3Q3oKFqHQVZJ-6XKbQeM",
  authDomain: "plant-patho-pal.firebaseapp.com",
  projectId: "plant-patho-pal",
  storageBucket: "plant-patho-pal.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789012345678"
};

// Initialize Firebase in service worker
firebase.initializeApp(firebaseConfig);

// Initialize messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('📱 Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'Nuovo messaggio';
  const notificationOptions = {
    body: payload.notification?.body || 'Hai ricevuto un nuovo messaggio',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: payload.data?.type || 'chat-message',
    data: payload.data,
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'Visualizza'
      },
      {
        action: 'dismiss', 
        title: 'Ignora'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event);

  event.notification.close();

  if (event.action === 'view') {
    // Open the app or navigate to specific page
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              data: event.notification.data
            });
            return;
          }
        }
        
        // Open new window if app is not open
        return clients.openWindow(urlToOpen);
      })
    );
  }
});

// Handle push event
self.addEventListener('push', (event) => {
  console.log('📬 Push event received:', event);

  if (event.data) {
    const data = event.data.json();
    const title = data.notification?.title || 'Plant Patho Pal';
    const options = {
      body: data.notification?.body || 'Nuovo messaggio',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: data.data || {},
      tag: data.data?.type || 'default'
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});