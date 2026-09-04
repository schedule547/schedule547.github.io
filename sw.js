const CACHE_VERSION = '1.4.2';
const CACHE_NAME = 'raspisanie547-' + CACHE_VERSION;

// Всё, что нужно приложению для работы офлайн: сама страница (как запасной
// вариант на случай отсутствия сети), манифест, иконки и библиотека SheetJS.
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Саму страницу (открытие приложения / обновление вкладки) — сначала сеть.
  // Так правки в парсере доходят до пользователей сразу же, как только у них
  // есть интернет; кэш подключается только если сети нет вообще.
  const isPageRequest = event.request.mode === 'navigate' || event.request.url.endsWith('/index.html');
  if (isPageRequest) {
    event.respondWith(
      fetch(new Request(event.request, { cache: 'no-store' }))
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Всё остальное (библиотека SheetJS, иконки, манифест) меняется редко —
  // для них по-прежнему быстрее и надёжнее «сначала кэш, потом сеть».
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
