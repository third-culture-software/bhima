angular.module('bhima.controllers')
  .controller('JournalLogController', JournalLogController);

JournalLogController.$inject = [
  'JournalLogService', 'NotifyService', '$state', 'bhConstants',
  'LanguageService', 'uiGridConstants', 'GridExportService',
  '$httpParamSerializer', 'GridColumnService', 'LanguageService',
  '$timeout',
];

/**
 *
 * @param Journal
 * @param Notify
 * @param $state
 * @param bhConstants
 * @param Language
 * @param uiGridConstants
 * @param GridExport
 * @param $httpParamSerializer
 * @param Columns
 * @param Languages
 * @param $timeout
 */
function JournalLogController(
  Journal, Notify, $state, bhConstants, Language, uiGridConstants,
  GridExport, $httpParamSerializer, Columns, Languages, $timeout,
) {
  const vm = this;

  vm.languageKey = Language.key;
  vm.rowsDetails = { totalDeleted : 0, totalEdited : 0 };
  vm.onRemoveFilter = onRemoveFilter;
  vm.openSearchModal = openSearchModal;
  vm.toggleFilter = toggleFilter;

  /**
   *
   * @param api
   */
  function onRegisterApi(api) {
    vm.gridApi = api;
  }

  const columnDefs = [{
    field : 'timestamp',
    displayName : 'TABLE.COLUMNS.DATE',
    headerCellFilter : 'translate',
    cellFilter : 'date:"'.concat(bhConstants.dates.formatLong, '"'),
    footerCellTemplate : '<i></i>',
    width : 150,
  }, {
    field : 'action',
    displayName : 'TABLE.COLUMNS.ACTION',
    headerCellFilter : 'translate',
    cellTemplate : 'modules/journal/templates/log.action.html',
    width : 110,
  }, {
    field : 'hrRecord',
    displayName : 'TABLE.COLUMNS.RECORD',
    headerCellFilter : 'translate',
    cellTemplate : 'modules/journal/templates/log.record.html',
    width : 110,
  }, {
    field : 'description',
    displayName : 'TABLE.COLUMNS.DESCRIPTION',
    headerCellFilter : 'translate',
  }, {
    field : 'transId',
    displayName : 'TABLE.COLUMNS.TRANSACTION',
    headerCellFilter : 'translate',
    cellTemplate : 'modules/journal/templates/log.transaction.html',
    width : 110,
  }, {
    field : 'display_name',
    displayName : 'TABLE.COLUMNS.USER',
    headerCellFilter : 'translate',
    width : 200,
  }];

  vm.gridOptions = {
    enableColumnMenus : false,
    showColumnFooter : false,
    appScopeProvider : vm,
    flatEntityAccess : true,
    showGridFooter : true,
    onRegisterApi,
    columnDefs,
    gridFooterTemplate : '/modules/journal/templates/log.footer.html',
  };

  const columnConfig = new Columns(vm.gridOptions, 'journal-log');
  const exportation = new GridExport(vm.gridOptions, 'selected', 'visible');

  /**
   *
   * @param filters
   */
  function load(filters) {
    Journal.read(null, filters)
      .then(rows => {
        vm.rowsDetails.totalDeleted = 0;
        vm.rowsDetails.totalEdited = 0;
        vm.gridOptions.data = rows.map(row => {
          if (row.value) {
            const line = Array.isArray(row.value) && row.value.length ? row.value[0] : row.value;
            row.hrRecord = line.hrRecord;
            row.transId = line.trans_id;
            row.description = line.description;

            if (row.action === 'deleted') {
              vm.rowsDetails.totalDeleted++;
            }

            if (row.action === 'edit') {
              vm.rowsDetails.totalEdited++;
            }
          }
          return row;
        });
      })
      .catch(Notify.handleError);
  }

  /**
   *
   */
  function toggleFilter() {
    vm.gridOptions.enableFiltering = !vm.gridOptions.enableFiltering;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }

  /**
   *
   */
  function openSearchModal() {
    const filtersSnapshot = Journal.filters.formatHTTP();
    Journal.openSearchModal(filtersSnapshot)
      .then((changes) => {
        if (!changes) { return null; }
        Journal.filters.replaceFilters(changes);
        Journal.cacheFilters();
        vm.latestViewFilters = Journal.filters.formatView();
        return load(Journal.filters.formatHTTP(true));
      })
      .catch(angular.noop);
  }

  /**
   *
   * @param key
   */
  function onRemoveFilter(key) {
    Journal.removeFilter(key);
    Journal.cacheFilters();
    vm.latestViewFilters = Journal.filters.formatView();
    return load(Journal.filters.formatHTTP(true));
  }

  /**
   *
   */
  function startup() {
    const { filters } = $state.params;

    if (filters.length > 0) {
      Journal.filters.replaceFiltersFromState(filters);
    } else {
      Journal.loadCachedFilters();
    }

    load(Journal.filters.formatHTTP(true));
    vm.latestViewFilters = Journal.filters.formatView();
  }

  vm.exportFile = function exportFile() {
    exportation.run();
  };

  vm.setStartDownload = () => {
    vm.startDownload = true;
    $timeout(() => {
      vm.startDownload = false;
    }, 5000);
  };

  vm.downloadExcel = () => {
    if (!vm.startDownload) { return '#'; }

    const url = '/reports/finance/journal/log?';
    const displayNames = columnConfig.getDisplayNames();
    const filterOpts = Journal.filters.formatHTTP();
    const defaultOpts = {
      renderer : 'xlsx',
      lang : Languages.key,
      renameKeys : true,
      displayNames,
    };
    // combine options
    const options = { ...defaultOpts, ...filterOpts };
    // do not send multiple request to the server for nothing
    return url.concat($httpParamSerializer(options));
  };

  startup();
}
