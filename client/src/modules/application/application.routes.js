angular.module('bhima.routes')
  .config(['$stateProvider', $stateProvider => {
    $stateProvider
      .state('index', {
        url         : '/',
        controller  : 'HomeController as HomeCtrl',
        templateUrl : 'modules/home/home.html',
        data : { allowAuthPassthrough : true },
        onExit  : ['$uibModalStack', closeModal],
      });
  }]);

function closeModal($uibModalStack) {
  $uibModalStack.dismissAll();
}
