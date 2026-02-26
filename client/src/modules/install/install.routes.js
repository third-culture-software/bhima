angular.module('bhima.routes')
  .config(['$stateProvider', installStateProvider]);

/**
 *
 * @param $stateProvider
 */
function installStateProvider($stateProvider) {
  $stateProvider
    .state('install', {
      url : '/install',
      controller : 'InstallApplicationController as InstallCtrl',
      templateUrl : 'modules/install/install.html',
      data : { isInstallState : true, allowAuthPassthrough : true },
    });
}
