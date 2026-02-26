angular.module('bhima.controllers')
  .controller('SearchPurchaseOrderModalController', SearchPurchaseOrderModalController);

SearchPurchaseOrderModalController.$inject = [
  '$uibModalInstance', 'params', 'Store', 'util', 'PeriodService',
  'NotifyService', 'PurchaseOrderService', '$translate', 'SearchModalUtilService',
];

/**
 * @param ModalInstance
 * @param params
 * @param Store
 * @param util
 * @param Periods
 * @param Notify
 * @param PurchaseOrder
 * @param $translate
 * @param SearchModal
 * @class SearchPurchaseOrderModalController
 * @description
 * This controller is responsible for setting up the filters for the Purchase Order
 * search functionality on the Purchase Order registry page.  Filters that are already
 * applied to the grid can be passed in via the params inject.
 */
function SearchPurchaseOrderModalController(
  ModalInstance, params, Store, util, Periods, Notify, PurchaseOrder,
  $translate, SearchModal,
) {
  const vm = this;
  const changes = new Store({ identifier : 'key' });
  vm.filters = params;
  vm.searchQueries = {};
  vm.defaultQueries = {};

  vm.today = new Date();

  // @TODO ideally these should be passed in when the modal is initialised
  //       these are known when the filter service is defined
  const searchQueryOptions = [
    'reference', 'user_id', 'supplier_uuid', 'defaultPeriod', 'status_id',
    'inventory_uuid',
  ];

  // displayValues will be an id:displayValue pair
  const displayValues = {};
  const lastDisplayValues = PurchaseOrder.filters.getDisplayValueMap();

  // load all Purchase status
  PurchaseOrder.purchaseState()
    .then((status) => {
      status.forEach((item) => {
        item.plainText = $translate.instant(item.text);
      });
      vm.purchaseStatus = status;
    })
    .catch(Notify.handleError);

  // assign already defined custom params to searchQueries object
  vm.searchQueries = util.maskObjectFromKeys(params, searchQueryOptions);

  // assign default limit filter
  if (params.limit) {
    vm.defaultQueries.limit = params.limit;
  }

  // bind methods
  vm.submit = submit;
  vm.cancel = cancel;
  vm.clear = clear;

  // custom filter user_id - assign the value to the params object
  vm.onSelectUser = function onSelectUser(user) {
    displayValues.user_id = user.display_name;
    vm.searchQueries.user_id = user.id;
  };

  vm.onSelectInventory = function onSelectInventory(inventory) {
    displayValues.inventory_uuid = inventory.code;
    vm.searchQueries.inventory_uuid = inventory.uuid;
  };

  // custom filter supplier_uuid - assign the value to the params object
  vm.onSelectSupplier = function onSelectSupplier(supplier) {
    displayValues.supplier_uuid = supplier.display_name;
    vm.searchQueries.supplier_uuid = supplier.uuid;
  };

  // Select Reponsible
  vm.onSelectBeneficiary = entity => {
    displayValues.responsible = entity.display_name;
    vm.searchQueries.responsible = entity.uuid;
  };

  vm.onPurchaseStatusChange = function onPurchaseStatusChange(purchaseStatus) {
    vm.searchQueries.status_id = purchaseStatus;
    let statusText = '/';

    purchaseStatus.forEach((statusId) => {
      vm.purchaseStatus.forEach((status) => {
        if (statusId === status.id) {
          statusText += `${status.plainText} / `;
        }
      });
    });

    displayValues.status_id = statusText;
  };

  // default filter limit - directly write to changes list
  vm.onSelectLimit = function onSelectLimit(value) {
    // input is type value, this will only be defined for a valid number
    if (angular.isDefined(value)) {
      changes.post({ key : 'limit', value });
    }
  };

  // default filter period - directly write to changes list
  vm.onSelectPeriod = function onSelectPeriod(period) {
    const periodFilters = Periods.processFilterChanges(period);

    periodFilters.forEach((filterChange) => {
      changes.post(filterChange);
    });
  };

  // returns the parameters to the parent controller
  /**
   *
   */
  function submit() {
    const loggedChanges = SearchModal.getChanges(vm.searchQueries, changes, displayValues, lastDisplayValues);
    return ModalInstance.close(loggedChanges);
  }

  // clears search parameters.  Custom logic if a date is used so that we can clear two properties
  /**
   *
   * @param value
   */
  function clear(value) {
    delete vm.searchQueries[value];
  }

  // dismiss the modal
  /**
   *
   */
  function cancel() {
    ModalInstance.close();
  }
}
