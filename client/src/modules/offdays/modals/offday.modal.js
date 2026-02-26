angular.module('bhima.controllers')
  .controller('OffdayModalController', OffdayModalController);

OffdayModalController.$inject = [
  '$state', 'OffdayService', 'NotifyService', 'appcache', 'moment', 'params',
];

/**
 * @param $state
 * @param Offdays
 * @param Notify
 * @param AppCache
 * @param moment
 * @param params
 * @function OffdayModalController
 * @description
 * This modal sets the offdays for the payroll module.
 */
function OffdayModalController($state, Offdays, Notify, AppCache, moment, params) {
  const vm = this;
  vm.offday = {};

  const cache = AppCache('OffdayModal');

  if (params.isCreateState || params.id) {
    cache.stateParams = params;
  }

  vm.stateParams = cache.stateParams;
  vm.isCreateState = vm.stateParams.isCreateState;

  // update the date
  vm.onDateChange = (date) => {
    vm.offday.date = date;
  };

  // exposed methods
  vm.submit = submit;

  if (!vm.isCreateState) {
    Offdays.read(vm.stateParams.id)
      .then((offday) => {
        offday.date = new Date(offday.date);
        vm.offday = offday;
      })
      .catch(Notify.handleError);
  }

  // submit the data to the server from all two forms (update, create)
  /**
   *
   * @param offdayForm
   */
  function submit(offdayForm) {
    if (offdayForm.$invalid) { return 0; }

    const data = { ...vm.offday };

    data.date = moment(data.date).format('YYYY-MM-DD');

    const promise = (vm.isCreateState)
      ? Offdays.create(data)
      : Offdays.update(vm.offday.id, data);

    return promise
      .then(() => {
        const translateKey = (vm.isCreateState) ? 'FORM.INFO.CREATE_SUCCESS' : 'FORM.INFO.UPDATE_SUCCESS';
        Notify.success(translateKey);
        $state.go('offdays', null, { reload : true });
      })
      .catch(Notify.handleError);
  }
}
