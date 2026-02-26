angular.module('bhima.controllers')
  .controller('DataCollectorManagementModalController', DataCollectorManagementModalController);

DataCollectorManagementModalController.$inject = [
  '$state', 'DataCollectorManagementService', 'NotifyService', 'appcache', 'ColorService', 'params',
];

/**
 * Data Collector Management Modal Controller
 * @param $state
 * @param DataCollectorManagement
 * @param Notify
 * @param AppCache
 * @param Color
 * @param params
 */
function DataCollectorManagementModalController(
  $state, DataCollectorManagement, Notify, AppCache, Color, params,
) {
  const vm = this;
  const cache = AppCache('DataCollectorManagementModal');

  vm.dataCollector = {};
  vm.stateParams = {};
  vm.colors = Color.list;

  // exposed methods
  vm.submit = submit;
  vm.closeModal = closeModal;
  vm.clear = clear;

  if (params.isCreateState || params.id) {
    cache.stateParams = params;
    vm.stateParams = cache.stateParams;
  } else {
    vm.stateParams = cache.stateParams;
  }

  vm.isCreateState = vm.stateParams.isCreateState;

  if (!vm.isCreateState) {
    DataCollectorManagement.read(vm.stateParams.id)
      .then(data => {
        vm.dataCollector = data;
      })
      .catch(Notify.handleError);
  }

  // load Data Collector Management
  DataCollectorManagement.read()
    .then(dataCollectors => {
      vm.dataCollectors = dataCollectors;
    })
    .catch(Notify.handleError);

  // submit the data to the server from all two forms (update, create)
  /**
   *
   * @param dataCollectorManagementForm
   */
  function submit(dataCollectorManagementForm) {
    vm.hasNoChange = dataCollectorManagementForm.$submitted
      && dataCollectorManagementForm.$pristine
      && !vm.isCreateState;

    if (dataCollectorManagementForm.$invalid) { return null; }
    if (dataCollectorManagementForm.$pristine) { return null; }

    const promise = (vm.isCreateState)
      ? DataCollectorManagement.create(vm.dataCollector)
      : DataCollectorManagement.update(vm.dataCollector.id, vm.dataCollector);

    return promise
      .then(() => {
        const translateKey = (vm.isCreateState) ? 'FORM.INFO.CREATE_SUCCESS' : 'FORM.INFO.UPDATE_SUCCESS';
        Notify.success(translateKey);
        $state.go('data_collector_management', null, { reload : true });
      })
      .catch(Notify.handleError);
  }

  /**
   *
   * @param value
   */
  function clear(value) {
    vm.dataCollectors[value] = null;
  }

  /**
   *
   */
  function closeModal() {
    $state.go('data_collector_management');
  }
}
