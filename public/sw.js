// Caches the application shell so the app keeps loading without a connection.
const CACHE = 'release-checklist-shell-v1';

self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE);
            const response = await fetch('/');
            const html = await response.clone().text();
            await cache.put('/', response);
            const assets = [...html.matchAll(/(?:href|src)="([^"]*\/build\/[^"]+)"/g)].map((m) => m[1]);
            await Promise.all(assets.map((url) => cache.add(url).catch(() => {})));
            await self.skipWaiting();
        })().catch(() => self.skipWaiting()),
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim()),
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
        return;
    }

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE).then((cache) => cache.put('/', copy));
                    }
                    return response;
                })
                .catch(() => caches.match('/')),
        );
        return;
    }

    if (url.pathname.startsWith('/build/')) {
        event.respondWith(
            caches.match(request).then(
                (cached) =>
                    cached ||
                    fetch(request).then((response) => {
                        const copy = response.clone();
                        caches.open(CACHE).then((cache) => cache.put(request, copy));
                        return response;
                    }),
            ),
        );
    }
});
