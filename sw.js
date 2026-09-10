/* sw.js — service worker da ILB.
 *
 * Rede primeiro, cache depois. O site muda toda semana (OA novo, versao nova):
 * servir do cache por padrao entregaria material velho ao estudante, que e o
 * pior defeito possivel aqui. O cache existe so para o aparelho sem internet
 * — no onibus, no corredor, na area morta do pavilhao.
 *
 * Gerado por _scripts/gerar_instalar_ilb.py — nao editar a mao.
 */
var CACHE = 'ilb-oa-v1';

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(['./', './manifest.webmanifest',
                     './_icones/app-site-192.png', './_icones/app-site-512.png']);
  }).catch(function () { /* sem rede na instalacao: segue sem cache */ }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (nomes) {
    return Promise.all(nomes.filter(function (n) { return n !== CACHE; })
                            .map(function (n) { return caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') { return; }
  e.respondWith(
    fetch(e.request).then(function (resp) {
      var copia = resp.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copia); });
      return resp;
    }).catch(function () {
      return caches.match(e.request).then(function (r) {
        return r || caches.match('./');
      });
    })
  );
});
