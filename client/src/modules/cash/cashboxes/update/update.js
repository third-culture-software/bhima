angular.module('bhima.controllers')
  .controller('CashboxUpdateController', CashboxUpdateController);

CashboxUpdateController.$inject = [
  '$state', '$uibModal', 'ModalService', 'NotifyService',
  'CashboxService', 'CurrencyService', 'SessionService',
];

/**
 *
 * @param $state
 * @param Modal
 * @param ModalService
 * @param Notify
 * @param Boxes
 * @param Currencies
 * @param Session
 */
function CashboxUpdateController($state, Modal, ModalService, Notify, Boxes, Currencies, Session) {
  const vm = this;

  const CREATE_STATE = 'cashboxes.create';

  // temporary method of determining if we're in create state
  const isCreateState = $state.current.name === CREATE_STATE;

  const cashboxUuid = $state.params.uuid;

  vm.state = $state;
  vm.box = { project_id : Session.project.id };
  vm.submit = submit;
  vm.configureCurrency = configureCurrency;
  vm.remove = remove;

  // TODO this information could be shared by the parent controller
  Currencies.read().then((currencies) => {
    vm.currencies = currencies;

    // if we have a cashbox (and are subsequently in the edit state), load its information
    if (angular.isDefined(cashboxUuid)) {
      loadCashbox(cashboxUuid);
    } else {
      // FIXME remove convuluted logic
      vm.box.is_auxiliary = 1;
    }

  }).catch(Notify.handleError);

  // form submission
  /**
   *
   * @param form
   */
  function submit(form) {
    if (form.$invalid) {
      Notify.danger('FORM.ERRORS.HAS_ERRORS');
      return null;
    }

    const box = angular.copy(vm.box);

    const promise = (isCreateState)
      ? Boxes.create(box)
      : Boxes.update(box.id, box);

    return promise
      .then(() => {
        Notify.success(isCreateState ? 'FORM.INFO.CREATE_SUCCESS' : 'FORM.INFO.UPDATE_SUCCESS');
        $state.go('cashboxes.list', null, { reload : true });
      })
      .catch(Notify.handleError);
  }

  // asynchronously load a cashbox from the server
  /**
   *
   * @param id
   */
  function loadCashbox(id) {
    return Boxes.read(id)
      .then(data => {
        // bind the cashbox to the view
        vm.box = data;

        $state.params.label = vm.box.label;

        // calculate the currency difference
        calculateCurrencyDiff();
      });
  }

  // check if a currency is in the data.currencies array
  /**
   *
   * @param id
   */
  function hasCurrency(id) {
    return vm.box.currencies.some((c) => c.currency_id === id);
  }

  /**
   *
   */
  function calculateCurrencyDiff() {
    vm.currencies.forEach(currency => {
      currency.configured = hasCurrency(currency.id);
    });
  }

  /**
   * configure the currency account for a cashbox
   * @param currency
   * @todo - should this be in it's own service?
   */
  function configureCurrency(currency) {
    const instance = Modal.open({
      templateUrl : 'modules/cash/cashboxes/configure_currency/modal.html',
      controller : 'CashboxCurrencyModalController as CashboxModalCtrl',
      size : 'md',
      backdrop : 'static',
      animation : false,
      resolve : {
        currency : () => currency,
        cashbox : () => vm.box,
      },
    });

    instance.result
      .then(() => {
        Notify.success('FORM.INFO.UPDATE_SUCCESS');

        // TODO optimistically update without the need for additional connection (unless for verifcation)
        loadCashbox(vm.box.id);
      })
      .catch((data) => {
        if (data) { Notify.handleError(data); }
      });
  }

  /**
   *
   * @param box
   */
  function remove(box) {
    ModalService.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then((bool) => {

        if (!bool) { return; }

        Boxes.delete(box.id)
          .then(() => {
            Notify.success('FORM.INFO.DELETE_SUCCESS');

            $state.go('cashboxes.list', null, { reload : true });
          })
          .catch(Notify.handleError);
      });
  }
}
