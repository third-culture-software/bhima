angular.module('bhima.services')
  .service('HttpCacheService', HttpCacheService);

HttpCacheService.$inject = ['$interval'];

/**
 * @param $interval
 * @function HttpCacheService
 * @description
 * The HttpCacheService is a generic wrapper for asynchronous requests to ensure
 * they requests with identical parameters are only called once. It works by
 * serializing the request's parameters and caching the response to those parameters
 * for a short time.  If any other requests are made during the cached time, the
 * previous response is returned directly.
 *
 * NOTE(@jniles) - we use $interval here to avoid slowing down protractor tests.
 * Thanks to @sfount who debugged this in Dec 2016.
 * TODO(@jniles) - do we still need this workaround?
 */
function HttpCacheService($interval) {

  // default cache limit - 15 seconds
  const HTTP_CACHE_DEFAULT_TIMEOUT = 15000;

  /**
   * @param {...any} args
   * @function serialize
   * @description
   * This function serializes the arguments passed in to create a string key
   * that can be used to index the callback results.
   * @returns {string} - string representation of arguments
   */
  const serialize = (...args) => JSON.stringify(args);

  /**
   * @function HttpCache
   * @description
   * Takes in a callback function to call if the result is not in the cache.  The
   * response is cached and returned to the caller.
   * @param {Function} callback - a callback function to call if there is no cached
   * value.  The result of this function will be cached.
   * @param {number} duration - the duration the result will be cached.
   * @returns {Function} - a function that wraps the cache query or original
   * callback.
   */
  function HttpCache(callback, duration = HTTP_CACHE_DEFAULT_TIMEOUT) {
    const cache = new Map();

    /**
     *
     * @param id
     * @param parameters
     * @param cacheBust
     */
    function read(id, parameters, cacheBust = false) {
      const key = serialize(id, parameters);

      // if the cache has been populated return the value from memory
      if (cache.has(key) && !cacheBust) {
        return cache.get(key);
      }

      // call the callback to get the result and cache it
      const promise = callback(id, parameters);
      cache.set(key, promise);

      // remove the result from the cache after a duration.  Repeated only once
      $interval(() => {
        cache.delete(key);
      }, duration, 1);

      return promise;
    }

    return read;
  }

  return HttpCache;
}
