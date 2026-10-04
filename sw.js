const CACHE="reconversion-control-v3";
const CORE=["./","./index.html","./style.css?v=3","./data.js?v=3","./app.js?v=3","./manifest.webmanifest","./assets/icon-192.png","./assets/icon-512.png"];

self.addEventListener("install",function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(CORE);}).then(function(){return self.skipWaiting();}));
});

self.addEventListener("activate",function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});

function put(c,r,x){
  if(x&&x.ok&&new URL(r.url).origin===location.origin)c.put(r,x.clone());
  return x;
}

function networkFirst(r){
  return caches.open(CACHE).then(function(c){
    return fetch(r).then(function(x){return put(c,r,x);}).catch(function(){
      return c.match(r,{ignoreSearch:true}).then(function(h){return h||c.match("./index.html");});
    });
  });
}

function cacheFirst(r){
  return caches.open(CACHE).then(function(c){
    return c.match(r,{ignoreSearch:true}).then(function(h){
      return h||fetch(r).then(function(x){return put(c,r,x);});
    });
  });
}

self.addEventListener("fetch",function(e){
  if(e.request.method!=="GET")return;
  var u=new URL(e.request.url);
  if(u.origin!==location.origin)return;
  if(e.request.mode==="navigate"||["script","style"].indexOf(e.request.destination)>=0){
    e.respondWith(networkFirst(e.request));
  }else{
    e.respondWith(cacheFirst(e.request).catch(function(){return caches.match("./index.html");}));
  }
});