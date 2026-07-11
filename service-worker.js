const CACHE_NAME = "family-iraq-v1";

const urlsToCache = [

"./",
"./index.html",
"./product.html",

"./css/style.css",
"./css/product.css",
"./css/admin.css",

"./js/app.js",
"./js/admin.js",

"./manifest.json"

];

// التثبيت

self.addEventListener("install", event => {

event.waitUntil(

caches.open(CACHE_NAME)

.then(cache => {

return cache.addAll(urlsToCache);

})

);

self.skipWaiting();

});

// التفعيل

self.addEventListener("activate", event => {

event.waitUntil(

caches.keys().then(cacheNames => {

return Promise.all(

cacheNames.map(cache => {

if(cache !== CACHE_NAME){

return caches.delete(cache);

}

})

);

})

);

self.clients.claim();

});

// جلب الملفات

self.addEventListener("fetch", event => {

event.respondWith(

caches.match(event.request)

.then(response => {

if(response){

return response;

}

return fetch(event.request)

.then(networkResponse => {

if(
!networkResponse ||
networkResponse.status !== 200 ||
networkResponse.type !== "basic"
){

return networkResponse;

}

const responseClone =
networkResponse.clone();

caches.open(CACHE_NAME)

.then(cache => {

cache.put(
event.request,
responseClone
);

});

return networkResponse;

})

.catch(() => {

if(
event.request.destination === "document"
){

return caches.match(
"./index.html"
);

}

});

})

);

});