const C='desk-v1',A=['./','index.html','app.css','app.js','chart.js','manifest.json'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(A))));
self.addEventListener('fetch',e=>{if(e.request.url.endsWith('.json')&&!e.request.url.endsWith('manifest.json'))return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});
self.addEventListener('push',e=>{const d=e.data?e.data.json():{};e.waitUntil(self.registration.showNotification(d.title||'Desk',{body:d.body||'',data:d.url}))});
self.addEventListener('notificationclick',e=>{e.notification.close();if(e.notification.data)e.waitUntil(clients.openWindow(e.notification.data))});
