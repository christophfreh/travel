// seoul, november. – offline cache
const V="sn-v1", PAGE="/";
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.add(PAGE)).catch(()=>{})); self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
const STATIC=/\/fotos\/|\/icons\/|fonts\.(googleapis|gstatic)\.com|images\.unsplash\.com|unpkg\.com|cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|blob\.vercel-storage\.com|tile\.openstreetmap\.org/;
self.addEventListener("fetch",e=>{
  const r=e.request; if(r.method!=="GET") return;
  const u=new URL(r.url);
  if(u.pathname.startsWith("/__")) return;
  if(r.mode==="navigate"){
    e.respondWith(fetch(r).then(res=>{ if(res.ok){const cp=res.clone(); caches.open(V).then(c=>c.put(PAGE,cp));} return res; })
      .catch(()=>caches.match(PAGE).then(m=>m||new Response("Offline",{status:503}))));
    return;
  }
  if(u.origin===location.origin && u.pathname==="/api/photo"){
    e.respondWith(caches.open(V).then(c=>c.match(r).then(m=>m||fetch(r).then(res=>{ if(res.ok) c.put(r,res.clone()); return res; }))));
    return;
  }
  if(u.origin===location.origin && u.pathname.startsWith("/api/")){
    if(u.pathname==="/api/photos"||u.pathname==="/api/rates"||u.pathname==="/api/achievements"||u.pathname==="/api/hidden"){
      e.respondWith(fetch(r).then(res=>{ if(res.ok){const cp=res.clone(); caches.open(V).then(c=>c.put(r,cp));} return res; }).catch(()=>caches.match(r).then(m=>m||Response.json({offline:true},{status:503}))));
    }
    return;
  }
  if(STATIC.test(r.url)){
    e.respondWith(caches.open(V).then(c=>c.match(r).then(m=>{ const net=fetch(r).then(res=>{ if(res.ok||res.type==="opaque") c.put(r,res.clone()); return res; }).catch(()=>m); return m||net; })));
  }
});
self.addEventListener("message",e=>{
  const d=e.data||{}; if(d.type!=="precache"||!Array.isArray(d.urls)) return;
  e.waitUntil(caches.open(V).then(async c=>{ let ok=0; for(const u of d.urls){ try{ const m=await c.match(u); if(!m){ const res=await fetch(u,{mode:new URL(u,location.href).origin===location.origin?"same-origin":"no-cors"}); if(res.ok||res.type==="opaque") await c.put(u,res); } ok++; }catch(err){} }
    const cl=await self.clients.matchAll(); cl.forEach(x=>x.postMessage({type:"precached",ok,total:d.urls.length})); }));
});
