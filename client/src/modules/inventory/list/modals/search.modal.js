angular.module('bhima.controllers')
  .controller('InventorySearchModalController', InventorySearchModalController);

InventorySearchModalController.$inject = [
  '$uibModalInstance', 'filters', 'InventoryService', 'Store', 'util',
  'SearchModalUtilService',
];

/**
 * @param ModalInstance
 * @param filters
 * @param Inventory
 * @param Store
 * @param util
 * @param SearchModal
 * @class InventorySearchModalController
 * @description
 * This controller is responsible for setting up the filters for the Inventory
 * search functionality on the Inventory list.  Filters that are already
 * applied to the grid can be passed in via the filters inject.
 */
function InventorySearchModalController(ModalInstance, filters, Inventory, Store, util, SearchModal) {
  const vm = this;

  const searchQueryOptions = [
    'code', 'group_uuid', 'consumable', 'text', 'locked',
    'label', 'type_id', 'price', 'tags', 'updated_by',
  ];

  const changes = new Store({ identifier : 'key' });

  // displayValues will be an id:displayValue pair
  const displayValues = {};

  vm.filters = filters;

  // bind methods
  vm.submit = submit;
  vm.cancel = cancel;
  vm.clear = clear;

  vm.today = new Date();
  vm.defaultQueries = {};
  vm.searchQueries = {};

  // assign default limit filter
  if (filters.limit) {
    vm.defaultQueries.limit = filters.limit;
  }

  const lastDisplayValues = Inventory.filters.getDisplayValueMap();

  // assign already defined custom filters to searchQueries object
  vm.searchQueries = util.maskObjectFromKeys(filters, searchQueryOptions);

  // default filter limit - directly write to changes list
  vm.onSelectLimit = function onSelectLimit(val) {
    // input is type value, this will only be defined for a valid number
    if (angular.isDefined(val)) {
      changes.post({ key : 'limit', value : val });
    }
  };

  // custom filter group_uuid - assign the value to the searchQueries object
  vm.onSelectGroup = function onSelectGroup(group) {
    displayValues.group_uuid = group.name;
    vm.searchQueries.group_uuid = group.uuid;
  };

  // custom filter type_id - assign the value to the searchQueries object
  vm.onSelectType = function onSelectType(type) {
    displayValues.type_id = type.text;
    vm.searchQueries.type_id = type.id;
  };

  // custom filter user - assign the value to the params object
  vm.onSelectUserUpdate = function onSelectUser(user) {
    vm.searchQueries.updated_by = user.id;
    displayValues.updated_by = user.display_name;
  };

  // custom filter the update_at
  vm.UpdateAt = (dateFrom, dateTo) => {
    vm.searchQueries.updated_at_from = dateFrom;
    displayValues.updated_at_from = dateFrom;
    vm.searchQueries.updated_at_to = dateTo;
    displayValues.updated_at_to = dateTo;
  };
  vm.onSelectTags = tags => {
    vm.searchQueries.tags = tags;
    displayValues.tags = tags.map(t => t.name).join(',');
  };

  // returns the parameters to the parent controller
  /**
   *
   */
  function submit() {
    const loggedChanges = SearchModal.getChanges(vm.searchQueries, changes, displayValues, lastDisplayValues);
    return ModalInstance.close(loggedChanges);
  }

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
