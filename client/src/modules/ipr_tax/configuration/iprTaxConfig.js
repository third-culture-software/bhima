angular.module('bhima.controllers')
  .controller('IprTaxConfigurationController', IprTaxConfigurationController);

IprTaxConfigurationController.$inject = [
  'IprTaxService', 'ModalService', 'NotifyService', 'uiGridConstants', '$state',
];

/**
 * IprTax Configuration Controller
 *
 * This controller is about the IprTax configuration module in the payroll modules.
 * It's responsible for creating, editing and deleteing IprTax configurations.
 */
function IprTaxConfigurationController(IprTaxes, ModalService, Notify, uiGridConstants, $state) {
  const vm = this;

  // bind methods
  vm.deleteIprTax = deleteIprTax;
  vm.editIprTaxConfig = editIprTaxConfig;
  vm.toggleFilter = toggleFilter;
  vm.iprScaleSelect = iprScaleSelect;

  // global variables
  vm.gridApi = {};
  vm.filterEnabled = false;

  const gridColumn = [{
    field : 'rate',
    displayName : 'FORM.LABELS.RATE',
    headerCellFilter : 'translate',
    width : 60,
    cellFilter : 'percentage',
  }, {
    field : 'tranche_annuelle_debut',
    displayName : 'FORM.LABELS.ANNUAL_TRANCH_FROM',
    headerCellFilter : 'translate',
    width : 170,
    cellFilter : 'currency:row.entity.currency_id',
  }, {
    field : 'tranche_annuelle_fin',
    displayName : 'FORM.LABELS.ANNUAL_TRANCH_TO',
    headerCellFilter : 'translate',
    width : 170,
    cellFilter : 'currency:row.entity.currency_id',
  }, {
    field : 'tranche_mensuelle_debut',
    displayName : 'FORM.LABELS.MONTH_TRANCH_FROM',
    headerCellFilter : 'translate',
    width : 170,
    cellFilter : 'currency:row.entity.currency_id',
  }, {
    field : 'tranche_mensuelle_fin',
    displayName : 'FORM.LABELS.MONTH_TRANCH_TO',
    headerCellFilter : 'translate',
    width : 170,
    cellFilter : 'currency:row.entity.currency_id',
  }, {
    field : 'ecart_annuel',
    displayName : 'FORM.LABELS.ANNUAL_ECART',
    headerCellFilter : 'translate',
    cellFilter : 'currency:row.entity.currency_id',
  }, {
    field : 'ecart_mensuel',
    displayName : 'FORM.LABELS.MONTH_ECART',
    headerCellFilter : 'translate',
    cellFilter : 'currency:row.entity.currency_id',
  }, {
    field : 'impot_annuel',
    displayName : 'FORM.LABELS.ANNUAL_IMPOT',
    headerCellFilter : 'translate',
    cellFilter : 'currency:row.entity.currency_id',
  }, {
    field : 'impot_mensuel',
    displayName : 'FORM.LABELS.MONTH_IMPOT',
    headerCellFilter : 'translate',
    cellFilter : 'currency:row.entity.currency_id',
  }, {
    field : 'cumul_annuel',
    displayName : 'FORM.LABELS.ANNUAL_CUMUL',
    headerCellFilter : 'translate',
    cellFilter : 'currency:row.entity.currency_id',
  }, {
    field : 'cumul_mensuel',
    displayName : 'FORM.LABELS.MONTH_CUMUL',
    headerCellFilter : 'translate',
    cellFilter : 'currency:row.entity.currency_id',
  }, {
    field : 'action',
    width : 80,
    displayName : '',
    cellTemplate : '/modules/ipr_tax/templates/actionConfig.tmpl.html',
    enableSorting : false,
    enableFiltering : false,
  }];

  // options for the UI grid
  vm.gridOptions = {
    appScopeProvider  : vm,
    enableColumnMenus : false,
    fastWatch         : true,
    flatEntityAccess  : true,
    enableSorting     : true,
    onRegisterApi     : onRegisterApiFn,
    columnDefs : gridColumn,
  };

  function onRegisterApiFn(gridApi) {
    vm.gridApi = gridApi;
  }

  function toggleFilter() {
    vm.filterEnabled = !vm.filterEnabled;
    vm.gridOptions.enableFiltering = vm.filterEnabled;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }

  function iprScaleSelect(scaleId) {
    vm.taxIprId = scaleId;

    // If taxIPrId is not defined, we can't load the taxes
    // The user should select the year from the top of the grid to select
    // the data to load.
    // TODO(@jniles) - can we just reuse past IPR configurations?  Do they change often
    // enough to merit the user having to recreate it every year?
    if (vm.taxIprId) {
      loadIprTaxes();
    }
  }

  function loadIprTaxes() {
    vm.loading = true;

    IprTaxes.Config.read(null, { taxe_ipr_id : vm.taxIprId })
      .then((data) => {
        vm.gridOptions.data = data;
      })
      .catch(Notify.handleError)
      .finally(() => {
        vm.loading = false;
      });
  }

  // switch to delete warning mode
  function deleteIprTax(title) {
    ModalService.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then((bool) => {
        if (!bool) { return; }

        IprTaxes.Config.delete(title.id)
          .then(() => {
            Notify.success('FORM.INFO.DELETE_SUCCESS');
            loadIprTaxes();
          })
          .catch(Notify.handleError);
      });
  }

  // update an existing IprTaxConfig
  function editIprTaxConfig(ipr) {
    $state.go('iprConfiguration.editConfig', { taxIprId : vm.taxIprId, id : ipr.id });
  }

  iprScaleSelect();
}
