angular.module('bhima.controllers')
  .controller('DepotManagementController', DepotManagementController);

DepotManagementController.$inject = [
  'DepotService', 'ModalService', 'NotifyService', 'uiGridConstants', '$state',
  'StockService', 'StockModalService', 'FormatTreeDataService', 'bhConstants',
];

/**
 * Depot Management Controller
 *
 * This controller is about the depot management module in the admin zone
 * It's responsible for creating, editing and updating a depot
 * @param Depots
 * @param ModalService
 * @param Notify
 * @param uiGridConstants
 * @param $state
 * @param Stock
 * @param Modal
 * @param FormatTreeData
 * @param bhConstants
 */
function DepotManagementController(
  Depots, ModalService, Notify, uiGridConstants, $state, Stock, Modal,
  FormatTreeData, bhConstants,
) {
  const vm = this;

  const stockDepotFilters = Stock.filter.depot;

  // bind methods
  vm.deleteDepot = deleteDepot;
  vm.editDepot = editDepot;
  vm.managementDepot = managementDepot;
  vm.supervisionDepot = supervisionDepot;
  vm.createDepot = createDepot;
  vm.toggleFilter = toggleFilter;
  vm.onRemoveFilter = onRemoveFilter;
  vm.search = search;
  vm.bhConstants = bhConstants;

  // depot parent indent value in pixels
  vm.indentTitleSpace = 20;

  // global variables
  vm.gridApi = {};

  // options for the UI grid
  vm.gridOptions = {
    appScopeProvider  : vm,
    enableColumnMenus : false,
    showColumnFooter  : true,
    fastWatch         : true,
    flatEntityAccess  : true,
    enableSorting     : true,
    showTreeExpandNoChildren : false,
    onRegisterApi     : onRegisterApiFn,
    columnDefs : [
      {
        field : 'text',
        displayName : 'DEPOT.LABEL',
        headerCellFilter : 'translate',
        cellTemplate : '/modules/depots/templates/label.tmpl.html',
        aggregationType : uiGridConstants.aggregationTypes.count,
        aggregationHideLabel : true,
      },
      {
        field : 'location',
        displayName : 'DEPOT.LOCATION',
        headerCellFilter : 'translate',
        cellTemplate : '/modules/depots/templates/location.tmpl.html',
      },
      {
        field : 'is_warehouse',
        width : 125,
        displayName : 'DEPOT.WAREHOUSE',
        headerCellFilter : 'translate',
        cellTemplate : '/modules/depots/templates/warehouse.tmpl.html',
        enableSorting : false,
        enableFiltering : false,
      },
      {
        field : 'users',
        displayName : 'FORM.LABELS.USER',
        headerCellFilter : 'translate',
        enableSorting : false,
        enableFiltering : false,
      },
      {
        field : 'supervisors',
        displayName : 'FORM.LABELS.SUPERVISOR',
        headerCellFilter : 'translate',
        enableSorting : false,
        enableFiltering : false,
      },
      {
        field : 'action',
        width : 80,
        displayName : '',
        cellTemplate : '/modules/depots/templates/action.tmpl.html',
        enableSorting : false,
        enableFiltering : false,
      },
    ],
  };

  /**
   *
   * @param gridApi
   */
  function onRegisterApiFn(gridApi) {
    vm.gridApi = gridApi;
    gridApi.grid.registerDataChangeCallback(expandOnSetData);
  }

  /**
   *
   * @param grid
   */
  function expandOnSetData(grid) {
    if (grid.options.data.length) {
      grid.api.treeBase.expandAllRows();
    }
  }

  /**
   *
   */
  function toggleFilter() {
    vm.gridOptions.enableFiltering = !vm.gridOptions.enableFiltering;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }

  // on remove one filter
  /**
   *
   * @param key
   */
  function onRemoveFilter(key) {
    stockDepotFilters.remove(key);
    stockDepotFilters.formatCache();
    vm.latestViewFilters = stockDepotFilters.formatView();
    return load(stockDepotFilters.formatHTTP(true));
  }

  // search modal
  /**
   *
   */
  function search() {
    const filtersSnapshot = stockDepotFilters.formatHTTP();
    Modal.openSearchDepots(filtersSnapshot)
      .then(handleSearchModal);
  }

  /**
   *
   * @param changes
   */
  function handleSearchModal(changes) {
    // if there is no change , customer filters should not change
    if (!changes) { return; }

    stockDepotFilters.replaceFilters(changes);
    stockDepotFilters.formatCache();
    vm.latestViewFilters = stockDepotFilters.formatView();
    load(stockDepotFilters.formatHTTP(true));
  }

  /**
   *
   * @param filters
   */
  function load(filters = {}) {
    angular.extend(filters, { full : 1 });
    vm.loading = true;

    Depots.read(null, filters)
      .then(data => {
        // format depots tree
        const depotsData = data.map(item => {
          item.id = item.uuid;
          item.parent = item.parent_uuid;

          if (item.parent === '0') {
            item.parent = 0;
          }

          // The forms being in tree form, when you search for a repository
          // that is not root (without a parent may not be visible)
          if (filters.text || filters.is_warehouse === 0 || filters.is_warehouse === 1) {
            item.parent = 0;
          }

          item.location = item.location_uuid
            ? ''.concat(`${item.village_name} / ${item.sector_name} / ${item.province_name} `)
              .concat(`(${item.country_name})`) : '';
          return item;
        });

        vm.gridOptions.data = FormatTreeData.formatStore(depotsData);
      })
      .catch(Notify.handleError)
      .finally(() => {
        vm.loading = false;
      });
  }

  // switch to delete warning mode
  /**
   *
   * @param uuid
   */
  function deleteDepot(uuid) {
    ModalService.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then(bool => {
        if (!bool) { return; }

        Depots.delete(uuid)
          .then(() => {
            Notify.success('DEPOT.DELETED');
            load();
          })
          .catch(Notify.handleError);
      });
  }

  // update an existing depot
  /**
   *
   * @param uuid
   */
  function editDepot(uuid) {
    $state.go('depots.edit', { uuid });
  }

  // Add User for management
  /**
   *
   * @param uuid
   */
  function managementDepot(uuid) {
    $state.go('depots.management', { uuid });
  }

  // Add User for supervision
  /**
   *
   * @param uuid
   */
  function supervisionDepot(uuid) {
    $state.go('depots.supervision', { uuid });
  }

  // create a new depot
  /**
   *
   */
  function createDepot() {
    $state.go('depots.create');
  }

  // initialize module
  /**
   *
   */
  function startup() {
    if ($state.params.filters && $state.params.filters.length) {
      stockDepotFilters.replaceFiltersFromState($state.params.filters);
      stockDepotFilters.formatCache();
    }

    load(stockDepotFilters.formatHTTP(true));
    vm.latestViewFilters = stockDepotFilters.formatView();
  }

  startup();
}
