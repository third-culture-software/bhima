angular.module('bhima.controllers')
  .controller('StockConsumptionLotsModalController', StockConsumptionLotsModalController);

StockConsumptionLotsModalController.$inject = [
  'appcache', '$uibModalInstance', 'uiGridConstants', 'data',
  'SessionService', 'bhConstants', 'AggregateConsumptionModalForm',
];

function StockConsumptionLotsModalController(
  AppCache, Instance, uiGridConstants, Data, Session, bhConstants, AggregateForm,
) {
  const vm = this;

  const cache = new AppCache('ConsumptionLotsModal');
  // initialize the form instance
  vm.form = new AggregateForm({
    max_quantity_consumed : Data.stockLine.quantity_consumed,
    max_quantity_lost : Data.stockLine.quantity_lost,
    unit_cost : Data.stockLine.unit_cost,
    lot : Data.stockLine.label,
    end_date : Data.stockLine.end_date,
    start_date : Data.stockLine.start_date,
    rows : Data.stockLine.detailed,
  });

  vm.hasMissingLotIdentifier = false;
  vm.hasInvalidLotExpiration = false;
  vm.hasInvalidLotQuantity = false;

  vm.enterprise = Session.enterprise;
  vm.stockLine = angular.copy(Data.stockLine);

  vm.entryType = Data.entry_type;
  vm.isTransfer = (vm.entryType === 'transfer_reception');

  // exposing method to the view
  vm.submit = submit;
  vm.cancel = cancel;

  vm.onChanges = onChanges;
  vm.onChangeQuantity = onChangeQuantity;
  vm.onChangeUnitCost = onChangeUnitCost;
  vm.onDateChange = onDateChange;

  vm.isCostEditable = (vm.entryType !== 'transfer_reception');

  const cols = [{
    field : 'status',
    width : 25,
    displayName : '',
    cellTemplate : 'modules/stock/entry/modals/templates/lot.status.tmpl.html',
  }, {
    field : 'start_date',
    type : 'date',
    cellFilter : `date:"${bhConstants.dates.format}"`,
    width : 200,
    displayName : 'STOCK.AGGREGATED_STOCK_CONSUMPTION.START_OF_CONSUMPTION',
    headerCellFilter : 'translate',
    cellTemplate : 'modules/stock/aggregated_consumption/templates/lot_movement_start_date.tmpl.html',
  }, {
    field : 'end_date',
    type : 'date',
    cellFilter : `date:"${bhConstants.dates.format}"`,
    width : 200,
    displayName : 'STOCK.AGGREGATED_STOCK_CONSUMPTION.END_OF_CONSUMPTION',
    headerCellFilter : 'translate',
    cellTemplate : 'modules/stock/aggregated_consumption/templates/lot_movement_date.tmpl.html',
  }, {
    field : 'quantity_consumed',
    type : 'number',
    displayName : 'STOCK.QUANTITY_CONSUMED',
    headerCellFilter : 'translate',
    aggregationType : uiGridConstants.aggregationTypes.sum,
    aggregationHideLabel : true,
    footerCellClass : 'text-right',
    cellTemplate : 'modules/stock/aggregated_consumption/templates/consumed.tmpl.html',
  }, {
    field : 'quantity_lost',
    type : 'number',
    displayName : 'STOCK.QUANTITY_LOST',
    headerCellFilter : 'translate',
    aggregationType : uiGridConstants.aggregationTypes.sum,
    aggregationHideLabel : true,
    footerCellClass : 'text-right',
    cellTemplate : 'modules/stock/aggregated_consumption/templates/lost.tmpl.html',
  }, {
    width : 75,
    field : 'actions',
    cellTemplate : 'modules/stock/entry/modals/templates/lot.actions.tmpl.html',
  }];

  vm.gridOptions = {
    appScopeProvider : vm,
    enableSorting : false,
    enableColumnMenus : false,
    showColumnFooter : true,
    fastWatch : true,
    flatEntityAccess : true,
    data : vm.form.rows,
    columnDefs : cols,
    onRegisterApi,
  };

  function init() {
    if (vm.form.rows.length) { return; }

    vm.form.addItem();
  }

  function onRegisterApi(api) {
    vm.gridApi = api;
  }

  function onChanges() {
    vm.errors = vm.form.validate();
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.EDIT);
  }

  // validate only if there are rows
  function onChangeQuantity() {
    vm.form.setMaxQuantityConsumed(vm.stockLine.quantity_consumed);
    vm.form.setMaxQuantityLost(vm.stockLine.quantity_lost);
    if (!vm.form.rows.length) { return; }
    onChanges();
  }

  function onChangeUnitCost() {
    vm.form.setUnitCost(vm.stockLine.unit_cost);
    onChanges();
  }

  function onDateChange(date, row, property) {
    if (date) {
      row[property] = date;
      onChanges();
    }
  }

  function cancel() {
    saveSetting();
    Instance.close();
  }

  function submit(form) {
    vm.errors = vm.form.validate();
    // unfortunately, a negative number will not trigger the onChange() function
    // on the quantity, since the "min" property is set on the input.  So, we
    // need to through a generic error here.
    if (form.$invalid) {
      return;
    }

    if (vm.errors.length === 0) {
      saveSetting();

      Instance.close({
        lots : vm.form.rows,
        unit_cost : vm.stockLine.unit_cost,
      });
    }
  }

  function saveSetting() {
    // save the cache setting
    cache.enableFastInsert = vm.enableFastInsert;
  }

  init();
}
