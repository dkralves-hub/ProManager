/* Service worker do Manager — versão 893eaac67a79 (gerada a partir do hash dos arquivos) */
'use strict';
const VERSAO='893eaac67a79';
const CACHE_APP='manager-app-'+VERSAO;
const CACHE_IMG='manager-img-v1';
const MAX_IMG=600;
const PRECACHE=["./", "index.html", "css/app.css", "js/game.js", "js/pwa.js", "manifest.json", "browserconfig.xml", "favicon.ico", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-192.png", "icons/maskable-512.png", "icons/apple-touch-icon.png", "icons/favicon-32.png", "icons/favicon-16.png"];

self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE_APP).then(function(c){
    return Promise.all(PRECACHE.map(function(u){return c.add(new Request(u,{cache:'reload'}))}));
  }).then(function(){return self.skipWaiting()}));
});
self.addEventListener('activate',function(e){
  e.waitUntil((async function(){
    const nomes=await caches.keys();
    await Promise.all(nomes.filter(function(n){return n.indexOf('manager-app-')===0&&n!==CACHE_APP}).map(function(n){return caches.delete(n)}));
    await self.clients.claim();
  })());
});
self.addEventListener('message',function(e){
  if(e.data==='SKIP_WAITING')self.skipWaiting();
  if(e.data==='VERSAO'&&e.source)e.source.postMessage({tipo:'VERSAO',versao:VERSAO});
});
async function limita(cache){
  const ks=await cache.keys();
  if(ks.length>MAX_IMG)await Promise.all(ks.slice(0,ks.length-MAX_IMG).map(function(k){return cache.delete(k)}));
}
async function revalida(nome,req){      // imagens: responde do cache na hora e atualiza em segundo plano
  const cache=await caches.open(nome),hit=await cache.match(req);
  const rede=fetch(req).then(function(r){
    if(r&&(r.ok||r.type==='opaque')){cache.put(req,r.clone()).then(function(){return limita(cache)}).catch(function(){})}
    return r;
  }).catch(function(){return null});
  if(hit){rede.catch(function(){});return hit}
  return (await rede)||new Response('',{status:504,statusText:'Offline'});
}
async function cacheFirst(req){
  const cache=await caches.open(CACHE_APP),hit=await cache.match(req,{ignoreSearch:true});
  if(hit)return hit;
  try{
    const r=await fetch(req);
    if(r&&r.ok&&r.type==='basic')cache.put(req,r.clone());
    return r;
  }catch(err){
    return new Response('',{status:504,statusText:'Offline'});
  }
}
self.addEventListener('fetch',function(e){
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin===self.location.origin){
    if(req.mode==='navigate'){
      e.respondWith(caches.match('index.html').then(function(r){return r||fetch(req).catch(function(){return caches.match('index.html')})}));
      return;
    }
    if(url.pathname.indexOf('/assets/escudos/')!==-1||url.pathname.indexOf('/assets/splash/')!==-1){e.respondWith(revalida(CACHE_IMG,req));return}
    e.respondWith(cacheFirst(req));
    return;
  }
  if(req.destination==='image'&&/(^|\.)(wikimedia|wikipedia)\.org$/.test(url.hostname)){e.respondWith(revalida(CACHE_IMG,req));return}
  /* demais origens (Firebase, gstatic): vão direto para a rede */
});
