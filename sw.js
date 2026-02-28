// GANTI ANGKA VERSI INI SETIAP KALI ANDA MENGUBAH INDEX.HTML
const CACHE_NAME = 'amalpad-skena-v1.46'; 

const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/ui-core.js',
  '/js/player.js',
  '/js/quests.js',
  '/js/charts.js',
  '/js/circle.js',
  '/js/export-card.js',
  // file js/firebase-db.js opsional untuk di cache karena dia modul eksternal (type="module") yang manggil firebase CDN
  '/icon.png',
  '/manifest.json'
];

// 1. Install & Masukkan ke Cache
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting()) // Paksa service worker baru langsung aktif
    );
});

// 2. Activate & BERSIHKAN CACHE LAMA (Ini kunci agar tidak nyangkut/berat)
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Jika nama cache tidak sama dengan versi terbaru, HAPUS!
                    if (cacheName !== CACHE_NAME) {
                        console.log('Menghapus cache lama:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Langsung ambil alih halaman
    );
});

// 3. Fetch Strategy: Network First (Utamakan Internet, baru Cache)
self.addEventListener('fetch', event => {
    // Abaikan request dari ekstensi chrome atau CDN eksternal yang berat
    if (!(event.request.url.indexOf('http') === 0)) return;

    event.respondWith(
        fetch(event.request).catch(() => {
            // Jika tidak ada internet, ambil dari Cache
            return caches.match(event.request);
        })
    );
});













































