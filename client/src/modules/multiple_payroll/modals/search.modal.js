angular.module('bhima.controllers')
  .controller('MultiPayrollSearchModalController', MultiPayrollSearchModalController);

MultiPayrollSearchModalController.$inject = [
  '$uibModalInstance', 'filters', 'NotifyService', 'Store', 'util',
  'MultiplePayrollService', 'PayrollConfigurationService',
  '$translate', 'SessionService', 'SearchModalUtilService',
];

/**
 * @param ModalInstance
 * @param filters
 * @param Notify
 * @param Store
 * @param util
 * @param MultiplePayroll
 * @param Payroll
 * @param $translate
 * @param Session
 * @param SearchModal
 * @class MultiPayrollSearchModalController
 * @description
 * This controller is responsible to collecting data from the filter form and
 * returning it as a JSON object to the parent controller.  The data can be
 * preset by passing in a filters object using filtersProvider().
 */
function MultiPayrollSearchModalController(
  ModalInstance, filters, Notify, Store, util,
  MultiplePayroll, Payroll, $translate, Session,
  SearchModal,
) {
  const vm = this;
  vm.enterpriseCurrencyId = Session.enterprise.currency_id;

  const changes = new Store({ identifier : 'key' });
  const searchQueryOptions = [
    'payroll_configuration_id', 'currency_id', 'display_name', 'code', 'status_id',
  ];
  const lastValues = {};

  let statusText = '/';

  vm.filters = filters;
  // searchQueries is the same id:value pair
  vm.searchQueries = {};

  // assign already defined custom filters to searchQueries object
  vm.searchQueries = util.maskObjectFromKeys(filters, searchQueryOptions);

  // Default to enterprise currency
  vm.searchQueries.currency_id = vm.enterpriseCurrencyId;

  // displayValues will be an id:displayValue pair
  const displayValues = {};
  const lastDisplayValues = MultiplePayroll.filters.formatView().defaultFilters;

  if (lastDisplayValues.length) {
    lastDisplayValues.forEach((last) => {
      lastValues[last._key] = last._displayValue;
      vm.searchQueries[last._key] = last._value;
    });
  }

  // load all Paiement Status
  Payroll.paymentStatus()
    .then((paymentStatus) => {
      paymentStatus.forEach((item) => {
        item.plainText = $translate.instant(item.text);
      });

      vm.paymentStatus = paymentStatus;
    })
    .catch(Notify.handleError);

  vm.cancel = function cancel() { ModalInstance.close(); };

  // custom filter asign the value to the searchQueries object
  vm.onSelectPayrollPeriod = function onSelectPayrollPeriod(period) {
    vm.searchQueries.payroll_configuration_id = period.id;
    displayValues.payroll_configuration_id = period.label;
  };

  vm.setCurrency = function setCurrency(currency) {
    displayValues.currency_id = currency.label;
    vm.searchQueries.currency_id = currency.id;
  };

  vm.onPayrollStatusChange = function onPayrollStatusChange(paymentStatus) {
    vm.searchQueries.status_id = paymentStatus;

    paymentStatus.forEach((statusId) => {
      vm.paymentStatus.forEach((status) => {
        if (statusId === status.id) {
          statusText += `${status.plainText} / `;
        }
      });
    });

    displayValues.status_id = statusText;
  };

  // deletes a filter from the custom filter object, this key will no longer be written to changes on exit
  vm.clear = function clear(key) {
    delete vm.searchQueries[key];
  };

  // submit the filter object to the parent controller.
  vm.submit = function submit(form) {
    if (form.$invalid) { return 0; }

    const checkDisplayValuesLength = Object.keys(displayValues).length;
    const lastDisplayValuesLength = lastDisplayValues.length;

    if (lastDisplayValuesLength !== checkDisplayValuesLength) {
      lastDisplayValues.forEach(it => {
        Object.keys(vm.searchQueries).forEach(key => {
          if ((it._key === key) && (it._value === vm.searchQueries[key])) {
            displayValues[it._key] = it.displayValue;
          }
        });
      });
    }

    const loggedChanges = SearchModal.getChanges(vm.searchQueries, changes, displayValues, lastDisplayValues);
    return ModalInstance.close(loggedChanges);
  };
}
