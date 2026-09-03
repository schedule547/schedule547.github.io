// Service worker «Расписание547».
// При каждом обновлении файла увеличивайте номер версии ниже —
// иначе у пользователей, уже установивших приложение, останется старая версия.
const CACHE_VERSION = 'v1';
const CACHE_NAME = 'raspisanie547-' + CACHE_VERSION;

// Всё, что нужно приложению для работы офлайн: сама страница, манифест,
// иконки и библиотека SheetJS (её отдельно кэшируем по прямой ссылке на CDN,
// т.к. без неё чтение Excel-файлов не работает).
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

// Стратегия «сначала кэш, потом сеть»: приложение открывается мгновенно
// и работает без интернета; если ресурса вдруг нет в кэше — пробуем сеть,
// а при удаче заодно сохраняем ответ на будущее.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
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
