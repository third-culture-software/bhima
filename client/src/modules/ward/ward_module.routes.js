angular.module('bhima.routes')
  .config(['$stateProvider', wardModuleStateProvider]);

/**
 *
 * @param $stateProvider
 */
function wardModuleStateProvider($stateProvider) {
  $stateProvider
    .state('wardModuleConfiguration', {
      url : '/ward/configuration',
      views : {
        '' : {
          templateUrl : 'modules/ward/configuration/configuration.html',
        },
        'ward@wardModuleConfiguration' : {
          templateUrl : 'modules/ward/configuration/ward/ward.html',
          controller : 'WardController as WardCtrl',
        },
        'room@wardModuleConfiguration' : {
          templateUrl : 'modules/ward/configuration/room/room.html',
          controller : 'RoomController as RoomCtrl',
        },
        'bed@wardModuleConfiguration' : {
          templateUrl : 'modules/ward/configuration/bed/bed.html',
          controller : 'BedController as BedCtrl',
        },
      },
    });
}
