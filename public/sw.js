self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Zero-dependency IndexedDB reader for 'keyval-store' -> 'keyval' store (used by idb-keyval)
function getFromIDB(key) {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open('keyval-store');
      request.onerror = () => resolve(null);
      request.onsuccess = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('keyval')) {
          resolve(null);
          return;
        }
        const tx = db.transaction('keyval', 'readonly');
        const store = tx.objectStore('keyval');
        const getReq = store.get(key);
        getReq.onerror = () => resolve(null);
        getReq.onsuccess = () => resolve(getReq.result || null);
      };
    } catch (err) {
      resolve(null);
    }
  });
}

async function handleManifest() {
  try {
    const state = await getFromIDB('mockapp-state');
    const appName = state?.appName?.trim() ? state.appName : 'MockApp Player';
    const shortName = state?.appName?.trim() ? state.appName : 'MockApp';

    let icons = [
      { src: '/icon.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
    ];

    if (state?.appIcon && typeof state.appIcon === 'string' && state.appIcon.startsWith('data:image/')) {
      const mime = state.appIcon.split(';')[0].split(':')[1] || 'image/png';
      icons = [
        { src: '/custom-icon?s=192', sizes: '192x192', type: mime, purpose: 'any maskable' },
        { src: '/custom-icon?s=512', sizes: '512x512', type: mime, purpose: 'any maskable' }
      ];
    }

    const manifest = {
      name: appName,
      short_name: shortName,
      start_url: '/?play=1',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#000000',
      theme_color: '#000000',
      icons: icons
    };

    return new Response(JSON.stringify(manifest), {
      status: 200,
      headers: {
        'Content-Type': 'application/manifest+json; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (err) {
    const fallbackManifest = {
      name: 'MockApp Player',
      short_name: 'MockApp',
      start_url: '/?play=1',
      scope: '/',
      display: 'standalone',
      background_color: '#000000',
      theme_color: '#000000',
      icons: [
        { src: '/icon.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
      ]
    };
    return new Response(JSON.stringify(fallbackManifest), {
      status: 200,
      headers: {
        'Content-Type': 'application/manifest+json; charset=utf-8'
      }
    });
  }
}

async function handleCustomIcon() {
  try {
    const state = await getFromIDB('mockapp-state');
    if (state?.appIcon && typeof state.appIcon === 'string' && state.appIcon.includes(';base64,')) {
      const parts = state.appIcon.split(';base64,');
      const mimeType = parts[0].replace('data:', '') || 'image/png';
      const base64Data = parts[1];
      const binary = atob(base64Data);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new Response(bytes.buffer, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Length': len.toString(),
          'Cache-Control': 'public, max-age=86400'
        }
      });
    }
  } catch (err) {}

  return fetch('/icon.png');
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname === '/manifest.json') {
    event.respondWith(handleManifest());
    return;
  }

  if (url.pathname.startsWith('/custom-icon')) {
    event.respondWith(handleCustomIcon());
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
