angular.module('bhima.controllers')
  .controller('StaffingIndiceController', StaffingIndiceController);

StaffingIndiceController.$inject = [
  '$state', '$uibModal', 'StaffingIndiceService', 'SessionService', 'ModalService',
  'NotifyService', 'bhConstants', 'uiGridConstants',
  'LanguageService', '$httpParamSerializer', 'GridColumnService', 'RubricService',
];

/**
 *
 * @param $state
 * @param $uibModal
 * @param StaffingIndice
 * @param Session
 * @param Modal
 * @param Notify
 * @param bhConstants
 * @param uiGridConstants
 * @param Languages
 * @param $httpParamSerializer
 * @param Columns
 * @param Rubrics
 */
function StaffingIndiceController($state, $uibModal, StaffingIndice,
  Session, Modal, Notify, bhConstants, uiGridConstants, Languages, $httpParamSerializer, Columns, Rubrics) {
  const vm = this;

  /**
   *
   */
  function init() {
    // open search modal
    const {
      filters,
    } = $state.params;
    if (filters.length > 0) {
      StaffingIndice.filters.replaceFilters(filters);
      StaffingIndice.cacheFilters();
      $state.params.filters = [];
    } else {
      StaffingIndice.loadCachedFilters();
    }

    Rubrics.read(null, { is_linked_to_grade : 1 })
      .then(data => {
        vm.rubricsGrade = data;
      })
      .catch(Notify.handleError)
      .finally(() => {
        vm.loading = false;
      });

    vm.latestViewFilters = StaffingIndice.filters.formatView();
    const params = StaffingIndice.filters.formatHTTP(true);
    loadIndexes(params || {});
  }

  vm.openSearchModal = function openSearchModal() {
    const filtersSnapshot = StaffingIndice.filters.formatHTTP();

    StaffingIndice.openSearchModal(filtersSnapshot)
      .then((changes) => {
        if (!changes) { return; }

        StaffingIndice.filters.replaceFilters(changes);
        StaffingIndice.cacheFilters();
        vm.latestViewFilters = StaffingIndice.filters.formatView();
        loadIndexes(StaffingIndice.filters.formatHTTP(true));
      })
      .catch(angular.noop);
  };

  // remove a filter with from the filter object, save the filters and reload
  vm.onRemoveFilter = (key) => {
    StaffingIndice.removeFilter(key);
    StaffingIndice.cacheFilters();
    vm.latestViewFilters = StaffingIndice.filters.formatView();
    return loadIndexes(StaffingIndice.filters.formatHTTP(true));
  };

  vm.remove = function remove(uuid) {
    const message = 'FORM.DIALOGS.CONFIRM_DELETE';
    Modal.confirm(message)
      .then(confirmResponse => {
        if (!confirmResponse) {
          return;
        }

        StaffingIndice.delete(uuid)
          .then(() => {
            Notify.success('FORM.INFO.DELETE_SUCCESS');
            loadIndexes();
          })
          .catch(Notify.handleError);
      });
  };

  /**
   *
   * @param params
   */
  function loadIndexes(params) {
    vm.loading = true;
    StaffingIndice.read(null, params)
      .then(indexes => {
        vm.gridOptions.data = indexes;
      })
      .catch(Notify.handleError)
      .finally(() => {
        vm.loading = false;
      });
  }

  const columns = [
    {
      field : 'created_at',
      displayName : 'TABLE.COLUMNS.DATE',
      headerCellFilter : 'translate',
      cellFilter : 'date:"'.concat(bhConstants.dates.format, '"'),
    },
    {
      field : 'display_name',
      displayName : 'FORM.LABELS.EMPLOYEE_NAME',
      headerCellFilter : 'translate',
      aggregationType : uiGridConstants.aggregationTypes.count,
      aggregationHideLabel : true,
      footerCellClass : 'text-center',
    },
    {
      field : 'text',
      displayName : 'FORM.LABELS.LEVEL_OF_STUDY',
      headerCellFilter : 'translate',
    },
    {
      field : 'fonction_txt',
      displayName : 'FORM.LABELS.RESPONSABILITY',
      headerCellFilter : 'translate',
    },
    {
      field : 'grade_indice',
      displayName : 'FORM.LABELS.ENROLLMENT_BONUS',
      headerCellFilter : 'translate',
      cellClass : 'text-right',
      type : 'number',
    },
    {
      field : 'function_indice',
      displayName : 'FORM.LABELS.FUNCTION_BONUS',
      headerCellFilter : 'translate',
      cellClass : 'text-right',
      type : 'number',
    },
    {
      field : 'actions',
      enableFiltering : false,
      width : 100,
      displayName : '',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/payroll/staffing_indice/templates/action.cell.html?ks=ok',
    }];

  // ng-click="
  vm.gridOptions = {
    appScopeProvider : vm,
    enableColumnMenus : false,
    showColumnFooter  : true,
    columnDefs : columns,
    enableSorting : true,
    data : [],
    fastWatch : true,
    flatEntityAccess : true,
    onRegisterApi : (gridApi) => {
      vm.gridApi = gridApi;
    },
  };

  const columnConfig = new Columns(vm.gridOptions, 'stafing-indices');
  /**
   * @function toggleInlineFilter
   * @description
   * Switches the inline filter on and off.
   */
  vm.toggleInlineFilter = () => {
    vm.gridOptions.enableFiltering = !vm.gridOptions.enableFiltering;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  };

  vm.createUpdateModal = (index = {}) => {
    $uibModal.open({
      templateUrl : 'modules/payroll/staffing_indice/modal/createUpdate.html',
      controller : 'StaffingIndiceModalController as $ctrl',
      resolve : { data : () => index },
    }).result.then(change => {
      if (change) loadIndexes();
    });
  };

  vm.openGradeIndiceModal = () => {
    $uibModal.open({
      templateUrl : 'modules/payroll/staffing_indice/modal/gradeIndiceModal.html',
      controller : 'GradeIndiceModalController as $ctrl',
    });
  };

  vm.openFunctionIndiceModal = () => {
    $uibModal.open({
      templateUrl : 'modules/payroll/staffing_indice/modal/funcitonIndiceModal.html',
      controller : 'FunctionIndiceModalController as $ctrl',
    });
  };

  vm.openSetRubricsGradeModal = (id) => {
    $uibModal.open({
      templateUrl : 'modules/payroll/staffing_indice/modal/gradeRubricsModal.html',
      controller : 'GradeRubricsModalController as $ctrl',
      resolve : { data : () => id },
    });
  };

  vm.downloadExcel = () => {
    const displayNames = columnConfig.getDisplayNames();
    const filterOpts = StaffingIndice.filters.formatHTTP();
    const defaultOpts = {
      renderer : 'xlsx',
      lang : Languages.key,
      ignoredColumns : ['grade_uuid', 'code', 'fonction_id'],
      renameKeys : true,
      rowsDataKey : 'indices',
      displayNames,
    };
    // combine options
    const options = angular.merge(defaultOpts, filterOpts);
    // return  serialized options
    return $httpParamSerializer(options);
  };

  vm.downloadPdf = () => {
    const filterOpts = StaffingIndice.filters.formatHTTP();
    const defaultOpts = {
      renderer : 'pdf',
      lang : Languages.key,
    };
    // combine options
    const options = angular.merge(defaultOpts, filterOpts);
    // return  serialized options
    return $httpParamSerializer(options);
  };

  init();
}
