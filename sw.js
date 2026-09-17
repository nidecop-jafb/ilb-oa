/* sw.js — service worker da ILB.
 *
 * Rede primeiro, cache depois. O site muda toda semana (OA novo, versao nova):
 * servir do cache por padrao entregaria material velho ao estudante, que e o
 * pior defeito possivel aqui. O cache existe so para o aparelho sem internet
 * — no onibus, no corredor, na area morta do pavilhao.
 *
 * Gerado por _scripts/gerar_instalar_ilb.py — nao editar a mao.
 */
var CACHE = 'ilb-oa-v2';  // v2: corrige fetch que caia no cache do navegador (ver 'fetch' abaixo)

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
  // O GitHub Pages manda Cache-Control: max-age=600 no HTML: um fetch()
  // "normal" dentro dos 10 min devolve a copia do CACHE DO NAVEGADOR, sem
  // nunca chegar na rede — quebrando a promessa acima ("nunca serve pagina
  // velha"). Descoberto 2026-09-16 com o app instalado mostrando o site de
  // antes do ultimo push. Corrige-se com um parametro de URL sempre novo:
  // o navegador so tem cache por URL exata, entao isso forca ida a rede.
  var furar = e.request.url + (e.request.url.indexOf('?') < 0 ? '?' : '&') + '_sw=' + Date.now();
  e.respondWith(
    fetch(furar, { cache: 'no-store' }).then(function (resp) {
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
