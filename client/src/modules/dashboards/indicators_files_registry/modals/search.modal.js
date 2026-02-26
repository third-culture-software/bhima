angular.module('bhima.controllers')
  .controller('SearchIndicatorsFilesModalController', SearchIndicatorsFilesModalController);

SearchIndicatorsFilesModalController.$inject = [
  '$uibModalInstance', 'filters', 'Store', 'util',
  'IndicatorsDashboardService', 'NotifyService', '$translate',
  'SearchModalUtilService',
];

/**
 *
 * @param ModalInstance
 * @param filters
 * @param Store
 * @param util
 * @param IndicatorsDashboard
 * @param Notify
 * @param $translate
 * @param SearchModal
 */
function SearchIndicatorsFilesModalController(
  ModalInstance, filters, Store, util,
  IndicatorsDashboard, Notify, $translate, SearchModal,
) {
  const vm = this;
  const changes = new Store({ identifier : 'key' });

  // displayValues will be an id:displayValue pair
  const displayValues = {};

  const searchQueryOptions = [
    'fiscal_year_id', 'period_id', 'type_id', 'status_id', 'service_uuid', 'user_id',
  ];

  vm.filters = filters;
  vm.today = new Date();
  vm.defaultQueries = {};
  vm.searchQueries = {};

  // assign default limit filter
  if (filters.limit) {
    vm.defaultQueries.limit = filters.limit;
  }

  const lastDisplayValues = IndicatorsDashboard.indicatorsFilesGridFilterer.getDisplayValueMap();

  vm.searchQueries = util.maskObjectFromKeys(filters, searchQueryOptions);

  // bind methods
  vm.submit = submit;
  vm.cancel = cancel;
  vm.clear = clear;

  // load status
  IndicatorsDashboard.status.read()
    .then(status => {
      vm.status = status.map(translateKey);
    })
    .catch(Notify.errorHandler);

  // load types
  IndicatorsDashboard.types.read()
    .then(types => {
      vm.types = types.map(translateKey);
    })
    .catch(Notify.errorHandler);

  vm.onSelectPeriod = selected => {
    vm.searchQueries.period_id = selected.period && selected.period.id ? selected.period.id : undefined;
    vm.searchQueries.fiscal_year_id = selected.fiscal && selected.fiscal.id ? selected.fiscal.id : undefined;
  };

  vm.onSelectService = service => {
    vm.searchQueries.service_uuid = service.uuid;
  };

  vm.onSelectType = type => {
    vm.searchQueries.type_id = type.id;
  };

  vm.onSelectStatus = status => {
    vm.searchQueries.status_id = status.id;
  };

  vm.onSelectUser = user => {
    vm.searchQueries.user_id = user.id;
  };

  // default filter limit - directly write to changes list
  vm.onSelectLimit = function onSelectLimit(val) {
    // input is type value, this will only be defined for a valid number
    if (angular.isDefined(val)) {
      changes.post({ key : 'limit', value : val });
    }
  };

  // transalte keys
  /**
   *
   * @param item
   */
  function translateKey(item) {
    item.hrText = $translate.instant(item.translate_key);
    return item;
  }

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
   * @param {...any} value
   */
  function clear(...value) {
    for (let i = 0; i < value.length; i++) {
      const element = value[i];
      delete vm.searchQueries[element];
    }
  }

  // dismiss the modal
  /**
   *
   */
  function cancel() {
    ModalInstance.close();
  }
}
