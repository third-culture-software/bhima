angular.module('bhima.controllers')
  .controller('SettingDistributionModalController', SettingDistributionModalController);

SettingDistributionModalController.$inject = [
  '$state', 'DistributionCenterService', 'filters', 'Store', 'util', '$uibModalInstance', '$translate'];

/**
 *
 * @param $state
 * @param DistributionCenter
 * @param filters
 * @param Store
 * @param util
 * @param ModalInstance
 * @param $translate
 */
function SettingDistributionModalController($state, DistributionCenter, filters, Store, util,
  ModalInstance, $translate) {
  const vm = this;

  // exposed methods
  vm.submit = submit;

  const changes = new Store({ identifier : 'key' });
  vm.distribution = {};

  const settingOptions = [
    'fiscal', 'periodFrom', 'periodTo',
    'typeCostCenter', 'account_id',
    'distributed', 'trans_id', 'hrRecord', 'cost_center_id',
  ];

  const lastValues = {};

  // displayValues will be an id:displayValue pair
  const displayValues = {};
  const lastDisplayValues = DistributionCenter.filters.formatView().defaultFilters;

  lastDisplayValues.forEach((last) => {
    lastValues[last._key] = last._displayValue;
  });

  vm.filters = filters;
  // searchQueries is the same id:value pair
  vm.searchQueries = {};

  // assign already defined custom filters to searchQueries object
  vm.distribution = util.maskObjectFromKeys(filters, settingOptions);

  vm.onSelectFiscal = function onSelectFiscal(fiscal) {
    vm.distribution.fiscal = fiscal;
  };

  vm.onSelectPeriodFrom = function onSelectPeriodFrom(period) {
    vm.distribution.periodFrom = period.id;
    displayValues.periodFrom = period.hrLabel;
  };

  vm.onSelectPeriodTo = function onSelectPeriodTo(period) {
    vm.distribution.periodTo = period.id;
    displayValues.periodTo = period.hrLabel;
  };

  vm.onSelectAccount = function onSelectAccount(account) {
    vm.distribution.account_id = account.id;
    displayValues.account_id = String(account.number).concat(' - ', account.label);
  };

  vm.onSelectCostCenter = function onSelectCostCenter(costCenter) {
    vm.distribution.cost_center_id = costCenter.id;
    displayValues.cost_center_id = costCenter.label;
  };

  // deletes a filter from the custom filter object, this key will no longer be written to changes on exit
  vm.clear = function clear(key) {
    delete vm.distribution[key];
  };

  // submit the data to the server from all two forms (update, create)
  /**
   *
   * @param distributionCenterForm
   */
  function submit(distributionCenterForm) {
    displayValues.typeCostCenter = vm.distribution.typeCostCenter
      ? $translate.instant('FORM.LABELS.COST_CENTER') : $translate.instant('FORM.LABELS.PROFIT_CENTER');

    displayValues.distributed = vm.distribution.distributed
      ? $translate.instant('FORM.LABELS.DISTRIBUTED') : $translate.instant('FORM.LABELS.WAITING_DISTRIBUTION');

    if (distributionCenterForm.$invalid) { return 0; }
    let _displayValue;

    // push all searchQuery values into the changes array to be applied
    angular.forEach(vm.distribution, (_value, _key) => {

      if (angular.isDefined(_value)) {
        // default to the original value if no display value is defined
        _displayValue = displayValues[_key] || lastValues[_key];

        changes.post({ key : _key, value : _value, displayValue : _displayValue });
      }
    });

    const loggedChanges = changes.getAll();

    // return values to the voucher controller
    return ModalInstance.close(loggedChanges);
  }

  vm.cancel = function cancel() { ModalInstance.close(); };
}
