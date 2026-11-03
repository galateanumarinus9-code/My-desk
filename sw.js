// Plan B: no web push. Kill-switch worker: unregisters itself if ever installed.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.registration.unregister()));
