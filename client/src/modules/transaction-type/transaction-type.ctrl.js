angular.module('bhima.controllers')
  .controller('TransactionTypeController', TransactionTypeController);

TransactionTypeController.$inject = [
  '$translate', 'TransactionTypeService', 'NotifyService',
  'ModalService', 'uiGridConstants', 'bhConstants',
];

/**
 * @param $translate
 * @param TransactionType
 * @param Notify
 * @param Modal
 * @param uiGridConstants
 * @param bhConstants
 * @function TransactionTypeController
 * @description
 * This controller powers the transaction type grid.
 */
function TransactionTypeController($translate, TransactionType, Notify, Modal, uiGridConstants, bhConstants) {
  const vm = this;

  // global variables
  vm.gridOptions = {};
  vm.gridApi = {};

  // grid default options
  vm.gridOptions.appScopeProvider = vm;
  vm.gridOptions.columnDefs = [{
    field : 'descriptionLabel',
    displayName : 'FORM.LABELS.TEXT',
    headerCellFilter : 'translate',
    enableColumnMenu : false,
    sort : {
      direction : uiGridConstants.ASC,
      priority : 1,
    },
  }, {
    field : 'typeLabel',
    displayName : 'FORM.LABELS.TYPE',
    headerCellFilter : 'translate',
    cellFilter : 'translate',
    enableColumnMenu : false,
  }, {
    field : 'fixed',
    displayName : '',
    maxWidth : '150',
    cellTemplate : '/modules/transaction-type/templates/fixedStatus.cell.html',
    enableFiltering : false,
    enableColumnMenu : false,
    sort : {
      direction : uiGridConstants.DESC,
      priority : 0,
    },
  }];

  // register API
  vm.gridOptions.onRegisterApi = onRegisterApi;

  // expose to the view
  vm.addType = addType;
  vm.editType = editType;

  /**
   *
   * @param gridApi
   */
  function onRegisterApi(gridApi) {
    vm.gridApi = gridApi;
  }

  // add new transaction type
  /**
   *
   */
  function addType() {
    const request = { action : 'create' };

    return Modal.openTransactionTypeActions(request)
      .then(res => {
        if (!res) { return; }
        Notify.success('FORM.INFO.SAVE_SUCCESS');
        loadTransactionTypes();
      })
      .catch(Notify.handleError);
  }

  // edit en existing transaction type
  /**
   *
   * @param transactionType
   */
  function editType(transactionType) {
    if (transactionType.fixed) { return 0; }

    const request = { action : 'edit', identifier : transactionType.id };

    return Modal.openTransactionTypeActions(request)
      .then(res => {
        if (!res) { return; }
        Notify.success('FORM.INFO.UPDATE_SUCCESS');
        loadTransactionTypes();
      })
      .catch(Notify.handleError);
  }

  /**
   *
   */
  function loadTransactionTypes() {
    return TransactionType.read()
      .then(types => {
        const parsedTypes = types.map(assignDescriptionTranslation);
        vm.gridOptions.data = parsedTypes.map(assignTransactionTypeLabels);
      })
      .catch(Notify.handleError);
  }

  // Assign translatable labels to each transaction type based on the hardcoded
  // database strings
  /**
   *
   * @param transactionType
   */
  function assignTransactionTypeLabels(transactionType) {
    // @TODO(sfount) The `transaction_type` database currently hard codes 'income',
    //               'expense' and 'other' transaction types. When this is updated
    //               with a more data driven approach it should include translatable
    //               labels
    transactionType.typeLabel = bhConstants.transactionTypeMap[transactionType.type].label;
    return transactionType;
  }

  /**
   *
   * @param type
   */
  function assignDescriptionTranslation(type) {
    type.descriptionLabel = $translate.instant(type.text);
    return type;
  }

  /**
   *
   */
  function startup() {
    loadTransactionTypes();
  }

  // startup the module
  startup();
}
