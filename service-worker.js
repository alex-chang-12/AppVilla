// 1. Define Cache Name and Assets to Cache
const CACHE_NAME = 'appvilla-cache-v1';

// List of files to cache on installation (your core application shell)
const urlsToCache = [
  '/',
  '/index.html',
  '/styles/main.css', // Example: adjust this path
  '/scripts/app.js',  // Example: adjust this path
  '/icons/icon-192x192.png', // Main PWA icon
  // Add other critical static assets (logo, fonts, etc.)
];

// ----------------------------------------------------
// 2. Install Event: Caching the Application Shell
// ----------------------------------------------------

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // Perform install steps and wait until the cache is populated
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching App Shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Forces the new Service Worker to activate immediately
  );
});

// ----------------------------------------------------
// 3. Activate Event: Cleaning up Old Caches
// ----------------------------------------------------

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  // Delete outdated caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ----------------------------------------------------
// 4. Fetch Event: Cache-First Strategy for Offline
// ----------------------------------------------------

self.addEventListener('fetch', (event) => {
  // Check if it's a request we should try to cache/serve from cache
  if (event.request.method === 'GET') {
    event.respondWith(
      // Try to find a response in the cache first
      caches.match(event.request)
        .then((response) => {
          // Cache hit - return the response
          if (response) {
            return response;
          }
          // Cache miss - fetch from the network
          return fetch(event.request);
        })
        .catch(() => {
          // Fallback response for offline users if fetch fails entirely
          // e.g., return an offline page
          return caches.match('/offline.html'); 
        })
    );
  }
});

// ----------------------------------------------------
// 5. Sync Event: Background Sync Stub
// ----------------------------------------------------

self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync event fired:', event.tag);
  
  if (event.tag === 'sync-new-order') {
    // This is where you would call a function to re-attempt the API call
    // for a user action (e.g., placing an order) that failed while offline.
    event.waitUntil(
      // Example placeholder function (you must define this logic elsewhere)
      attemptOfflineOrderSync()
        .then(() => console.log('Sync successful for new order'))
        .catch((err) => console.error('Sync failed:', err))
    );
  }
});

// NOTE: You must define the attemptOfflineOrderSync function in your main app.js 
// or another script and use IndexedDB to store the failed request data.

// ----------------------------------------------------
// 6. Push Event: Receiving Push Notifications
// ----------------------------------------------------

self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received!');

  // Default payload if push data is empty
  const defaultTitle = 'AppVilla Update';
  const defaultBody = 'New content is available!';

  // Get data sent from the push server (if available)
  const data = event.data ? event.data.json() : { title: defaultTitle, body: defaultBody };
  
  const title = data.title || defaultTitle;
  const options = {
    body: data.body || defaultBody,
    icon: '/icons/icon-192x192.png', // Use your main PWA icon
    badge: '/icons/badge-72x72.png', // Optional: badge icon for some OSes
    vibrate: [200, 100, 200],
    tag: 'appvilla-notification-tag', // Groups related notifications
    data: {
      url: data.url || '/' // URL to open when the notification is clicked
    }
  };

  // Display the notification and wait for it to complete
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ----------------------------------------------------
// 7. Notification Click Event
// ----------------------------------------------------

self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked!');
  event.notification.close(); // Close the notification banner

  const clickData = event.notification.data;

  // This opens a new window or focuses an existing one on the specified URL
  event.waitUntil(
    clients.openWindow(clickData.url || '/')
  );
});