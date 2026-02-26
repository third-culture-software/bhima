angular.module('bhima.services')
  .service('SessionService', SessionService);

SessionService.$inject = [
  '$sessionStorage', '$http', '$state', 'util', '$rootScope', '$q', '$location',
];

/**
 * @param $sessionStorage
 * @param $http
 * @param $state
 * @param util
 * @param $rootScope
 * @param $q
 * @param $location
 * @module SessionService
 * @description
 * This service is responsible for retaining the client's session in session
 * storage.  It contains the methods for login and logout.
 *
 * If any service/component needs to be alerted of a change in login state, the
 * SessionService emits two events: 'login' and 'logout' via $rootScope that can
 * be listened to throughout the application.  Currently, only
 * ApplicationController consumes these events.
 * @class
 */
function SessionService($sessionStorage, $http, $state, util, $rootScope, $q, $location) {
  const service = this;

  // set up the storage instance
  $sessionStorage['client-session'] = $sessionStorage['client-session'] || {};
  const $storage = $sessionStorage['client-session'];

  // creates a new session instance from the cached storage
  service.create = create;

  // unsets the values for the session variables
  service.destroy = destroy;

  // login http method
  service.login = login;

  service.hasUserAction = hasUserAction;

  // logout http method
  service.logout = logout;

  // reloads a user's session
  service.reload = reload;

  service.isSettingEnabled = isSettingEnabled;

  service.isLoggedIn = () => !!service.user;

  service.hasStateAuthorisation = (state) => {
    // if the state is a "public" state (allowAuthPassthrough is true),
    // approve the transition
    const hasPermission = state.data && state.data.allowAuthPassthrough;
    if (hasPermission) { return true; }

    // check if the user is allowed to access that path
    // TODO(@jniles): use state.url or state names for authorisation
    const authorized = service.paths.some((data) => checkUserAuthorization(data, $location.path()));
    return authorized;
  };

  /**
   * @function checkUserAuthorization
   * @description
   * Simple method to check the current path the user is accessing against the
   * users known permissions.
   *
   * Checks one known permission (data) against the path the user is accessing (path).
   * @param {object} data - a route object containing a known route path as well as
   *                        information on if this user is authorised, route
   *                        objects passed in that match the target path will be aproved
   * @param path
   */
  function checkUserAuthorization(data, path) {

    // check to see if the route permission object (data) passed in begins with the path being accessed
    // only do more expensive check if the path is a valid partial match
    if (path.indexOf(data.path) === 0) {
      // split the current target path and the role permission object path into sections
      const rolePermissionPathSections = data.path.split('/');
      const targetPathSections = path.split('/');

      // ensure that EVERY section on the role permission path matches the target path
      // this allows for additional routing beyond exact matching however the base of the
      // path must EXACTLY match the permission object
      const targetPathMatches = rolePermissionPathSections.every((permissionPathSection, index) => {
        // check that this section of the target path exactly matches the required route permission object
        // at the same index
        const targetPathSection = targetPathSections[index];
        return permissionPathSection === targetPathSection;
      });

      return targetPathMatches && data.authorized;
    }

    // this was not a valid partial match - the route cannot be authorised with this permission
    return false;
  }

  // set the user, enterprise, and project for the session
  // this should happen right after login
  /**
   *
   * @param user
   * @param enterprise
   * @param stockSettings
   * @param project
   * @param paths
   * @param actions
   */
  function create(user, enterprise, stockSettings, project, paths, actions) {
    $storage.user = user;
    $storage.enterprise = enterprise;
    $storage.stock_settings = stockSettings;
    $storage.project = project;
    $storage.paths = paths;
    $storage.actions = actions;

    // update bindings
    load();
  }

  /** unsets a user's session, destroying it */
  function destroy() {
    delete $storage.user;
    delete $storage.enterprise;
    delete $storage.stock_settings;
    delete $storage.project;
    delete $storage.paths;
    delete $storage.actions;

    // update bindings
    load();

    $state.go('login');
  }

  /**
   * attempt to log the user into the server and create a client session
   * @param {object} credentials - the credentials to be submitted to the
   *   server, including username and password
   * @returns {Promise} promise - a HTTP promise fulfilled with the user session
   */
  function login(credentials) {
    /** @todo - should the login reject if a user is already logged in? */
    return $http.post('/auth/login', credentials)
      .then(util.unwrapHttpResponse)
      .then(session => {

        // create the user session in the $storage
        create(
          session.user, session.enterprise, session.stock_settings, session.project, session.paths, session.actions,
        );

        // notify login event
        $rootScope.$emit('session:login');

        return session;
      });
  }

  /**
   * logs the user out of the server and destroys their client-side session.
   * @returns {Promise} promise - the HTTP logout promise
   */
  function logout() {
    return $http.get('/auth/logout')
      .then(() => {

        // destroy the user's session from $storage
        destroy();

        // notify the logout event
        $rootScope.$emit('session:logout');

        // navigate to the main page
        $state.go('login');
      });
  }

  /** binds the user's session parameters to the storage ones */
  function load() {
    service.user = $storage.user;
    service.enterprise = $storage.enterprise;
    service.stock_settings = $storage.stock_settings;
    service.project = $storage.project;
    service.paths = $storage.paths;
    service.actions = $storage.actions;
  }

  /**
   *
   */
  function reload() {
    if ($storage.user) {
      return $http.post('/auth/reload', { username : $storage.user.username })
        .then(util.unwrapHttpResponse)
        .then((session) => {

          // re-create the user session in the $storage
          create(
            session.user, session.enterprise, session.stock_settings, session.project, session.paths, session.actions,
          );

          // tell the tree to re-download a user's units
          $rootScope.$emit('session:reload');
        });
    }

    return $q.resolve();
  }

  /**
   *
   * @param actionId
   */
  function hasUserAction(actionId) {
    return service.actions.includes(actionId);
  }

  /**
   * @function isSettingEnabled
   * @description
   * Checks if a setting is enabled on the enterprise.
   * @param {string} [setting] - the key of the enterprise setting to check.
   * @returns {boolean<result>} - true if setting is enabled.
   */
  function isSettingEnabled(setting) {
    return service.enterprise.settings[`enable_${setting}`];
  }

  // if the $rootScope emits 'session.destroy', destroy the session
  $rootScope.$on('session:destroy', destroy);

  // initialize loading to see if the user is already logged in
  load();
}
