angular.module('bhima.routes')
  .config(['$stateProvider', ($stateProvider) => {
    $stateProvider

      .state('cashRegistry', {
        url         : '/payments',
        controller  : 'CashPaymentRegistryController as CPRCtrl',
        templateUrl : 'modules/cash/payments/registry.html',
        params      : {
          filters : [],
        },
      })

      .state('cash', {
        url         : '/cash',
        abstract    : true,
        controller  : 'CashController as CashCtrl',
        templateUrl : '/modules/cash/cash.html',
      })

      .state('cash.select', {
        url     : '/selection',
        params  : { id : { value : null } },
        onEnter : ['$uibModal', cashboxSelectionModal],
        onExit  : ['$uibModalStack', closeModal],
      })

      .state('cash.window', {
        url         : '/:id?',
        params      : { id : { squash : true, value : null } },
        controller  : 'CashController as CashCtrl',
        templateUrl : '/modules/cash/cash.html',
      })

      .state('cash.transfer', {
        url     : '/:id/transfer',
        params  : { id : { squash : true, value : null } },
        onEnter : ['$state', '$uibModal', transferModal],
        onExit  : ['$uibModalStack', closeModal],
      })

      .state('cash.debtors', {
        url    : '/:id/debtors',
        params : {
          id          : { squash : true, value : null },
          debtor_uuid : { value : undefined },
          invoices    : { value : [] },
        },
        onEnter : ['$state', '$uibModal', '$transition$', debtorInvoicesModal],
        onExit  : ['$uibModalStack', closeModal],
      })

      .state('cash.scan', {
        url     : '/:id/scan',
        params  : { id : { squash : true, value : null } },
        onEnter : ['$state', '$uibModal', scanCashBarcodeModal],
        onExit  : ['$uibModalStack', closeModal],
      });
  }]);

function cashboxSelectionModal(Modal) {
  Modal.open({
    templateUrl : 'modules/cash/modals/select-cashbox-modal.html',
    controller  : 'SelectCashboxModalController as $ctrl',
  }).result.catch(angular.noop);
}

function transferModal($state, Modal) {
  Modal.open({
    controller  : 'CashTransferModalController as TransferCtrl',
    templateUrl : 'modules/cash/modals/transfer-modal.html',
    backdrop    : 'static',
    keyboard    : false,
  });
}

function scanCashBarcodeModal($state, Modal) {
  Modal.open({
    controller  : 'CashBarcodeScannerModalController as BarcodeModalCtrl',
    templateUrl : 'modules/templates/barcode-scanner-modal.html',
    size        : 'lg',
    keyboard    : true,
  }).result
    .catch(() => {
      // modal has been cancelled - no action is taken
      // handling this case stops an unhandled exception being thrown in the console, angular.noop could also be used
    })
    .finally(() => {
      $state.go('^.window', { id : $state.params.id });
    });
}

function debtorInvoicesModal($state, Modal, $transition) {
  Modal.open({
    templateUrl : 'modules/cash/modals/invoice-modal.html',
    controller  : 'CashInvoiceModalController as CashInvoiceModalCtrl',
    keyboard    : true,
    resolve : { params : () => $transition.params('to') },
  }).result.finally(() => {
    $state.go('^.window', { id : $state.params.id });
  });
}

function closeModal($uibModalStack) {
  $uibModalStack.dismissAll();
}
