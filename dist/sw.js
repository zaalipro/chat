// ✅ SERVICE WORKER FOR BUNDLE CACHING AND OFFLINE FUNCTIONALITY
const CACHE_NAME = 'chat-widget-v1';
const STATIC_CACHE = 'chat-widget-static-v1';
const DYNAMIC_CACHE = 'chat-widget-dynamic-v1';

// ✅ CRITICAL ASSETS TO CACHE IMMEDIATELY
const CRITICAL_ASSETS = [
  '/',
  '/chat-widget.umd.js',
  '/chat-widget.es.js',
  '/assets/css/main.css',
  '/assets/fonts/font.woff2'
];

// ✅ CACHE STRATEGIES
const CACHE_STRATEGIES = {
  STATIC: 'cacheFirst',
  DYNAMIC: 'networkFirst',
  API: 'networkOnly'
};

// ✅ INSTALL EVENT - CACHE CRITICAL ASSETS
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Service Worker: Caching critical assets');
        return cache.addAll(CRITICAL_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Installation failed:', error);
      })
  );
});

// ✅ ACTIVATE EVENT - CLEANUP OLD CACHES
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Remove old caches
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Service Worker: Removing old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activation complete');
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Activation failed:', error);
      })
  );
});

// ✅ FETCH EVENT - IMPLEMENT CACHING STRATEGIES
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  event.respondWith(handleRequest(request));
});

// ✅ REQUEST HANDLER WITH INTELLIGENT CACHING
async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Strategy 1: Cache First for static assets
    if (isStaticAsset(request.url)) {
      return cacheFirst(request, STATIC_CACHE);
    }

    // Strategy 2: Network First for dynamic content
    if (isDynamicContent(request.url)) {
      return networkFirst(request, DYNAMIC_CACHE);
    }

    // Strategy 3: Network Only for API calls
    if (isApiCall(request.url)) {
      return networkOnly(request);
    }

    // Strategy 4: Stale While Revalidate for HTML
    if (isHtmlRequest(request.url)) {
      return staleWhileRevalidate(request, DYNAMIC_CACHE);
    }

    // Default: Network First
    return networkFirst(request, DYNAMIC_CACHE);
    
  } catch (error) {
    console.error('❌ Service Worker: Request handling failed:', error);
    return getOfflineResponse(request);
  }
}

// ✅ CACHE FIRST STRATEGY
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    console.log('📦 Service Worker: Serving from cache:', request.url);
    
    // Update cache in background
    fetch(request).then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
    }).catch(() => {
      // Ignore network errors for cache-first strategy
    });
    
    return cachedResponse;
  }

  console.log('🌐 Service Worker: Fetching from network:', request.url);
  const networkResponse = await fetch(request);

  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }

  return networkResponse;
}

// ✅ NETWORK FIRST STRATEGY
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    console.log('🌐 Service Worker: Trying network first:', request.url);
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache the successful response
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('📦 Service Worker: Network failed, trying cache:', request.url);
  }

  // Fallback to cache
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Return offline response if nothing in cache
  return getOfflineResponse(request);
}

// ✅ NETWORK ONLY STRATEGY
async function networkOnly(request) {
  console.log('🌐 Service Worker: Network only:', request.url);
  
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.error('❌ Service Worker: Network request failed:', error);
    return getOfflineResponse(request);
  }
}

// ✅ STALE WHILE REVALIDATE STRATEGY
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Always try to update the cache
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    console.log('❌ Service Worker: Background update failed');
  });

  // Return cached version immediately if available
  if (cachedResponse) {
    console.log('📦 Service Worker: Serving stale content:', request.url);
    return cachedResponse;
  }

  // Otherwise wait for network
  return fetchPromise;
}

// ✅ OFFLINE RESPONSE
async function getOfflineResponse(request) {
  const url = new URL(request.url);
  
  // Return offline page for HTML requests
  if (request.headers.get('accept')?.includes('text/html')) {
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Chat Widget - Offline</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0;
              background: #f5f5f5;
              color: #333;
            }
            .offline-container {
              text-align: center;
              padding: 2rem;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              max-width: 400px;
            }
            .offline-icon { font-size: 4rem; margin-bottom: 1rem; }
            .offline-title { font-size: 1.5rem; margin-bottom: 0.5rem; }
            .offline-message { color: #666; margin-bottom: 1.5rem; }
            .retry-button {
              background: #007bff;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 4px;
              cursor: pointer;
              font-size: 1rem;
            }
            .retry-button:hover { background: #0056b3; }
          </style>
        </head>
        <body>
          <div class="offline-container">
            <div class="offline-icon">📱</div>
            <h1 class="offline-title">You're offline</h1>
            <p class="offline-message">The chat widget is currently unavailable. Please check your internet connection and try again.</p>
            <button class="retry-button" onclick="window.location.reload()">Retry</button>
          </div>
        </body>
      </html>
      `,
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }

  // Return empty response for other requests
  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable'
  });
}

// ✅ HELPER FUNCTIONS TO DETERMINE REQUEST TYPE
function isStaticAsset(url) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/i.test(url) ||
         url.includes('/assets/') ||
         url.includes('chat-widget.');
}

function isDynamicContent(url) {
  return url.includes('/api/') || 
         url.includes('/graphql') ||
         url.includes('/ws');
}

function isApiCall(url) {
  return url.includes('/api/') || 
         url.includes('/graphql') ||
         url.includes('/ws');
}

function isHtmlRequest(url) {
  return url.endsWith('/') || 
         url.endsWith('.html') ||
         !url.includes('.');
}

// ✅ BACKGROUND SYNC FOR OFFLINE ACTIONS
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync:', event.tag);
  
  if (event.tag === 'background-sync-messages') {
    event.waitUntil(syncOfflineMessages());
  }
});

// ✅ SYNC OFFLINE MESSAGES
async function syncOfflineMessages() {
  try {
    const offlineMessages = await getOfflineMessages();
    
    for (const message of offlineMessages) {
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        });
        
        if (response.ok) {
          await removeOfflineMessage(message.id);
          console.log('✅ Service Worker: Synced message:', message.id);
        }
      } catch (error) {
        console.error('❌ Service Worker: Failed to sync message:', message.id);
      }
    }
  } catch (error) {
    console.error('❌ Service Worker: Background sync failed:', error);
  }
}

// ✅ PUSH NOTIFICATIONS
self.addEventListener('push', (event) => {
  console.log('📢 Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New message received',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open Chat',
        icon: '/assets/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/assets/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Chat Widget', options)
  );
});

// ✅ NOTIFICATION CLICK HANDLING
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Service Worker: Notification clicked:', event.notification.data);
  
  event.notification.close();

  if (event.action === 'explore') {
    // Focus or open the chat widget
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes('chat') && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// ✅ MESSAGE HANDLING FROM CLIENT
self.addEventListener('message', (event) => {
  console.log('📨 Service Worker: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_UPDATE') {
    updateCache();
  }
});

// ✅ UPDATE CACHE
async function updateCache() {
  try {
    const cache = await caches.open(STATIC_CACHE);
    await cache.addAll(CRITICAL_ASSETS);
    console.log('✅ Service Worker: Cache updated successfully');
  } catch (error) {
    console.error('❌ Service Worker: Cache update failed:', error);
  }
}

// ✅ OFFLINE STORAGE HELPERS
async function getOfflineMessages() {
  // In a real implementation, this would use IndexedDB
  return [];
}

async function removeOfflineMessage(messageId) {
  // In a real implementation, this would use IndexedDB
  console.log('🗑️ Service Worker: Removed offline message:', messageId);
}

// ✅ CACHE CLEANUP
async function cleanupCache() {
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    // Remove old entries (older than 7 days)
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    for (const request of requests) {
      const response = await cache.match(request);
      const dateHeader = response?.headers.get('date');
      
      if (dateHeader) {
        const responseDate = new Date(dateHeader).getTime();
        if (responseDate < sevenDaysAgo) {
          await cache.delete(request);
          console.log('🗑️ Service Worker: Removed old cache entry:', request.url);
        }
      }
    }
  }
}

// ✅ PERIODIC CACHE CLEANUP
setInterval(cleanupCache, 24 * 60 * 60 * 1000); // Clean up daily

console.log('🚀 Service Worker: Loaded and ready');