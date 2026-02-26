/* eslint no-console:"off" */
const bhima = angular.module('bhima', [
  'bhima.controllers', 'bhima.services', 'bhima.directives', 'bhima.filters',
  'bhima.components', 'bhima.routes', 'bhima.constants', 'ui.bootstrap',
  'pascalprecht.translate', 'ngStorage',
  'tmh.dynamicLocale', 'ngFileUpload', 'ui.grid', 'ui.grid.saveState',
  'ui.grid.selection', 'ui.grid.autoResize', 'ui.grid.resizeColumns',
  'ui.grid.edit', 'ui.grid.grouping', 'ui.grid.treeView', 'ui.grid.cellNav',
  'ui.grid.pagination', 'ui.grid.moveColumns', 'ui.grid.exporter',
  'ui.grid.expandable', 'angularMoment', 'ngMessages',
  'growlNotifications', 'ngAnimate', 'ngSanitize', 'ui.select', 'ngTouch', 'webcam',
]);

/**
 *
 * @param $urlMatcherFactoryProvider
 */
function bhimaConfig($urlMatcherFactoryProvider) {
  // allow trailing slashes in routes
  $urlMatcherFactoryProvider.strictMode(false);
}

/**
 *
 * @param $translateProvider
 */
function translateConfig($translateProvider) {
  // TODO Review i18n and determine if this it the right solution
  $translateProvider.useStaticFilesLoader({
    prefix : '/i18n/',
    suffix : '.json',
  });

  $translateProvider.useSanitizeValueStrategy('escape');

  $translateProvider.preferredLanguage('fr');
}

/**
 *
 * @param tmhDynamicLocaleProvider
 */
function localeConfig(tmhDynamicLocaleProvider) {
  // TODO Hardcoded default translation/ localisation
  tmhDynamicLocaleProvider.localeLocationPattern('/i18n/locale/angular-locale_{{locale}}.js');
  tmhDynamicLocaleProvider.defaultLocale('fr-be');
}

// redirect to login if not signed in.
/**
 *
 * @param $state
 * @param SessionService
 * @param amMoment
 * @param Notify
 * @param InstallService
 * @param $transitions
 */
function startupConfig(
  $state, SessionService, amMoment, Notify, InstallService, $transitions,
) {

   
  $transitions.onBefore({}, (transition) => {
    const { stateService } = transition.router;
    const toState = transition.to();
    const fromState = transition.from();

    const isAuthenticated = transition.injector().get('SessionService').isLoggedIn();
    const isLoginState = toState.data && toState.data.isLoginState;
    const isInstallState = toState.data && toState.data.isInstallState;

    // if the user is logged in and trying to access the login state, deny the
    // attempt with a message "Cannot return to login.  Please log out from the
    // Settings Page.
    if (isAuthenticated && isLoginState) {
      if (fromState.name !== '') {
        // page refresh - no state chosen yet, so go to the login page
        Notify.warn('AUTH.CANNOT_RETURN_TO_LOGIN');
        return false;
      }

    // if the user is not logged in and trying to access any other state, deny
    // the attempt with a message that their session expired and redirect them
    // to the login page.
    } if (!isAuthenticated && !isLoginState && !isInstallState) {
      return stateService.target('login');

      // if user is logged in and trying to access install keep the user in
      // the current state.
    } if (isAuthenticated && isInstallState) {
      return false;

      // goto install state if it is possible
    } if (!isAuthenticated && isInstallState) {

      return InstallService.checkBasicInstallExist()
        .then(({ isInstalled }) => {
          if (isInstalled) {
            return stateService.target('login');
          }
          // continue the routing
          return true;
        });
    }

    // else, the user is free to continue as they wish
  });

   
  $transitions.onFinish({}, (transition) => {
    const { stateService } = transition.router;
    const toState = transition.to();

    // check if the user is authorized to access this route.
    if (!SessionService.hasStateAuthorisation(toState)) {
      return stateService.target('403');
    }

  });

  // TODO Hardcoded default translation/ localisation
  amMoment.changeLocale('fr');
}

// set the proper key prefix
/**
 *
 * @param $localStorageProvider
 */
function localStorageConfig($localStorageProvider) {
  const PREFIX = `bh-${window.location.hostname}-`;
  $localStorageProvider.setKeyPrefix(PREFIX);
}

/**
 * This function is responsible for configuring angular's $http service. Any
 * relevant services/ factories are registered at this point.
 * @param {object} $httpProvider   Angular provider inject containing
 *                                  'interceptors' that are chained on any HTTP request
 */
function httpConfig($httpProvider) {
  // register an auth injector, which logs $http errors to the console, even if
  // caught by a .catch() statement.
  // TODO - in production, we shouldn't log as many errors
  $httpProvider.interceptors.push('AuthInjectorFactory');

  // register error handling interceptor
  $httpProvider.interceptors.push('ErrorInterceptor');

  // perf - applyAsync
  $httpProvider.useApplyAsync(true);
}

/**
 * Configure ng-animate - currently this library tries to apply to all elements
 * which has significant performance implications. Filtering the scope to only
 * elements wit 'ng-animate-enabled' allows the library to be used without the
 * performance hit.
 * @param $animateProvider
 */
function animateConfig($animateProvider) {
  $animateProvider.classNameFilter(/ng-animate-enabled/);
}

/**
 * Configure the $compiler with performance enhancing variables
 * @param $compileProvider
 */
function compileConfig($compileProvider) {
  // switch this variable when going into production for an easy performance win.
  const PRODUCTION = true;

  if (PRODUCTION) {
    $compileProvider.debugInfoEnabled(false);

    // available in angular:1.6.x
    $compileProvider.commentDirectivesEnabled(false);
    $compileProvider.cssClassDirectivesEnabled(false);
  }
}

/**
 * Configure global properties about ui-select
 * @param config
 */
function uiSelectConfig(config) {
  config.theme = 'bootstrap';
}

// configures the modals with default values
/**
 *
 * @param $uibModalProvider
 */
function uiModalConfig($uibModalProvider) {
  $uibModalProvider.options.size = 'md';
  $uibModalProvider.options.backdrop = 'static';
  $uibModalProvider.options.keyboard = false;
  $uibModalProvider.options.animation = false;
}

// configure services, providers, factories
bhima.config(['$urlMatcherFactoryProvider', bhimaConfig]);
bhima.config(['$translateProvider', translateConfig]);
bhima.config(['uiSelectConfig', uiSelectConfig]);
bhima.config(['tmhDynamicLocaleProvider', localeConfig]);
bhima.config(['$localStorageProvider', localStorageConfig]);
bhima.config(['$httpProvider', httpConfig]);
bhima.config(['$animateProvider', animateConfig]);
bhima.config(['$uibModalProvider', uiModalConfig]);
bhima.config(['$compileProvider', compileConfig]);

// run the application
bhima.run([
  '$state', 'SessionService', 'amMoment', 'NotifyService', 'InstallService', '$transitions', startupConfig,
]);
