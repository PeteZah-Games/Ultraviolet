/*
 * Stock service worker script.
 * Users can provide their own sw.js if they need to extend the functionality of the service worker.
 * Ideally, this will be registered under the scope in uv.config.js so it will not need to be modified.
 * However, if a user changes the location of uv.bundle.js/uv.config.js or sw.js is not relative to them, they will need to modify this script locally.
 */

/* DO NOT REMOVE THESE LINES */
import __uv$config from './uv.config.js';
import UVServiceWorker from './uv.sw.js';
self.__uv$config = __uv$config;
const uv = new UVServiceWorker();

async function handleRequest(event) {
  if (uv.route(event)) {
    return await uv.fetch(event);
  }

  return await fetch(event.request);
}
/* You can remove anything below this, it's not part of UV 
   (though you have to hook onto fetch requests somewhere)*/

self.addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event));
});
