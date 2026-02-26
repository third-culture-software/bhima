angular.module('bhima.services')
  .service('ModalService', ModalService);

ModalService.$inject = ['$uibModal'];

/**
 * Modal Service
 *
 * A service to house generic modals useful through out the application.  These
 * will replace a lot of the native JavaScript alerts/confirms to allow easier
 * translation, testing, and functionality.
 * @param Modal
 * @todo - build following methods/modals:
 *  - alert() to show a generic alert with "dismiss" or "acknowledge" button.
 *    It might be useful to have an associated icon and state (error, info,
 *    warning, etc).
 *
 *  - confirmText() to bring up a "type this text to confirm" input that will
 *    only allow a user to enter text and only enable the "confirm" button once
 *    the text matches exactly what is anticipated.
 */
function ModalService(Modal) {
  const service = this;

  const modalParameters = {
    size      : 'md',
    backdrop  : 'static',
    animation : false,
  };

  service.alert = alert;
  service.confirm = confirm;
  service.openSelectCashbox = openSelectCashbox;
  service.openUploadDocument = openUploadDocument;

  // modal for reporting
  service.openReports = openReports;
  // inventory group action : add or edit
  service.openInventoryGroupActions = openInventoryGroupActions;

  // inventory type action : add or edit
  service.openInventoryTypeActions = openInventoryTypeActions;

  // inventory unit action : add or edit
  service.openInventoryUnitActions = openInventoryUnitActions;

  // inventory list action : add or edit
  service.openInventoryListActions = openInventoryListActions;

  // confirm deletion modal
  service.openConfirmDialog = openConfirmDialog;

  // project actions : add or edit
  service.openProjectActions = openProjectActions;

  // transaction type : add or edit
  service.openTransactionTypeActions = openTransactionTypeActions;

  // closing fiscal year
  service.openClosingFiscalYear = openClosingFiscalYear;

  // search cash payment
  service.openSearchCashPayment = openSearchCashPayment;

  // purchase order status
  service.openPurchaseOrderStatus = openPurchaseOrderStatus;

  // requisition status
  service.requisitionStatus = requisitionStatus;

  // search purchase order
  service.openSearchPurchaseOrder = openSearchPurchaseOrder;

  // search fiscal year
  service.openSelectFiscalYear = openSelectFiscalYear;

  // Cron email Modal to integrate in registries
  service.openCronEmailModal = openCronEmailModal;

  service.openHostpitaliationIndicator = openHostpitaliationIndicator;
  service.openinventoryLogModal = openinventoryLogModal;
  service.editPatientGroup = editPatientGroup;
  /**
   * Opens a "confirm delete" modal with a button for "Confirm" or "Cancel".
   * The modal is a safe replacement for $window.confirm(), since you cannot
   * disable javascript alerts from within it.
   * @param {string} prompt - a translateable message to pass the template
   * @param {object} options - optional object with properties to configure the
   *  ui-bootstrap modal.
   * @returns {Promise} result - a promise resolved by the modal instance
   */
  function confirm(prompt, options) {
    // default options for modal rendering
    const opts = options || {};

    const instance = Modal.open({
      animation : opts.animation || false,
      keyboard : opts.keyboard || true,
      size : opts.size || 'md',
      controller : 'ConfirmModalController as ConfirmModalCtrl',
      resolve : { prompt : function provider() { return prompt; } },
      templateUrl : '/modules/templates/modals/confirm.modal.html',
    });

    return instance.result;
  }

  /**
   *
   * @param prompt
   * @param options
   */
  function alert(prompt, options) {
    // default options for modal rendering
    const opts = options || {};

    const instance = Modal.open({
      animation : opts.animation || false,
      keyboard : opts.keyboard || true,
      size : opts.size || 'md',
      controller : 'AlertModalController as AlertModalCtrl',
      resolve : { prompt : () => prompt },
      templateUrl : '/modules/templates/modals/alert.modal.html',
    });

    return instance.result;
  }

  /**
   * Select cashbox modal
   * @param request
   */
  function openSelectCashbox(request) {
    const params = angular.extend(modalParameters, {
      templateUrl : 'modules/cash/modals/selectCashbox.modal.html',
      controller  : 'SelectCashboxModalController as $ctrl',
      resolve     : {
        cashboxId : function cashboxIdProvider() { return request.cashboxId; },
      },
    });

    return Modal.open(params).result;
  }

  /**
   * upload document Modal
   * @param request
   */
  function openUploadDocument(request) {

    const params = angular.extend(modalParameters, {
      templateUrl  : 'modules/patients/documents/modals/documents.modal.html',
      controller   : 'PatientDocumentsModalController',
      controllerAs : '$ctrl',
      resolve : { patientUuid : () => request.patient_uuid },
    });

    const instance = Modal.open(params);
    return instance.result;
  }

  /**
   * Page for printing in Modal
   * @param request
   */
  function openReports(request) {

    const params = angular.extend(modalParameters, {
      templateUrl  : 'modules/templates/modals/reports.modal.html',
      controller   : 'ReportsModalController',
      controllerAs : '$ctrl',
      size         : 'lg',
      resolve : { data : () => request },
    });

    const instance = Modal.open(params);
    return instance.result;
  }

  /**
   * Inventory Group Actions
   * @param request
   */
  function openInventoryGroupActions(request) {
    const params = angular.extend(modalParameters, {
      templateUrl  : 'modules/inventory/configuration/groups/modals/actions.tmpl.html',
      controller   : 'InventoryGroupsActionsModalController',
      controllerAs : '$ctrl',
      size         : 'xs',
      resolve : { data : () => request },
    });

    const instance = Modal.open(params);
    return instance.result;
  }

  /**
   * Inventory Types Modal for actions
   * @param request
   */
  function openInventoryTypeActions(request) {

    const params = angular.extend(modalParameters, {
      templateUrl  : 'modules/inventory/configuration/types/modals/actions.tmpl.html',
      controller   : 'InventoryTypeActionsModalController',
      controllerAs : '$ctrl',
      size         : 'xs',
      resolve : { data : () => request },
    });

    const instance = Modal.open(params);
    return instance.result;
  }

  /**
   * Inventory Units Modals for actions
   * @param data
   */
  function openInventoryUnitActions(data) {
    const params = angular.extend(modalParameters, {
      templateUrl  : 'modules/inventory/configuration/units/modals/actions.tmpl.html',
      controller   : 'InventoryUnitActionsModalController',
      controllerAs : '$ctrl',
      resolve : { data : () => data },
    });

    const instance = Modal.open(params);
    return instance.result;
  }

  /**
   * Inventory List Modals for actions
   * @param request
   * @param parameters
   */
  function openInventoryListActions(request, parameters) {
    const params = angular.extend(modalParameters, {
      templateUrl  : 'modules/inventory/list/modals/actions.tmpl.html',
      controller   : 'InventoryListActionsModalController',
      controllerAs : '$ctrl',
      resolve : { data : () => request, params : () => parameters },
    });

    const instance = Modal.open(params);
    return instance.result;
  }

  /**
   * confirm deletion modal
   * @param {object} request
   * The request parameter take :
   *  pattern: the text to match,
   *  elementName: the name translated of the element to delete (document, transaction)
   * @example
   * request = {
   *   pattern: '#HBB17',
   *   elementName: $translate.instant('FORM.LABELS.TRANSACTION')
   *  }
   */
  function openConfirmDialog(request) {

    const params = angular.extend(modalParameters, {
      templateUrl  : 'modules/templates/modals/confirmDialog.modal.html',
      controller   : 'ConfirmDialogModalController',
      controllerAs : '$ctrl',
      size         : 'xs',
      resolve : { data : () => request },
    });

    const instance = Modal.open(params);
    return instance.result;
  }

  /**
   * project modal actions
   * @param request
   */
  function openProjectActions(request) {
    const params = angular.extend(modalParameters, {
      templateUrl  : 'modules/templates/modals/project.modal.html',
      controller   : 'ProjectModalController',
      controllerAs : '$ctrl',
      size         : 'xs',
      resolve : { data : () => request },
    });

    const instance = Modal.open(params);
    return instance.result;
  }

  /**
   * transaction type modal actions
   * @param request
   */
  function openTransactionTypeActions(request) {
    const params = angular.extend(modalParameters, {
      templateUrl  : 'modules/templates/modals/transactionType.modal.html',
      controller   : 'TransactionTypeModalController',
      controllerAs : '$ctrl',
      size         : 'xs',
      resolve : { data : () => request },
    });

    const instance = Modal.open(params);
    return instance.result;
  }

  /**
   * closing fiscal year modal
   * @param request
   */
  function openClosingFiscalYear(request) {
    const params = angular.extend(modalParameters, {
      templateUrl  : 'modules/fiscal/templates/modals/fiscal.closing.modal.html',
      controller   : 'ClosingFiscalYearModalController',
      controllerAs : '$ctrl',
      size         : 'lg',
      resolve : { data : () => request },
    });

    const instance = Modal.open(params);
    return instance.result;
  }

  /**
   * searchCashPayment
   * @param filters
   */
  function openSearchCashPayment(filters) {
    const params = angular.extend(modalParameters, {
      templateUrl  : 'modules/cash/payments/templates/search.modal.html',
      controller   : 'SearchCashPaymentModalController',
      controllerAs : '$ctrl',
      resolve : { filters : () => filters },
    });

    const instance = Modal.open(params);
    return instance.result;
  }

  /**
   * Cron email modal
   * @param options
   */
  function openCronEmailModal(options) {
    const params = angular.extend(modalParameters, {
      templateUrl  : 'modules/templates/modals/cronEmailModal.html',
      controller   : 'CronEmailModalController',
      controllerAs : 'ModalCtrl',
      resolve : { options : () => options },
    });

    const instance = Modal.open(params);
    return instance.result;
  }

  /**
   *
   * @param request
   * @param url
   * @param ctrl
   * @param size
   */
  function openModal(request, url, ctrl, size) {
    const params = angular.extend(modalParameters, {
      templateUrl : url,
      controller : ctrl,
      size : size || 'xs',
      controllerAs : '$ctrl',
      resolve : { data : () => request },
    });

    const instance = Modal.open(params);
    return instance.result;
  }
  /**
   * purchase order status
   * @param request
   */
  function openPurchaseOrderStatus(request) {
    const templateUrl = 'modules/purchases/modals/status.tmpl.html';
    const controller = 'PurchaseOrderStatusModalController';
    return openModal(request, templateUrl, controller);
  }

  /**
   * purchase order status
   * @param request
   */
  function requisitionStatus(request) {
    const templateUrl = 'modules/stock/requisition/modals/status.tmpl.html';
    const controller = 'RequisitionStatusModalController';
    return openModal(request, templateUrl, controller);
  }

  /**
   * search purchase order
   * @param request
   */
  function openSearchPurchaseOrder(request) {
    const templateUrl = 'modules/purchases/modals/search.tmpl.html';
    const controller = 'SearchPurchaseOrderModalController';
    return openModal(request, templateUrl, controller);
  }

  /**
   *
   * @param request
   */
  function openSelectFiscalYear(request) {
    const templateUrl = 'modules/general-ledger/modals/search.tmpl.html';
    const controller = 'SearchFiscalYearModalController';
    return openModal(request, templateUrl, controller);
  }

  /**
   *
   * @param request
   */
  function openHostpitaliationIndicator(request) {
    const templateUrl = 'modules/indicators/modal/createUpdateHospitalization.html';
    const controller = 'HospitalizationIndicatorModalController';
    return openModal(request, templateUrl, controller, 'lg');
  }

  /**
   *
   * @param request
   */
  function openinventoryLogModal(request) {
    const templateUrl = 'modules/inventory/list/modals/log.modal.html';
    const controller = 'InventoryLogModalController';
    return openModal(request, templateUrl, controller, 'md');
  }

  /**
   *
   * @param request
   */
  function editPatientGroup(request) {
    const params = angular.extend(modalParameters, {
      templateUrl  : 'modules/patients/registry/editPatientGroup.html',
      controller   : 'EditPatientGroupModalController',
      controllerAs : '$ctrl',
      resolve : { data : () => request },
    });

    const instance = Modal.open(params);
    return instance.result;
  }
}
