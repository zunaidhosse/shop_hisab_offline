// ক্যাশের নাম এবং সংস্করণ (v2 তে আপগ্রেড করা হয়েছে)
const CACHE_NAME = 'shop-hisab-offline-cache-v2';

// QR কোড URL
const QR_CODE_URL = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://zunaidhosse.github.io/shop_hisab_offline/';

// যে ফাইলগুলো ক্যাশ করা হবে
const URLS_TO_CACHE = [
  './', // রুট পাথ (GitHub Pages এর জন্য)
  './index.html',
  './manifest.json',
  './app-icon-192.png',
  './app-icon-512.png',
  QR_CODE_URL, // QR কোড ইমেজ ক্যাশ করুন
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap'
];

// Install event: অ্যাপ শেল ক্যাশ করুন
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        // network error হলে addAll() ফেইল হতে পারে, তাই individually cache করি
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
        // যদি ক্যাশে পাওয়া যায়, তবে সেটা রিটার্ন করুন
        if (response) {
          return response;
        }

        // ক্যাশে না পেলে, নেটওয়ার্ক থেকে fetch করুন
        return fetch(event.request).then(
          (networkResponse) => {
            // যদি সফলভাবে fetch হয়, তবে সেটিকে ক্যাশে সেভ করুন এবং রিটার্ন করুন
            if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
              // শুধুমাত্র GET রিকুয়েস্ট এবং http/https URL ক্যাশ করুন
              if (!event.request.url.startsWith('chrome-extension://')) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseToCache);
                  });
              }
            }
            return networkResponse;
          }
        ).catch(err => {
            console.error('Fetch failed; returning offline page instead.', err);
            // ভবিষ্যতে এখানে একটি কাস্টম অফলাইন পেজ দেখানো যেতে পারে
        });
      })
  );
});

// Activate event: পুরোনো ক্যাশ পরিষ্কার করুন
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME]; // v2 ক্যাশ রাখুন
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // যদি নতুন cacheWhitelist-এ না থাকে, তবে পুরোনো ক্যাশ ডিলিট করুন
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

