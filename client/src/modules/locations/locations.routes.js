angular.module('bhima.routes')
  .config(['$stateProvider', $stateProvider => {
    $stateProvider
      .state('locations', {
        url         : '/locations',
        controller  : 'LocationController as LocationCtrl',
        templateUrl : 'modules/locations/locations.html',
      })
      .state('locationsVillage', {
        url         : '/locations/village',
        controller  : 'VillageController as VillageCtrl',
        templateUrl : 'modules/locations/village/village.html',
      })
      .state('locationsSector', {
        url         : '/locations/sector',
        controller  : 'SectorController as SectorCtrl',
        templateUrl : 'modules/locations/sector/sector.html',
      })
      .state('locationsProvince', {
        url         : '/locations/province',
        controller  : 'ProvinceController as ProvinceCtrl',
        templateUrl : 'modules/locations/province/province.html',
      })
      .state('locationsCountry', {
        url         : '/locations/country',
        controller  : 'CountryController as CountryCtrl',
        templateUrl : 'modules/locations/country/country.html',
      })
      .state('locationsMerge', {
        url         : '/locations/merge',
        params      : {
          locations : [],
        },
        onEnter : ['$uibModal', mergeLocationsModal],
        onExit : ['$uibModalStack', closeModal],
      });
  }]);

/**
 *
 * @param $modal
 */
function mergeLocationsModal($modal) {
  $modal.open({
    keyboard : false,
    backdrop : 'static',
    templateUrl : 'modules/locations/modals/mergeLocations.modal.html',
    controller : 'MergeLocationsModalController as MergeLocationsModalCtrl',
  });
}

/**
 *
 * @param ModalStack
 */
function closeModal(ModalStack) {
  ModalStack.dismissAll();
}
