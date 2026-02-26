angular.module('bhima.services')
  .service('AppCache', AppCache)
  .service('appcache', AppCache);

AppCache.$inject = [
  '$localStorage', '$sessionStorage',
];

/**
 * Application Cache Service
 *
 * This service provides a uniform interface to both localStorage and
 * sessionStorage.
 *
 * NOTE - namespace clashing should not occur due to a prefix key set
 * in the main app.js module.
 * @param $localStorage
 * @param $sessionStorage
 * @class AppCache
 */
function AppCache($localStorage, $sessionStorage) {

  /**
   * returns a new $localStorage or $sessionStorage instance
   * @param name
   * @param temp
   * @function namespace
   * @public
   */
  return function namespace(name, temp) {

    // if temp is true, create only session storage instance
    const storage = (temp === true) ? $sessionStorage : $localStorage;

    // make a namespace for the storage instance, if it doesn't already exist
    storage[name] = storage[name] || {};

    // return the storage instance
    return storage[name];
  };
}
