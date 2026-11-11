// Service Worker - Relógio Kongo (100% Funcional Offline)
// Baseado no conhecimento do N'tothila TadiDiambuisu Evô TadiDiantedimisi
// Desenvolvido por Príncipe Muinda Na'Yah com ajuda da OpenAi é do Gemini

const CACHE_NAME = 'relogio-kongo-v6-dikenga';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  './icon-192.png',
  './icon-512.png',
  './widget/kongo_widget_info.xml',
  './widget/kongo_widget_layout.xml'
];

// Instalação do Service Worker: guarda em cache o index.html e recursos essenciais
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      const cachePromises = CORE_ASSETS.map(async url => {
        try {
          const response = await fetch(url);
          if (response && response.ok) {
            await cache.put(url, response);
          }
        } catch (err) {
          console.warn('[SW] Falha ao pré-carregar recurso:', url, err);
        }
      });
      await Promise.allSettled(cachePromises);
    })
  );
});

// Ativação do Service Worker: limpa caches antigas imediatamente e assume o controlo
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Interceção de pedidos de rede (Fetch): Network-First com Fallback Offline Imediato
self.addEventListener('fetch', event => {
  const request = event.request;

  // Apenas interceptar pedidos HTTP(S) do método GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 1. Pedidos de Navegação (HTML da aplicação): Network-First para garantir atualizações imediatas
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          // Offline fallback garantido: entrega o index.html guardado em cache
          const cachedIndex =
            (await caches.match('./index.html')) ||
            (await caches.match('/index.html')) ||
            (await caches.match('./')) ||
            (await caches.match('/'));
          if (cachedIndex) return cachedIndex;
          return new Response('Relógio Kongo Offline', {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        })
    );
    return;
  }

  // 2. Pedidos de Recursos (scripts, estilos, ícones): Network-First com Fallback para Cache
  event.respondWith(
    fetch(request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Se a rede falhar (modo 100% offline), devolve imediatamente da cache
        const cached = await caches.match(request);
        if (cached) return cached;

        // Se for imagem, tenta devolver o ícone guardado
        if (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico)$/i)) {
          const fallbackIcon = await caches.match('./icon.png');
          if (fallbackIcon) return fallbackIcon;
        }

        return new Response('Recurso offline', { status: 503 });
      })
  );
});

// Ação de clique na Notificação
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./index.html');
      }
    })
  );
});
