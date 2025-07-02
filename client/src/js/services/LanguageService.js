angular.module('bhima.services')
  .service('LanguageService', LanguageService);

LanguageService.$inject = [
  '$http', '$q', 'util', 'AppCache', '$translate', 'tmhDynamicLocale', 'amMoment',
];

/**
 * Language Service
 *
 * A cross-controller service to manage languages throughout the application.
 * Supports getter and setter methods.
 * @constructor
 */
function LanguageService($http, $q, util, AppCache, $translate, Locale, Moment) {
  const service = this;

  /** language settings are stored in the application settings */
  const cache = AppCache('settings');

  /** object to cache the list of supported languages */
  let languages = {};

  /** sets the current language */
  service.set = set;

  /** retrieves the current language */
  service.get = get;

  /** retrieves the languages from the backend */
  service.read = read;

  /**
   * set the current application language to the key passed in and caches the
   * language key for later lookups.  Finally, it sets the translate
   *
   * @param {string} key - the language key to set the language
   */
  function set(key) {

    // retrieve the language object
    const language = languages[key];

    // cache the key
    cache.key = key;

    // set the language key
    service.key = key;

    // translate the application using the key
    $translate.use(language.key);

    // change the date/time locale using the localeKey
    Locale.set(language.localeKey);

    // change angular-moment's language based on the key
    Moment.changeLocale(language.key);
  }

  /** returns the current application language object */
  function get() {
    return languages[service.key];
  }

  /**
   * Reads the languages from the database table and populates the internal
   * languages object.
   *
   * @method read
   * @public
   * @param {boolean} refresh - refreshes the languages if necessary
   * @returns {promise} languages - the langauge object
   */
  function read(refresh) {

    const loadCachedData = !(angular.equals(languages, {}) || refresh);

    // if we have
    if (loadCachedData) {
      return $q.when(languages);
    }

    // load languages from the database
    return $http.get('/languages')
      .then(util.unwrapHttpResponse)
      .then((langs) => {

        // bind langauges to service in the form of { key : languageObject }
        languages = langs.reduce((map, lang) => {
          map[lang.key] = lang;
          return map;
        }, {});

        // load the initial language and preferences based on the cache key
        // defaults to 'fr'
        set(cache.key || 'fr');

        return languages;
      });
  }

  return service;
}
