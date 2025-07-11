/**
 * Service Worker Cache Version
 * Update this version number on each deployment to force cache invalidation
 */
export const CACHE_VERSION = 'v3::' + Date.now(); // Dynamic versioning with timestamp
export const CHUNK_CACHE_NAME = 'chunks-' + CACHE_VERSION;
export const STATIC_CACHE_NAME = 'static-' + CACHE_VERSION;