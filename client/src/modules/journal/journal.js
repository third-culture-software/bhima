angular.module('bhima.controllers')
  .controller('JournalController', JournalController);

JournalController.$inject = [
  'JournalService', 'GridSortingService', 'GridGroupingService', 'GridFilteringService', 'GridColumnService',
  'SessionService', 'NotifyService', 'bhConstants', '$state', 'uiGridConstants', 'ModalService', 'LanguageService',
  'AppCache', 'Store', 'uiGridGroupingConstants', 'ExportService', '$filter', 'GridExportService',
  'GridStateService', 'GridSelectionService', 'TrialBalanceService', '$httpParamSerializer', 'TransactionService',
  'util',
];

/**
 * @param Journal
 * @param Sorting
 * @param Grouping
 * @param Filtering
 * @param Columns
 * @param Session
 * @param Notify
 * @param bhConstants
 * @param $state
 * @param uiGridConstants
 * @param Modal
 * @param Languages
 * @param AppCache
 * @param Store
 * @param uiGridGroupingConstants
 * @param Export
 * @param $filter
 * @param GridExport
 * @param GridState
 * @param GridSelection
 * @param TrialBalance
 * @param $httpParamSerializer
 * @param Transactions
 * @param util
 * @module JournalController
 * @description
 * This controller is responsible for initialising the core client side posting
 * journal, binding the UI Grid component with services that facilitate all
 * operations required by an accountant.
 * - Displaying transactions in an easy to find and review format
 *   - Search for transactions
 *   - Filter transactions
 *   - Group by transactions to show aggregates
 *   - Sort transactions
 *   - Show or hide columns
 *
 * - (Super user) Edit and update transactions
 * - Post one or more transactions to the general ledger to confirm they are complete
 *   - Tun trial balance validation on transactions
 * @todo Propose utility bar view design
 */
function JournalController(
  Journal, Sorting, Grouping, Filtering, Columns, Session, Notify, bhConstants,
  $state, uiGridConstants, Modal, Languages, AppCache, Store, uiGridGroupingConstants,
  Export, $filter, GridExport, GridState, GridSelection, TrialBalance,
  $httpParamSerializer, Transactions, util,
) {
  // store journal data
  const journalStore = new Store({
    identifier : 'uuid',
  });

  let transactionIdToRecordUuidMap;

  /** @constant the cache alias for this controller */
  const cacheKey = 'Journal';

  // top level cache
  const cache = AppCache(cacheKey.concat('-module'));
  const vm = this;

  vm.bhConstants = bhConstants;

  vm.format = util.formatDate;

  // number of all of the transactions in the system
  Journal.count()
    .then(data => {
      vm.numberTotalSystemTransactions = data[0].number_transactions;
    })
    .catch(Notify.handleError);

  vm.enterprise = Session.enterprise;
  vm.languages = Languages;
  vm.gridApi = {};
  vm.canUnpostTransactions = false;

  // gridOptions is bound to the UI Grid and used to configure many of the
  // options, it is also used by the grid to expose the API
  // FIXME(@jniles) - why does this not have fastWatch?
  vm.gridOptions = {
    enableColumnMenus : false,
    showColumnFooter : true,
    appScopeProvider : vm,
    flatEntityAccess : true,
    enableGroupHeaderSelection : true,
    enableRowHeaderSelection : true,
    onRegisterApi : function onRegisterApi(api) {
      vm.gridApi = api;
    },
  };

  // comment selected rows
  vm.commentRows = function commentRows() {
    const rows = vm.gridApi.selection.getSelectedGridRows();

    Transactions.openCommentModal({ rows })
      .then((comment) => {
        updateGridComment(rows, comment);
        Notify.success('ACCOUNT_STATEMENT.SUCCESSFULLY_COMMENTED');
      })
      .catch(Notify.handleError);
  };

  // update local rows
  /**
   *
   * @param rows
   * @param comment
   */
  function updateGridComment(rows, comment) {
    rows.forEach(row => {
      row.entity.comment = comment;
    });
  }

  vm.grouped = angular.isDefined(cache.grouped) ? cache.grouped : false;

  // Initialise each of the journal utilities, providing them access to the journal
  // configuration options

  const sorting = new Sorting();

  const filtering = new Filtering(vm.gridOptions, cacheKey);
  const grouping = new Grouping(vm.gridOptions, true, 'trans_id', vm.grouped, false);
  const columnConfig = new Columns(vm.gridOptions, cacheKey);
  const exportation = new GridExport(vm.gridOptions, 'selected', 'visible');
  const state = new GridState(vm.gridOptions, cacheKey);
  const selection = new GridSelection(vm.gridOptions);

  // attaching the filtering object to the view
  vm.filtering = filtering;

  // attaching the grouping object to the view
  vm.grouping = grouping;

  vm.selection = selection;

  vm.onRemoveFilter = onRemoveFilter;

  /**
   * @function toggleLoadingIndicator
   * @description
   * Toggles the grid's loading indicator to eliminate the flash when rendering
   * transactions and allow a better UX for slow loads.
   */
  function toggleLoadingIndicator() {
    vm.loading = !vm.loading;
  }

  vm.saveGridState = state.saveGridState;
  vm.clearGridState = function clearGridState() {
    state.clearGridState();
    $state.reload();
  };

  const currencyCellTemplate = `
    <div class="ui-grid-cell-contents text-right">
      <span ng-hide="row.groupHeader">{{ COL_FIELD | currency: row.entity.currency_id }}</span>
      <span ng-show="row.groupHeader">{{ COL_FIELD | currency: row.treeNode.children[0].row.entity.currency_id }}</span>
    </div>`;

  const exchangeRateCellTemplate = `
    <div class="ui-grid-cell-contents text-right">
      <span ng-if="COL_FIELD">{{ COL_FIELD | currency: appScope.enterprise.currency_id }}</span>
    </div>`;

  /**
   * Column definitions; specify the configuration and behaviour for each column
   * in the journal grid. Initialise each of the journal utilities,
   * providing them access to the journal
   * configuration options :
   *    sorting = new Sorting();
   *    grouping = new Grouping(vm.gridOptions);
   *    filtering  = new Filtering(vm.gridOptions);
   *
   * Note:
   *   1. Setting the grouping priority without sorting by the same column will
   *      cause unexpected behaviour (splitting up of groups) when sorting
   *      other columns. This can be avoided by setting default sort and group.
   */
  const columns = [{
    field : 'uuid',
    displayName : 'TABLE.COLUMNS.ID',
    headerCellFilter : 'translate',
    visible : false,
  }, {
    field : 'project_name',
    displayName : 'TABLE.COLUMNS.PROJECT',
    headerCellFilter : 'translate',
    visible : false,
    enableCellEdit : false,
  },
  {
    field : 'trans_id',
    displayName : 'TABLE.COLUMNS.TRANSACTION',
    headerCellFilter : 'translate',
    sortingAlgorithm : sorting.transactionIds,
    width : 110,
    cellTemplate : 'modules/journal/templates/transaction-id.cell.html',
  }, {
    field : 'trans_date',
    displayName : 'TABLE.COLUMNS.DATE',
    headerCellFilter : 'translate',
    cellTemplate : 'modules/journal/templates/date.cell.html',
    cellFilter : 'date:"'.concat(bhConstants.dates.format, '"'),
    filter : {
      condition : filtering.filterByDate,
    },
    treeAggregationType : uiGridGroupingConstants.aggregation.MIN,
    customTreeAggregationFinalizerFn : (aggregation) => {
      aggregation.rendered = $filter('date')(aggregation.value, bhConstants.dates.format);
    },
    sort : {
      priority : 0,
      direction : uiGridConstants.DESC,
    },
    footerCellTemplate : '<i></i>',
  }, {
    field : 'hrRecord',
    displayName : 'TABLE.COLUMNS.RECORD',
    headerCellFilter : 'translate',
    visible : true,
    cellTemplate : '/modules/journal/templates/record.cell.html',
    treeAggregationType : uiGridGroupingConstants.aggregation.MIN,
    treeAggregationLabel : '',
    footerCellTemplate : '<i></i>',
  }, {
    field : 'description',
    displayName : 'TABLE.COLUMNS.DESCRIPTION',
    headerCellFilter : 'translate',
  }, {
    field : 'account_number',
    displayName : 'TABLE.COLUMNS.ACCOUNT',
    cellTemplate : '/modules/journal/templates/account.cell.html',
    headerCellFilter : 'translate',
  }, {
    field : 'debit_equiv',
    type : 'number',
    displayName : 'TABLE.COLUMNS.DEBIT',
    headerCellFilter : 'translate',
    cellClass : 'text-right',
    footerCellClass : 'text-right',
    cellFilter : 'number: 2',
    footerCellFilter : 'number:2',
    treeAggregationType : uiGridGroupingConstants.aggregation.SUM,
    customTreeAggregationFinalizerFn : (aggregation) => {
      aggregation.rendered = aggregation.value;
    },
    enableFiltering : true,
  }, {
    field : 'credit_equiv',
    type : 'number',
    displayName : 'TABLE.COLUMNS.CREDIT',
    headerCellFilter : 'translate',
    cellClass : 'text-right',
    footerCellClass : 'text-right',
    cellFilter : 'number: 2',
    footerCellFilter : 'number:2',
    treeAggregationType : uiGridGroupingConstants.aggregation.SUM,
    customTreeAggregationFinalizerFn : (aggregation) => {
      aggregation.rendered = aggregation.value;
    },
    enableFiltering : true,
  }, {
    field : 'currencyName',
    displayName : 'TABLE.COLUMNS.CURRENCY',
    headerCellFilter : 'translate',
    visible : false,
  }, {
    field : 'debit',
    type : 'number',
    displayName : 'TABLE.COLUMNS.DEBIT_SOURCE',
    headerCellFilter : 'translate',
    cellTemplate : currencyCellTemplate,
    cellFilter : 'number: 2',
    footerCellFilter : 'number:2',
    treeAggregationType : uiGridGroupingConstants.aggregation.SUM,
    customTreeAggregationFinalizerFn : (aggregation) => {
      aggregation.rendered = aggregation.value;
    },
    footerCellTemplate : '<i></i>',
    visible : false,
  }, {
    field : 'credit',
    type : 'number',
    displayName : 'TABLE.COLUMNS.CREDIT_SOURCE',
    headerCellFilter : 'translate',
    cellTemplate : currencyCellTemplate,
    cellFilter : 'number: 2',
    footerCellFilter : 'number:2',
    treeAggregationType : uiGridGroupingConstants.aggregation.SUM,
    customTreeAggregationFinalizerFn : (aggregation) => {
      aggregation.rendered = aggregation.value;
    },
    footerCellTemplate : '<i></i>',
    visible : false,
  }, {
    field : 'hrEntity',
    displayName : 'TABLE.COLUMNS.RECIPIENT',
    headerCellFilter : 'translate',
    cellTemplate :
      `<div class="ui-grid-cell-contents">
        <bh-reference-link ng-if="row.entity.hrEntity" reference="row.entity.hrEntity" />
      </div>`,
    visible : true,
  }, {
    field : 'hrReference',
    displayName : 'TABLE.COLUMNS.REFERENCE',
    cellTemplate :
      `<div class="ui-grid-cell-contents">
        <bh-reference-link ng-if="row.entity.hrReference" reference="row.entity.hrReference" />
      </div>`,
    headerCellFilter : 'translate',
    visible : true,
  }, {
    field : 'transaction_type_text',
    displayName : 'FORM.LABELS.TRANSACTION_TYPE',
    headerCellFilter : 'translate',
    cellFilter : 'translate',
    visible : false,
  }, {
    field : 'display_name',
    displayName : 'TABLE.COLUMNS.RESPONSIBLE',
    headerCellFilter : 'translate',
    visible : false,
  }, {
    field : 'rate',
    type : 'number',
    displayName : 'FORM.LABELS.EXCHANGE_RATE',
    cellTemplate : exchangeRateCellTemplate,
    headerCellFilter : 'translate',
    visible : false,
  }, {
    field : 'costCenterLabel',
    displayName : 'FORM.LABELS.COST_CENTER',
    headerCellFilter : 'translate',
    visible : false,
  }, {
    field : 'principalCenterLabel',
    displayName : 'FORM.LABELS.PRINCIPAL_COST_CENTER',
    headerCellFilter : 'translate',
    visible : false,
  }, {
    field : 'comment',
    displayName : 'FORM.LABELS.COMMENT',
    headerCellFilter : 'translate',
    visible : false,
  }, {
    field : 'created_at',
    type : 'date',
    displayName : 'FORM.LABELS.SERVER_DATE',
    headerCellFilter : 'translate',
    cellTemplate : 'modules/journal/templates/created_at.cell.html',
    visible : false,
  }];

  vm.gridOptions.columnDefs = columns;

  vm.openColumnConfigModal = function openColumnConfigModal() {
    // column configuration has direct access to the grid API to alter the current
    // state of the columns - this will be saved if the user saves the grid configuration
    columnConfig.openConfigurationModal();
  };

  // This function opens a modal, to let the user posting transaction to the general ledger
  vm.openTrialBalanceModal = function openTrialBalanceModal() {
    // gather the selected transactions together
    const selectedTransactionIds = selection.selected.groups;

    // make sure a row is selected before running the trial balance
    if (selectedTransactionIds.length === 0) {
      Notify.warn('POSTING_JOURNAL.WARNINGS.NO_TRANSACTIONS_SELECTED');
      return;
    }

    const rows = vm.gridApi.selection.getSelectedRows();
    const hasPostedRecords = rows.some(row => row.posted === 1);

    if (hasPostedRecords) {
      Notify.warn('POSTING_JOURNAL.WARNINGS.TRIAL_BALANCE_HAS_POSTED_RECORDS');
      return;
    }

    const selectedRecordUuids = selectedTransactionIds.map(lookupIntermediateRecordUuid);

    // initialize the data request to the server
    TrialBalance.initialise(selectedRecordUuids);

    // transition to the overview state.  Available states:
    //  1) Overview
    //  2) Errors
    $state.go('TrialBalanceOverview');
  };

  vm.unpostTransactions = () => {
    const message = 'FORM.DIALOGS.UNPOST_TRANSACTIONS';
    Modal.confirm(message)
      .then(confirmResponse => {
        if (!confirmResponse) {
          return;
        }

        // gather the selected transactions together
        const selectedTransactionIds = selection.selected.groups;

        // make sure a row is selected before running the trial balance
        if (selectedTransactionIds.length === 0) {
          Notify.warn('POSTING_JOURNAL.WARNINGS.NO_TRANSACTIONS_SELECTED');
          return;
        }

        const rows = vm.gridApi.selection.getSelectedRows();
        const hasUnpostedRecords = rows.some(row => row.posted === 0);

        if (hasUnpostedRecords) {
          Notify.warn('POSTING_JOURNAL.WARNINGS.TRIAL_BALANCE_HAS_UNPOSTED_RECORDS');
          return;
        }

        const selectedRecordUuids = selectedTransactionIds.map(lookupIntermediateRecordUuid);

        TrialBalance.unpostTransactions(selectedRecordUuids).then(() => {
          vm.reloadData();
        });
      });
  };

  // format Export Parameters
  /**
   *
   * @param type
   */
  function formatExportParameters(type) {
    // gather the selected transactions together
    const selectedTransactionIds = selection.selected.groups;

    // @TODO(sfount) this should not be requirement for exporting - filter on group like editing
    // make sure a row is selected before running the trial balance
    if (selectedTransactionIds.length === 0) {
      Notify.warn('POSTING_JOURNAL.WARNINGS.NO_TRANSACTIONS_SELECTED');
      return 0;
    }

    const rows = vm.gridApi.selection.getSelectedRows();

    // gather unique uuids to ship back to the server
    const uuids = rows
      .map(row => row.uuid)
      .filter((uuid, index, array) => array.indexOf(uuid) === index);

    return {
      renderer : type || 'pdf',
      lang : Languages.key,
      uuids,
    };
  }

  // display the journal printable report of selected transactions
  vm.openJournalReport = function openJournalReport() {
    const url = '/reports/finance/journal';
    const params = formatExportParameters('pdf');
    if (!params) {
      return;
    }
    Modal.openReports({ url, params });
  };

  vm.downloadExcel = () => {
    const displayNames = columnConfig.getDisplayNames();
    const filterOpts = Journal.filters.formatHTTP();
    const defaultOpts = {
      renderer : 'xlsx',
      lang : Languages.key,
      ignoredColumns : [
        displayNames.uuid,
        displayNames.hrRecord,
        displayNames.hrEntity,
      ],
      renameKeys : true,
      displayNames,
    };
    // combine options
    const options = angular.merge(defaultOpts, filterOpts);
    // return  serialized options
    return $httpParamSerializer(options);
  };

  // export data into csv file
  vm.exportFile = function exportFile() {
    exportation.run();
  };

  /**
   *
   * @param error
   */
  function errorHandler(error) {
    vm.hasError = true;
    Notify.handleError(error);
  }

  vm.reloadData = function reloadData() {
    load(Journal.filters.formatHTTP(true));
  };

  // loads data for the journal
  /**
   *
   * @param options
   */
  function load(options) {
    vm.loading = true;
    vm.hasError = false;
    vm.unknownTransactionEditState = false;
    vm.gridOptions.gridFooterTemplate = null;
    vm.gridOptions.showGridFooter = false;

    Journal.grid(null, options)
      .then(records => {
        // number of transactions downloaded and shown in the current journal

        // @FIXME(sfount) just get the length of the transaction ID index
        // vm.numberCurrentGridTransactions = records.aggregate.length;
        vm.numberCurrentGridTransactions = 'N/A';

        // pre process data - this should be done in a more generic way in a service
        journalStore.setData(records);

        vm.gridOptions.data = journalStore.data;

        vm.rowsDetails = sumTransactionAggregates(journalStore.data);

        vm.gridOptions.showGridFooter = true;
        vm.gridOptions.gridFooterTemplate = '/modules/journal/templates/grid.footer.html';

        // map record_uuid -> trans_id
        transactionIdToRecordUuidMap = Journal.mapTransactionIdsToRecordUuids(vm.gridOptions.data);

        // @TODO investigate why footer totals aren't updated automatically on data change
        vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.ALL);

        // scrollToRecordUuid() will scroll to a record uuid on initial load...
        // TODO(@jniles) - this is kind of hacky.  We shouldn't have to check the $params on every
        // load(), only on the initial load.  Redesign?
        if ($state.params.scrollTo) {
          // transactions.scrollIntoView($state.params.scrollTo);
          delete $state.params.scrollTo;
        }
      })
      .catch(errorHandler)
      .finally(toggleLoadingIndicator);
  }

  // open search modal
  vm.openSearchModal = function openSearchModal() {
    const filtersSnapshot = Journal.filters.formatHTTP();

    Journal.openSearchModal(filtersSnapshot)
      .then((changes) => {
        if (!changes) { return null; }

        Journal.filters.replaceFilters(changes);

        Journal.cacheFilters();
        vm.latestViewFilters = Journal.filters.formatView();

        toggleLoadingIndicator();
        return load(Journal.filters.formatHTTP(true));
      })
      .catch(angular.noop);
  };

  // calculates the total number of transactions and lines respecting
  /**
   *
   * @param journalRows
   */
  function sumTransactionAggregates(journalRows) {
    const uniqueTransactions = {};
    const totalRows = journalRows.length;
    const totalPosted = journalRows.reduce((sum, row) => {
      if (angular.isUndefined(uniqueTransactions[row.record_uuid])) {
        uniqueTransactions[row.record_uuid] = 1;
        return sum + Number(row.posted);
      }
      uniqueTransactions[row.record_uuid] += 1;
      return sum;
    }, 0);

    const totalNonPosted = Object.keys(uniqueTransactions).length - totalPosted;
    let remainingSystemTransactions = vm.numberTotalSystemTransactions - totalNonPosted;

    if (Number.isNaN(remainingSystemTransactions)) {
      remainingSystemTransactions = 0;
    }

    return {
      totalRows,
      totalPosted,
      totalNonPosted,
      remainingSystemTransactions,
    };
  }

  // remove a filter with from the filter object, save the filters and reload
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

  // @FIXME(sfount) should this not be done in the grouping service?
  vm.toggleTransactionGroup = function toggleTransactionGroup() {
    const transactionColumnKey = 'trans_id';

    // column grouping is permenantly saved if the user saves the current grid state
    if (vm.grouping.getCurrentGroupingColumn()) {
      // grid is currently grouped - toggle should remove the grouping
      vm.grouping.removeGrouping(transactionColumnKey);
      return;
    }

    // grid is not currently grouped - toggle should group on the trans_id column
    vm.grouping.changeGrouping(transactionColumnKey);
  };

  // @TODO this method is called on every single digest to determine if the grid is
  //       currently grouped - this should only be called once on grid load and then
  //       updated to keep track of the current grid grouped state
  vm.gridGroupedState = vm.grouping.getCurrentGroupingColumn;

  // runs on startup
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

  startup();
  vm.editTransactionModal = editTransactionModal;

  /**
   *
   */
  function editTransactionModal() {
    // block multiple simultaneous edit
    if (selection.selected.groups.length > 1) {
      Notify.warn('POSTING_JOURNAL.WARNINGS.MULTIPLE_TRANSACTION_EDIT_DISABLED');
      return;
    }

    const selectedTransaction = selection.selected.groups[0];
    const transactionUuid = lookupIntermediateRecordUuid(selectedTransaction);

    // Journal module rules for optimistic updating:
    // 1. If a row in the current dataset has been removed - remove this row
    // 2. If a row in the current dataset has been updated - update the values
    // 3. If a row has been added in the edit session it will be ignored as we cannot know if it fits the current filter
    // 4. A dismissable alert will always be shown to the user reminding them their data may be out of date
    Journal.openTransactionEditModal(transactionUuid, false)
      .then((result) => {
        return result.deleted
          ? handleDeleteTransactionResult(result)
          : handleEditTransactionResult(result);
      });
  }

  // Handle Edit Transaction Result
  /**
   *
   * @param editSessionResult
   */
  function handleEditTransactionResult(editSessionResult) {
    const updatedRows = editSessionResult.updatedTransaction;
    const changed = angular.isDefined(updatedRows);

    if (!changed) {
      Notify.warn('FORM.WARNINGS.NO_CHANGES');
      return;
    }

    vm.gridApi.selection.clearSelectedRows();

    // update only rows that already existed and have been edited
    editSessionResult.edited.forEach((uuid) => {
      // update record that already exists
      const currentRow = journalStore.get(uuid);
      const updatedRow = editSessionResult.updatedTransaction.get(uuid);

      Object.keys(currentRow).forEach((key) => {
        currentRow[key] = updatedRow[key];
      });
    });

    // remove rows that existed before and have been removed
    editSessionResult.removed.forEach((uuid) => {
      journalStore.remove(uuid);
    });

    if (editSessionResult.added.length) {
      // rows have been added, we have no guarantees on filters so display a warning
      vm.unknownTransactionEditState = true;
    }
    vm.gridApi.grid.notifyDataChange(uiGridConstants.dataChange.ALL);

    Notify.success('POSTING_JOURNAL.SAVE_TRANSACTION_SUCCESS');
  }

  // Handle Delete Transaction Result
  /**
   *
   * @param deleteSessionResult
   */
  function handleDeleteTransactionResult(deleteSessionResult) {
    if (!deleteSessionResult.deleted) { return; }
    vm.gridApi.selection.clearSelectedRows();

    // remove rows that existed before and have been removed
    deleteSessionResult.removed.forEach((uuid) => {
      journalStore.remove(uuid);
    });

    vm.gridApi.grid.notifyDataChange(uiGridConstants.dataChange.ALL);
    Notify.success('POSTING_JOURNAL.DELETE_TRANSACTION_SUCCESS');
  }

  // TODO(@jniles) rename this method and migrate all code to it
  // looks up the Record UUID from a Transaction ID
  /**
   *
   * @param transId
   */
  function lookupIntermediateRecordUuid(transId) {
    return transactionIdToRecordUuidMap[transId];
  }
}
