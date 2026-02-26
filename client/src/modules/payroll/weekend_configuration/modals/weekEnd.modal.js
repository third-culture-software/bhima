angular.module('bhima.controllers')
  .controller('WeekendModalController', WeekendModalController);

WeekendModalController.$inject = [
  '$state', 'ConfigurationWeekendService', 'NotifyService', 'appcache', 'bhConstants', 'params',
];

/**
 *
 * @param $state
 * @param Config
 * @param Notify
 * @param AppCache
 * @param bhConstants
 * @param params
 */
function WeekendModalController($state, Config, Notify, AppCache, bhConstants, params) {
  const vm = this;
  vm.weekend = {};
  vm.weekend.daysChecked = {};

  const cache = AppCache('WeekendModal');

  if (params.isCreateState || params.id) {
    cache.stateParams = params;
  }

  vm.stateParams = cache.stateParams;
  vm.isCreateState = params.isCreateState;

  // exposed methods
  vm.submit = submit;
  vm.closeModal = closeModal;

  // this array is 0-indexed which clashes with bhCheckboxTree
  // increment by one temporarily
  vm.weekDays = bhConstants.weekDays.map(day => ({ ...day, id : day.id + 1 }));

  vm.onChangeCallback = onChangeCallback;

  if (!vm.isCreateState) {
    Config.read(vm.stateParams.id)
      .then((weekend) => {
        vm.weekend = weekend;
      })
      .catch(Notify.handleError);

    Config.getWeekDays(vm.stateParams.id)
      .then((daysConfig) => {
        // increment indexes to make vm.weekDays
        vm.checkedIds = daysConfig.map(o => o.indice + 1);
      })
      .catch(Notify.handleError);
  }

  /**
   *
   * @param changes
   */
  function onChangeCallback(changes) {
    vm.checkedIds = changes;
  }

  // submit the data to the server from all two forms (update, create)
  /**
   *
   * @param WeekendForm
   */
  function submit(WeekendForm) {
    if (WeekendForm.$invalid || WeekendForm.$pristine) { return 0; }

    // decriment ids for submission to server.
    vm.weekend.daysChecked = vm.checkedIds.map(id => (id - 1));

    const promise = (vm.isCreateState)
      ? Config.create(vm.weekend)
      : Config.update(vm.weekend.id, vm.weekend);

    return promise
      .then(() => {
        const translateKey = (vm.isCreateState) ? 'FORM.INFO.CREATE_SUCCESS' : 'FORM.INFO.UPDATE_SUCCESS';
        Notify.success(translateKey);
        $state.go('configurationWeekend', null, { reload : true });
      })
      .catch(Notify.handleError);
  }

  /**
   *
   */
  function closeModal() {
    $state.go('configurationWeekend');
  }
}
