angular.module('bhima.controllers')
  .controller('MergeLocationsModalController', MergeLocationsModalController);

MergeLocationsModalController.$inject = [
  'LocationService', 'data', 'NotifyService', '$uibModalInstance',
];

/**
 *
 * @param Locations
 * @param data
 * @param Notify
 * @param Instance
 */
function MergeLocationsModalController(Locations, data, Notify, Instance) {
  const vm = this;
  let otherLocation;

  vm.locations = data.locations;
  vm.locationStatus = data.status;

  vm.submit = submit;
  vm.cancelUiSref = cancelUiSref;

  vm.selectLocation = uuid => {
    vm.selected = uuid;

    vm.locations.forEach(location => {
      if (location.uuid !== vm.selected) {
        otherLocation = location.uuid;
      }
    });
  };

  /**
   *
   */
  function cancelUiSref() {
    return Instance.close(true);
  }

  /**
   *
   */
  function submit() {
    if (!vm.selected) {
      return Notify.danger('FORM.WARNINGS.EMPTY_SELECTION');
    }

    const params = {
      selected : vm.selected,
      other : otherLocation,
      locationStatus : vm.locationStatus,
    };

    return Locations.merge(params)
      .then(() => {
        Notify.success('LOCATION.MERGE_SUCCESS');
        return Instance.close(true);
      })
      .catch(Notify.handleError);
  }
}
