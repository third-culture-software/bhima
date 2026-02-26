angular.module('bhima.controllers')
  .controller('PriceListModalController', PriceListModalController);

PriceListModalController.$inject = [
  'data', '$uibModalInstance', 'NotifyService',
  'PriceListService', 'SessionService',
];

/**
 *
 * @param data
 * @param Instance
 * @param Notify
 * @param PriceList
 * @param Session
 */
function PriceListModalController(data, Instance, Notify, PriceList, Session) {
  const vm = this;
  vm.priceList = angular.copy(data) || { entrprise_id : Session.enterprise.id };
  vm.isCreate = !data;
  vm.submit = submit;
  vm.close = Instance.close;

  /**
   *
   * @param form
   */
  function submit(form) {
    form.$setSubmitted();

    if (form.$invalid) {
      Notify.danger('FORM.ERRORS.HAS_ERRORS');
    } else {
      delete vm.priceList.itemsNumber;
      delete vm.priceList.subcribedGroupsNumber;

      const operation = vm.isCreate ? PriceList.create(vm.priceList) : PriceList.update(data.uuid, vm.priceList);
      operation.then(() => {
        Notify.success('FORM.INFO.OPERATION_SUCCESS');
        return Instance.close(true);
      })
        .catch(Notify.handleError);
    }
  }

}
