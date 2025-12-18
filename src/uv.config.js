/*global Ultraviolet*/
/**
 * Ultraviolet configuration object.
 *
 * @typedef {Object} UVConfig
 * @property {string} prefix - URL prefix used for service routing.
 * @property {function(string):string} encodeUrl - Function to encode a URL using XOR codec.
 * @property {function(string):string} decodeUrl - Function to decode a URL using XOR codec.
 * @property {string} handler - Path to the handler script.
 * @property {string} client - Path to the client script.
 * @property {string} bundle - Path to the bundle script.
 * @property {string} config - Path to the config script.
 * @property {string} sw - Path to the service worker script.
 */

/**
 * Default Ultraviolet configuration.
 * @type {UVConfig}
 */
export default {
  prefix: '/service/',
  encodeUrl: Ultraviolet.codec.xor.encode,
  decodeUrl: Ultraviolet.codec.xor.decode,
  handler: '/uv.handler.js',
  client: '/uv.client.js',
  bundle: '/uv.bundle.js',
  config: '/uv.config.js',
  sw: '/uv.sw.js'
};
