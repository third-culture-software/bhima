angular.module('bhima.controllers')
  .controller('JournalEditTransactionController', JournalEditTransactionController);

JournalEditTransactionController.$inject = [
  'JournalService', 'Store', 'TransactionService', 'TransactionTypeService', '$uibModalInstance',
  'transactionUuid', 'readOnly', 'uiGridConstants', 'uuid', 'util', 'moment',
  'ModalService', 'CurrencyService', 'ExchangeRateService', 'SessionService', '$timeout',
  'CostCenterService', 'AccountService',
];

/**
 * @param Journal
 * @param Store
 * @param Transactions
 * @param TransactionType
 * @param Modal
 * @param transactionUuid
 * @param readOnly
 * @param uiGridConstants
 * @param uuid
 * @param util
 * @param moment
 * @param ModalService
 * @param CurrencyService
 * @param ExchangeRateService
 * @param SessionService
 * @param $timeout
 * @param CostCenters
 * @param Accounts
 * @function JournalEditTransactionController
 * @description
 * This controller handles all the code for editing transactions, as well as
 * viewing and correcting posted ones.
 *
 * TODO(@jniles) - break this out into services that power the form to be tested.
 */
function JournalEditTransactionController(
  Journal, Store, Transactions, TransactionType, Modal, transactionUuid, readOnly, uiGridConstants,
  uuid, util, moment, ModalService, CurrencyService, ExchangeRateService, SessionService, $timeout, CostCenters,
  Accounts,
) {
  const vm = this;
  let gridApi = {};

  // Variables for tracking edits
  const removedRows = [];
  const addedRows = [];
  const changes = {};

  // store for caching original rows from the database
  const cache = {};

  const footerTemplate = `
    <div class="ui-grid-cell-contents">
      <span translate>POSTING_JOURNAL.ROWS</span> <span>{{grid.rows.length}}</span> |
      <span translate>POSTING_JOURNAL.TRANSACTION_CURRENCY</span>
      <b>{{grid.appScope.transactionCurrencySymbol()}}</b> |
      <bh-exchange-rate></bh-exchange-rate>
    </div>`;

  // Integrating optional voucher-tools
  vm.voucherTools = { isReversing : false, isCorrecting : false };
  vm.voucherTools.open = openVoucherTools;
  vm.voucherTools.success = successVoucherTools;
  vm.voucherTools.close = closeVoucherTools;

  // @FIXME(sfount) this is only exposed for the UI grid link component - this should be self contained in the future
  vm.loadingTransaction = false;
  vm.setupComplete = false;
  vm.shared = {};
  vm.enterprise = SessionService.enterprise;

  vm.readOnly = readOnly || false;

  vm.validation = {
    errored : false,
    blockedPostedTransactionEdit : false,
  };

  // @TODO(sfount) column definitions currently duplicated across journal and here
  const editColumns = [{
    field              : 'description',
    displayName        : 'TABLE.COLUMNS.DESCRIPTION',
    headerCellFilter   : 'translate',
    allowCellFocus : !vm.readOnly,
    enableCellEdit : !vm.readOnly,
  }, {
    field                : 'account_number',
    displayName          : 'TABLE.COLUMNS.ACCOUNT',
    editableCellTemplate : '<div><div ui-grid-edit-account></div></div>',
    cellTemplate         : '/modules/journal/templates/account.cell.html',
    enableCellEdit : !vm.readOnly,
    allowCellFocus : !vm.readOnly,
    headerCellFilter     : 'translate',
  }, {
    field                : 'debit',
    displayName          : 'TABLE.COLUMNS.DEBIT',
    cellClass            : 'text-right',
    footerCellClass      : 'text-right',
    headerCellFilter     : 'translate',
    type : 'number',
    aggregationHideLabel : true,
    enableCellEdit : !vm.readOnly,
    allowCellFocus : !vm.readOnly,
    aggregationType : uiGridConstants.aggregationTypes.sum,
  }, {
    field            : 'credit',
    displayName      : 'TABLE.COLUMNS.CREDIT',
    cellClass        : 'text-right',
    footerCellClass  : 'text-right',
    headerCellFilter : 'translate',
    enableFiltering : true,
    type : 'number',
    aggregationHideLabel : true,
    enableCellEdit : !vm.readOnly,
    allowCellFocus : !vm.readOnly,
    aggregationType : uiGridConstants.aggregationTypes.sum,
  }, {
    field                : 'hrEntity',
    displayName          : 'TABLE.COLUMNS.RECIPIENT',
    headerCellFilter     : 'translate',
    cellTemplate : `
      <div class="ui-grid-cell-contents">
        <bh-reference-link ng-if="row.entity.hrEntity" reference="row.entity.hrEntity" />
      </div>`,
    enableCellEdit : !vm.readOnly,
    allowCellFocus : !vm.readOnly,
    visible              : true,
  }, {
    field            : 'hrReference',
    displayName      : 'TABLE.COLUMNS.REFERENCE',
    cellTemplate : `
      <div class="ui-grid-cell-contents">
        <bh-reference-link ng-if="row.entity.hrReference" reference="row.entity.hrReference" />
      </div>`,
    headerCellFilter : 'translate',
    enableCellEdit : !vm.readOnly,
    allowCellFocus : !vm.readOnly,
    visible          : true,
  }, {
    field           : 'cost_center_id',
    displayName     : 'FORM.LABELS.COST_CENTER',
    cellTemplate : `
      <div class="ui-grid-cell-contents">{{grid.appScope.costCenterMap[row.entity.cost_center_id]}}</div>
    `,
    headerCellFilter : 'translate',
    editableCellTemplate : 'ui-grid/dropdownEditor',
    editDropdownOptionsFunction : getCostCentersDropdown,
    editDropdownValueLabel : 'label',
    cellEditableCondition : shouldEditCostCenters,
    enableCellEdit  : !vm.readOnly,
    allowCellFocus  : !vm.readOnly,
    visible         : true,
  }];

  vm.gridOptions = {
    columnDefs : editColumns,
    enableColumnMenus : false,
    enableSorting : false,
    showColumnFooter : true,
    showGridFooter : true,
    appScopeProvider : vm,
    gridFooterTemplate : footerTemplate,
    onRegisterApi,
  };

  /**
   *
   * @param api
   */
  function onRegisterApi(api) {
    gridApi = api;
    gridApi.edit.on.afterCellEdit(null, handleCellEdit);
  }

  vm.transactionCurrencySymbol = () => {
    if (!vm.shared.currency_id) { return ''; }
    return CurrencyService.symbol(vm.shared.currency_id);
  };

  vm.currentExchangeRate = () => {
    if (!vm.enterprise.currency_id) { return ''; }
    return ExchangeRateService.getCurrentRate(vm.enterprise.currency_id);
  };

  vm.close = Modal.dismiss;

  // @TODO(sfount) move to component vm.dateEditorOpen = false;
  vm.openDateEditor = () => { vm.dateEditorOpen = !vm.dateEditorOpen; };

  // module dependencies
  TransactionType.read()
    .then(typeResults => {
      vm.transactionTypes = new Store({ identifier : 'id' });
      vm.transactionTypes.setData(typeResults);
    });

  /**
   *
   * @param scope
   */
  function shouldEditCostCenters(scope) {
    if (!scope) return false;
    return !vm.readOnly
      && Accounts.isIncomeOrExpenseAccountTypeId(scope.row.entity.account_type_id);
  }

  /**
   *
   */
  function loadCostCenters() {
    return CostCenters.read()
      .then(costCenters => {
        // the top should be an empty cost center to serve as a "delete" cost center
        // sets the ID to null
        vm.costCenters = [{ id : null, label : '' }, ...costCenters];
        vm.costCenterMap = vm.costCenters.reduce((map, cc) => { map[cc.id] = cc.label; return map; });
        return vm.costCenters;
      });
  }

  loadCostCenters();

  /**
   * @function getCostCentersDropdown
   * @description
   * Load the costCenters on demand for editing.
   */
  function getCostCentersDropdown() {
    if (vm.costCenters) { return vm.costCenters; }
    return loadCostCenters();
  }

  // this is completely optional - it is just for decoration and interest.
  Journal.getTransactionEditHistory(transactionUuid)
    .then(editHistory => {
      const hasPreviousEdits = editHistory.length > 0;
      let mostRecentEdit;
      vm.hasPreviousEdits = hasPreviousEdits;

      if (hasPreviousEdits) {
        mostRecentEdit = editHistory.pop();

        vm.lastEditValues = {
          user : mostRecentEdit.display_name,
          date : moment(mostRecentEdit.timestamp).format('DD/MM/YYYY'),
        };
      }
    });

  vm.loadingTransaction = true;
  Journal.grid(transactionUuid)
    .then(transaction => {
      vm.setupComplete = true;

      verifyEditableTransaction(transaction);

      cache.gridQuery = transaction;
      setupGridRows(cache.gridQuery);
    })
    .catch(() => {
      vm.hasError = true;
    })
    .finally(() => {
      vm.loadingTransaction = false;
    });

  /**
   *
   * @param rows
   */
  function setupGridRows(rows) {
    vm.rows = new Store({ identifier : 'uuid' });

    // ensure rows are replaced if a cached row version is passed
    vm.rows.setData(angular.copy(rows));

    // @FIXME(sfount) date ng-model hack
    vm.rows.data.forEach(row => { row.trans_date = new Date(row.trans_date); });
    vm.shared = sharedDetails(vm.rows.data[0]);
    vm.gridOptions.data = vm.rows.data;
  }

  /**
   *
   * @param transaction
   */
  function verifyEditableTransaction(transaction) {
    const { posted } = transaction[0];

    if (posted) {
      vm.validation.blockedPostedTransactionEdit = true;
      vm.readOnly = true;

      updateGridColumnEditable(!vm.readOnly);
    }
  }

  /**
   *
   * @param canEdit
   */
  function updateGridColumnEditable(canEdit) {
    // readOnly flag is set only when we can't edit the transaction.
    vm.readOnly = !canEdit;

    // notify the grid of options change - the grid should no longer be editable
    vm.gridOptions.columnDefs.forEach((column) => {
      column.allowCellFocus = canEdit;
      column.enableCellEdit = canEdit;
      column.cellEditableCondition = canEdit;
    });

    gridApi.core.notifyDataChange(uiGridConstants.dataChange.ALL);
  }

  // Editing global transaction attributes
  vm.handleTransactionTypeChange = function handleTransactionTypeChange(currentValue) {
    applyAttributeToRows('transaction_type_id', currentValue);
  };

  vm.handleTransactionDateChange = function handleTransactionDateChange(currentValue) {
    applyAttributeToRows('trans_date', currentValue);
  };

  // Edit rows functions
  vm.addRow = function addRow() {
    const row = { uuid : uuid(), debit : 0, credit : 0 };
    angular.extend(row, angular.copy(vm.shared));

    addedRows.push(row.uuid);
    vm.rows.post(row);
  };

  // helper function to pull out the uuid property on an array of objects
  /**
   *
   * @param uid
   */
  function mapRowUuids(uid) {
    return { uuid : uid };
  }

  // this function removes the human readable references if they have changed.
  // it instead substitutes with NULL-ing the underlying columns
  /**
   *
   * @param row
   */
  function pruneHumanReadableReferences(row) {
    if (row.hrEntity === '') {
      row.entity_uuid = null;
      delete row.hrEntity;
    }

    if (row.hrReference === '') {
      row.reference_uuid = null;
      delete row.hrReference;
    }
  }

  vm.saveTransaction = () => {
    const noChanges = addedRows.length === 0 && removedRows.length === 0 && Object.keys(changes).length === 0;

    if (noChanges) {
      Modal.close({});
      return;
    }

    // run local validation before submission
    const offlineErrors = Transactions.offlineValidation(vm.rows.data);
    if (offlineErrors) {
      vm.validation.errored = true;
      vm.validation.message = offlineErrors;
      return;
    }

    // building object to conform to legacy API
    // @FIXME(sfount) update journal service API for human readable interface
    const transactionRequest = {
      uuid : vm.shared.record_uuid,
      newRows : { data : filterRowsByUuid(vm.rows.data, addedRows) },
      removedRows : removedRows.map(mapRowUuids),
    };

    // reset error validation
    vm.validation.errored = false;
    vm.validation.message = null;
    vm.saving = true;

    const safeChanges = angular.copy(changes);

    // prune off the human readable references, submitting only raw data to the
    // server
    angular.forEach(safeChanges, pruneHumanReadableReferences);

    Journal.saveChanges(transactionRequest, safeChanges)
      .then((resultUpdatedTransaction) => {
        const transaction = new Store({ identifier : 'uuid' });

        transaction.setData(resultUpdatedTransaction);

        // collapse information for the module that might expect to apply optimistic updates
        const editSessionResult = {
          edited : Object.keys(changes),
          added : addedRows,
          removed : removedRows,
          updatedTransaction : transaction,
        };

        Modal.close(editSessionResult);
      })
      .catch((error) => {
        vm.validation.errored = true;
        vm.validation.message = error.data.code;
      })
      .finally(() => {
        vm.saving = false;
      });
  };

  vm.deleteTransaction = () => {
    ModalService.confirm()
      .then(ans => {
        if (!ans) { return; }

        Transactions.remove(vm.shared.record_uuid)
          .then(() => {
            const deleteTransactionResult = {
              deleted : true,
              removed : getGridRowsUuid(),
            };

            Modal.close(deleteTransactionResult);
          })
          .catch(handleError);
      })
      .catch(angular.noop);
  };

  // expose the error to the bh-modal-notify component
  /**
   *
   * @param err
   */
  function handleError(err) {
    vm.errorValue = err;
  }

  /**
   *
   */
  function getGridRowsUuid() {
    return vm.rows.data.map(row => row.uuid);
  }

  // rows - array of rows
  // uuids - array of uuids
  /**
   *
   * @param rows
   * @param uuids
   */
  function filterRowsByUuid(rows, uuids) {
    return rows.filter(row => uuids.includes(row.uuid));
  }

  vm.removeRows = () => {
    const selectedRows = gridApi.selection.getSelectedRows();

    selectedRows.forEach((row) => {
      const isOriginalRow = !addedRows.includes(row.uuid);

      if (isOriginalRow) {
        // remove any changes tracked against this record
        delete changes[row.uuid];
        removedRows.push(row.uuid);
      } else {
        // remove new row request from list tracking additional rows
        addedRows.splice(addedRows.indexOf(row.uuid), 1);
      }

      vm.rows.remove(row.uuid);
    });
  };

  /**
   *
   * @param rowEntity
   * @param colDef
   * @param newValue
   * @param oldValue
   */
  function handleCellEdit(rowEntity, colDef, newValue, oldValue) {
    if (oldValue !== newValue) {
      const isOriginalRow = !addedRows.includes(rowEntity.uuid);

      if (isOriginalRow) {
        changes[rowEntity.uuid] = changes[rowEntity.uuid] || {};
        changes[rowEntity.uuid][colDef.field] = newValue;
      }

      // if a user has editted the account_number, remove all associated cost centers to
      // prevent confusion and accidentally associated cost centers with non-income/expense accounts
      if (colDef.field === 'account_number') {
        delete rowEntity.cost_center_id;
      }
    }
  }

  // Edit utilities
  /**
   *
   * @param key
   * @param value
   */
  function applyAttributeToRows(key, value) {
    vm.rows.data.forEach((row) => {
      handleCellEdit({ uuid : row.uuid }, { field : key }, value, row[key]);
      row[key] = value;
    });
  }

  // takes a transaction row and returns all parameters that are shared among the transaction
  // @TODO(sfount) rewrite method given current transaction service code
  /**
   *
   * @param row
   */
  function sharedDetails(row) {
    const columns = [
      'hrRecord', 'record_uuid', 'project_name', 'trans_id', 'transaction_type_id', 'display_name', 'trans_date',
      'project_id', 'fiscal_year_id', 'currency_id', 'user_id', 'posted', 'period_id', 'description',
      'trans_id_reference_number',
    ];

    // for some reason no data has been passed in, no shared attributes are possible
    if (!row) { return {}; }

    const shared = {};

    columns.forEach(column => {
      shared[column] = row[column];
    });

    return shared;
  }

  /**
   *
   * @param tool
   */
  function openVoucherTools(tool) {

    // exception for the isCorrecting tool state
    // @TODO(sfount) this toggle pattern should be refactored
    if (tool === 'isCorrecting') {
      // allow grid editing for the correction voucher tool
      updateGridColumnEditable(true);

      // @FIXME(sfount) data is removed from the grid to work around a ui-grid bug that
      //                does not respect the updated column `editable` flag for rows that were already
      //                in the grid. Unless data is flushed ui-grid intelligently caches the previous
      //                rows and will not allow them to be edited. If a fix for this issue can be found
      //                this line will no longer be needed
      setupGridRows([]);
      $timeout(() => { setupGridRows(cache.gridQuery); });
    }

    vm.voucherTools[tool] = true;
  }

  // voucher tool has fired success
  /**
   *
   * @param tool
   */
  function successVoucherTools(tool) {
    if (tool === 'isCorrecting') {
      // reset the rows to the cached value on success
      updateGridColumnEditable(false);
      $timeout(() => { setupGridRows(cache.gridQuery); });
    }
  }

  /**
   *
   * @param tool
   */
  function closeVoucherTools(tool) {
    if (tool === 'isCorrecting') {
      // reset the rows to the cached value whether successful or not - a new
      // voucher has been made with the correct values. This transaction hasn't
      // actually been edited and this should reflect that.
      updateGridColumnEditable(false);
      $timeout(() => { setupGridRows(cache.gridQuery); });
    }
    vm.voucherTools[tool] = false;
  }
}
