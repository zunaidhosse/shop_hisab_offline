// ক্যাশের নাম এবং সংস্করণ (v5)
const CACHE_NAME = 'shop-hisab-offline-cache-v5';

// যে ফাইলগুলো ক্যাশ করা হবে (সঠিক রিলেটিভ পাথ সহ)
const URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './app-icon-192.png',
  './app-icon-512.png',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap'
];

// Install event: অ্যাপ শেল ক্যাশ করুন
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        const cachePromises = URLS_TO_CACHE.map(urlToCache => {
            return cache.add(urlToCache).catch(err => {
                console.warn(`Failed to cache ${urlToCache}:`, err);
            });
        });
        return Promise.all(cachePromises);
      })
      .catch(err => {
        console.error('Failed to cache resources during install:', err);
      })
  );
});

// Fetch event: ক্যাশ থেকে ফাইল সার্ভ করুন, না পেলে নেটওয়ার্ক থেকে আনুন
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          (networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              // শুধুমাত্র বেসিক রিকুয়েস্ট ক্যাশ করুন (tailwind/fonts নয়)
            } else if (networkResponse && networkResponse.status === 200) {
               // থার্ড পার্টি রিসোর্স (tailwind, fonts) ক্যাশ করুন
               const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseToCache);
                  });
            }
            return networkResponse;
          }
        ).catch(err => {
            console.error('Fetch failed:', err);
        });
      })
  );
});

// Activate event: পুরোনো ক্যাশ পরিষ্কার করুন
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME]; // v5 ক্যাশ রাখুন
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

