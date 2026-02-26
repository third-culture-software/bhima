angular.module('bhima.controllers')
  .controller('CashController', CashController);

CashController.$inject = [
  '$state', '$q', '$rootScope', 'CashService', 'CashboxService',
  'AppCache', 'CurrencyService', 'SessionService', 'ModalService',
  'NotifyService', 'ReceiptModal', 'CashFormService',
];

/**
 * @param $state
 * @param $q
 * @param RootScope
 * @param Cash
 * @param Cashboxes
 * @param AppCache
 * @param Currencies
 * @param Session
 * @param Modals
 * @param Notify
 * @param Receipts
 * @param CashForm
 * @class CashController
 * @description
 * This controller is responsible for binding the cash payments controller to
 * its view.  Cash payments can be made against future invoices (cautions) or
 * against previous invoices.  The cash payments module provides
 * functionality to pay both in multiple currencies.
 */
function CashController(
  $state, $q, RootScope, Cash, Cashboxes, AppCache, Currencies,
  Session, Modals, Notify, Receipts, CashForm,
) {
  const vm = this;

  const cacheKey = 'CashPayments';
  // persist cash data across sessions
  const cache = AppCache(cacheKey);

  /* id of the currently select cashbox */
  const cashboxId = $state.params.id || (cache.cashbox && cache.cashbox.id);

  // if no id, re-route to 'cash.select'
  if (!cashboxId) {
    $state.go('^.select', {}, { notify : false });

  // if there is no URL id but one in localstorage, update the state with the
  // localstorage params.  This doesn't actually reload anything .. it just changes
  // the URL.
  } else if (cashboxId && !$state.params.id) {
    $state.go('^.window', { id : cashboxId }, { location : 'replace' });
  }

  // this is the cache payment form
  vm.Payment = new CashForm(cacheKey);

  vm.timestamp = new Date();
  vm.enterprise = Session.enterprise;

  // this toggles whether the form should re-enter the checkbox state
  const DEFAULT_BARCODE_CHECKBOX_STATE = false;

  // bind methods
  vm.submit = submit;
  vm.clear = clear;
  vm.openInvoicesModal = openInvoicesModal;
  vm.onRegisterApiCallback = onRegisterApiCallback;

  // fired when the bhFindPatient API becomes available
  /**
   *
   * @param api
   */
  function onRegisterApiCallback(api) {
    vm.bhFindPatient = api;
  }

  // fired on controller start or form refresh
  /**
   *
   */
  function startup() {
    vm.openBarcodeModalOnSuccess = (cache.openBarcodeModalOnSuccess || DEFAULT_BARCODE_CHECKBOX_STATE);

    Currencies.read()
      .then((currencies) => {
        vm.currencies = currencies;
        return Cashboxes.read(cashboxId);
      })
      .then((cashbox) => {

        // set the cashbox selection in localstorage and recalculate disabled ids
        setCashboxSelection(cashbox);
      })
      .catch((error) => {

        // if we hit a 404 error, we don't have a valid cashbox and do not show
        // the error.
        if (error.status === 404) {
          $state.go('^.select', {}, { notify : false });
          return;
        }

        Notify.handleError(error);
      });
  }

  // caches the cashbox
  /**
   *
   * @param cashbox
   */
  function setCashboxSelection(cashbox) {
    vm.cashbox = cashbox;
    cache.cashbox = cashbox;
    vm.disabledCurrencyIds = Cash.calculateDisabledIds(vm.cashbox, vm.currencies);
    vm.Payment.setCashbox(cashbox);
  }

  /* Debtor Invoices Modal */
  /**
   *
   */
  function openInvoicesModal() {
    $state.go('cash.debtors', {
      id : vm.cashbox.id,
      debtor_uuid : vm.Payment.details.debtor_uuid,
      invoices : vm.Payment.details.invoices.map(invoice => invoice.uuid),
    });
  }

  // submits the form to the server
  /**
   *
   * @param form
   */
  function submit(form) {
    if (form.$invalid) { return 0; }

    // be sure the cashbox is set
    vm.Payment.setCashbox(vm.cashbox);

    cache.openBarcodeModalOnSuccess = vm.openBarcodeModalOnSuccess;

    // patient invoices are covered by caution
    const hasCaution = vm.Payment.messages.hasPositiveAccountBalance;
    const isCaution = vm.Payment.isCaution();
    const hasInvoices = vm.Payment.details.invoices && vm.Payment.details.invoices.length > 0;

    // if the this is not a caution payment, but no invoices are selected,
    // raise an error.
    if (!isCaution && !hasInvoices) {
      return Notify.danger('CASH.VOUCHER.CASHBOXES.NO_INVOICES_ASSIGNED');
    }

    return $q.resolve()
      .then(() => {
        return hasCaution
          ? Modals.confirm('CASH.CONFIRM_PAYMENT_WHEN_CAUTION') : true;
      })
      .then(allowPaymentWithCaution => {
        if (allowPaymentWithCaution) {
          return submitPayment(form);
        }
        return null;
      });
  }

  // submit payment
  /**
   *
   * @param form
   */
  function submitPayment(form) {
    // make a copy of the data before submitting
    const copy = angular.copy(vm.Payment.details);

    // format the cash payment description
    const cachedPaymentDescription = copy.description;

    // TODO - find a much better way of doing this.  This seems quite ... hacky
    copy.description = Cash.formatCashDescription(vm.Payment.patient, copy)
      .concat(' -- ', cachedPaymentDescription);

    return Cash.create(copy)
      .then(response => Receipts.cash(response.uuid, true))
      .then(() => {
        // clear and refresh the form
        clear(form);

        if (vm.openBarcodeModalOnSuccess) {
          $state.go('^.scan', { id : vm.cashbox.id });
        }
      })
      .catch(Notify.handleError);
  }

  /**
   *
   * @param form
   */
  function clear(form) {
    vm.Payment.setup();

    // clear the patient selection
    vm.bhFindPatient.reset();

    // clear the form
    form.$setPristine();
  }

  // listen on rootscope emit channel, this function accepts invoice
  // details from other controllers (for example a scanned barcode)
  // and configures the Cash Window controller with the imported details
  RootScope.$on('cash:configure', configureInvoiceCashPayment);

  // invoiceData is expected as follows
  // {
  //    description : // string value for the _service_ that generated the invoice
  //    invoices: // a list of invoice objects each with the invoices balance
  //    patient: // detailed patient object with containing all patient (debtor) details
  // }
  /**
   *
   * @param event
   * @param invoiceData
   */
  function configureInvoiceCashPayment(event, invoiceData) {
    vm.Payment.configure(invoiceData);

    // if the patient UUID is provided, search by that patient
    if (invoiceData.patient) {
      vm.bhFindPatient.searchByUuid(invoiceData.patient.uuid);
    }
  }

  // start up the module
  startup();
}
