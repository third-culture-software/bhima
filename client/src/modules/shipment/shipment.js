angular.module('bhima.controllers')
  .controller('ShipmentRegistryController', ShipmentRegistryController);

ShipmentRegistryController.$inject = [
  '$state', 'ShipmentService', 'ShipmentFilter', 'ShipmentModalService', 'ModalService',
  'uiGridConstants', 'GridStateService', 'GridColumnService',
  'NotifyService', 'bhConstants', 'GridSortingService',
];

/**
 *
 * @param $state
 * @param Shipments
 * @param ShipmentFilter
 * @param ShipmentModal
 * @param Modal
 * @param GridConstants
 * @param GridState
 * @param Columns
 * @param Notify
 * @param Constants
 * @param Sorting
 */
function ShipmentRegistryController(
  $state, Shipments, ShipmentFilter, ShipmentModal, Modal,
  GridConstants, GridState, Columns,
  Notify, Constants, Sorting,
) {
  const vm = this;
  const cacheKey = 'shipment-grid';
  const shipmentFilters = new ShipmentFilter();

  // bind methods
  vm.getOverview = getOverview;
  vm.setTrackingLog = updateTrackingLogModal;

  vm.setReady = setReady;
  vm.setDelivered = setDelivered;
  vm.setComplete = setComplete;

  vm.deleteShipment = deleteShipment;
  vm.editShipment = editShipment;
  vm.createShipment = createShipment;
  vm.toggleFilter = toggleFilter;
  vm.onRemoveFilter = onRemoveFilter;
  vm.search = search;
  vm.shipmentDocument = shipmentDocument;
  vm.shipmentGoodsReceivedNote = shipmentGoodsReceivedNote;
  vm.shipmentManifest = shipmentManifest;
  vm.getShipmentBarcode = getShipmentBarcode;
  vm.gotoStockEntry = gotoStockEntry;
  vm.gotoStockExit = gotoStockExit;

  // global variables
  vm.gridApi = {};

  // registry columns
  const columnDefs = [
    {
      field : 'status',
      displayName : 'TABLE.COLUMNS.STATUS',
      headerTooltip : 'TABLE.COLUMNS.STATUS',
      headerCellFilter : 'translate',
      cellFilter : 'translate',
    },
    {
      field : 'reference',
      displayName : 'SHIPMENT.REFERENCE',
      headerTooltip : 'SHIPMENT.REFERENCE',
      headerCellFilter : 'translate',
      headerCellClass : 'wrappingColHeader',
      sortingAlgorithm : Sorting.algorithms.sortByReference,
    },
    {
      field : 'stock_reference',
      displayName : 'FORM.LABELS.REFERENCE_STOCK_MOVEMENT',
      headerTooltip : 'FORM.LABELS.REFERENCE_STOCK_MOVEMENT',
      headerCellFilter : 'translate',
      headerCellClass : 'wrappingColHeader',
    },
    {
      field : 'name',
      displayName : 'TABLE.COLUMNS.NAME',
      headerTooltip : 'TABLE.COLUMNS.NAME',
      headerCellFilter : 'translate',
    },
    {
      field : 'description',
      displayName : 'TABLE.COLUMNS.DESCRIPTION',
      headerTooltip : 'TABLE.COLUMNS.DESCRIPTION',
      headerCellFilter : 'translate',
      headerCellClass : 'wrappingColHeader',
    },
    {
      field : 'origin_depot',
      displayName : 'SHIPMENT.ORIGIN_DEPOT',
      headerTooltip : 'SHIPMENT.ORIGIN_DEPOT',
      headerCellFilter : 'translate',
      headerCellClass : 'wrappingColHeader',
    },
    {
      field : 'destination_depot',
      displayName : 'SHIPMENT.DESTINATION_DEPOT',
      headerTooltip : 'SHIPMENT.DESTINATION_DEPOT',
      headerCellFilter : 'translate',
      headerCellClass : 'wrappingColHeader',
    },
    {
      field : 'date_sent',
      displayName : 'SHIPMENT.DATE_SENT',
      headerTooltip : 'SHIPMENT.DATE_SENT',
      headerCellFilter : 'translate',
      headerCellClass : 'wrappingColHeader',
      cellFilter : 'date',
    },
    {
      field : 'date_delivered',
      displayName : 'SHIPMENT.DATE_DELIVERED',
      headerTooltip : 'SHIPMENT.DATE_DELIVERED',
      headerCellFilter : 'translate',
      headerCellClass : 'wrappingColHeader',
      cellFilter : 'date',
    },
    {
      field : 'anticipated_delivery_date',
      displayName : 'SHIPMENT.ANTICIPATED_DELIVERY_DATE',
      headerTooltip : 'SHIPMENT.ANTICIPATED_DELIVERY_DATE',
      headerCellClass : 'wrappingColHeader',
      headerCellFilter : 'translate',
      cellFilter : 'date',
    },
    {
      field : 'created_by',
      displayName : 'SHIPMENT.CREATED_BY',
      headerTooltip : 'SHIPMENT.CREATED_BY',
      headerCellFilter : 'translate',
      headerCellClass : 'wrappingColHeader',
    },
    {
      field : 'action',
      width : 80,
      displayName : '',
      cellTemplate : '/modules/shipment/templates/action.tmpl.html',
      enableSorting : false,
      enableFiltering : false,
    },
  ];

  /**
   *
   * @param gridApi
   */
  function onRegisterApi(gridApi) {
    vm.gridApi = gridApi;
  }

  // options for the UI grid
  vm.gridOptions = {
    appScopeProvider  : vm,
    enableColumnMenus : false,
    showColumnFooter  : true,
    fastWatch         : true,
    flatEntityAccess  : true,
    enableSorting     : true,
    showTreeExpandNoChildren : false,
    onRegisterApi,
    columnDefs,
  };

  const gridColumns = new Columns(vm.gridOptions, cacheKey);
  const state = new GridState(vm.gridOptions, cacheKey);

  vm.saveGridState = state.saveGridState;
  vm.openColumnConfigModal = openColumnConfigModal;
  vm.clearGridState = clearGridState;

  /**
   *
   */
  function toggleFilter() {
    vm.gridOptions.enableFiltering = !vm.gridOptions.enableFiltering;
    vm.gridApi.core.notifyDataChange(GridConstants.dataChange.COLUMN);
  }

  // on remove one filter
  /**
   *
   * @param key
   */
  function onRemoveFilter(key) {
    shipmentFilters.remove(key);
    shipmentFilters.formatCache();
    vm.latestViewFilters = shipmentFilters.formatView();
    return load(shipmentFilters.formatHTTP(true));
  }

  // search modal
  /**
   *
   */
  function search() {
    const filtersSnapshot = shipmentFilters.formatHTTP();
    ShipmentModal.openSearchShipment(filtersSnapshot)
      .then(handleSearchModal);
  }

  /**
   *
   */
  function openColumnConfigModal() {
    gridColumns.openConfigurationModal();
  }

  /**
   *
   */
  function clearGridState() {
    state.clearGridState();
    $state.reload();
  }

  /**
   *
   * @param uuid
   */
  function shipmentDocument(uuid) {
    return ShipmentModal.openShipmentDocument(uuid);
  }

  /**
   *
   * @param uuid
   */
  function shipmentGoodsReceivedNote(uuid) {
    return ShipmentModal.openShipmentGoodsReceivedNote(uuid);
  }

  /**
   *
   * @param uuid
   */
  function shipmentManifest(uuid) {
    return ShipmentModal.openShipmentManifest(uuid);
  }

  /**
   *
   * @param uuid
   */
  function getOverview(uuid) {
    return ShipmentModal.shipmentDocumentModal(uuid);
  }

  /**
   *
   * @param uuid
   */
  function setReady(uuid) {
    return ShipmentModal.setReadyForShipmentModal(uuid);
  }

  /**
   *
   * @param uuid
   */
  function setDelivered(uuid) {
    ShipmentModal.setShipmentDeliveredModal(uuid);
  }

  /**
   *
   * @param uuid
   */
  function setComplete(uuid) {
    return ShipmentModal.setShipmentCompletedModal(uuid);
  }

  /**
   *
   * @param uuid
   */
  function updateTrackingLogModal(uuid) {
    return ShipmentModal.updateTrackingLogModal(uuid);
  }

  /**
   *
   * @param uuid
   */
  function getShipmentBarcode(uuid) {
    return ShipmentModal.openShipmentBarcode(uuid);
  }

  /**
   *
   * @param changes
   */
  function handleSearchModal(changes) {
    // if there is no change , customer filters should not change
    if (!changes) { return; }

    shipmentFilters.replaceFilters(changes);
    shipmentFilters.formatCache();
    vm.latestViewFilters = shipmentFilters.formatView();
    load(shipmentFilters.formatHTTP(true));
  }

  /**
   *
   * @param filters
   */
  function load(filters = {}) {
    vm.loading = true;

    Shipments.read(null, filters)
      .then(data => {
        vm.gridOptions.data = data.map(item => {
          item.isEmpty = item.status_id === Constants.shipmentStatus.EMPTY;
          item.isAtDepot = item.status_id === Constants.shipmentStatus.AT_DEPOT;
          item.isReady = item.status_id === Constants.shipmentStatus.READY_FOR_SHIPMENT;
          item.inTransit = item.status_id === Constants.shipmentStatus.IN_TRANSIT;
          item.isPartial = item.status_id === Constants.shipmentStatus.PARTIAL;
          item.isDelivered = item.status_id === Constants.shipmentStatus.DELIVERED;
          item.isComplete = item.status_id === Constants.shipmentStatus.COMPLETE;
          return item;
        });
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
  function deleteShipment(uuid) {
    Modal.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then(bool => {
        if (!bool) { return; }

        Shipments.delete(uuid)
          .then(() => {
            Notify.success('SHIPMENT.DELETED');
            load();
          })
          .catch(Notify.handleError);
      });
  }

  // update an existing shipment
  /**
   *
   * @param uuid
   */
  function editShipment(uuid) {
    $state.go('shipments.edit', { uuid });
  }

  // create a new shipment
  /**
   *
   */
  function createShipment() {
    $state.go('shipments.create');
  }

  /**
   *
   * @param shipmentUuid
   */
  function gotoStockEntry(shipmentUuid) {
    $state.go('stockEntry', { shipment : shipmentUuid });
  }

  /**
   *
   * @param shipmentUuid
   */
  function gotoStockExit(shipmentUuid) {
    $state.go('stockExit', { shipment : shipmentUuid });
  }

  // initialize module
  /**
   *
   */
  function startup() {
    if ($state.params.filters && $state.params.filters.length) {
      shipmentFilters.replaceFiltersFromState($state.params.filters);
      shipmentFilters.formatCache();
    }

    load(shipmentFilters.formatHTTP(true));
    vm.latestViewFilters = shipmentFilters.formatView();
  }

  vm.exportTo = (renderer) => {
    return Shipments.exportTo(renderer, shipmentFilters);
  };

  vm.downloadExcel = () => {
    return Shipments.downloadExcel(shipmentFilters, gridColumns);
  };

  startup();
}
