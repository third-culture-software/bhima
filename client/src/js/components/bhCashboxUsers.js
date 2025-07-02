angular.module('bhima.components')
  .component('bhCashboxUsers', {
    templateUrl : 'modules/templates/bhCashboxUsers.tmpl.html',
    controller : bhCashboxUsers,
    bindings : {
      cashbox : '<',
    },
  });

bhCashboxUsers.$inject = ['CashboxService'];

// expects cashbox ID bound through 'cashbox'
function bhCashboxUsers(Cashboxes) {
  const $ctrl = this;

  $ctrl.$onInit = () => {
    // track intiial load to allow good empty user experience
    $ctrl.initialLoad = false;
  };

  function loadCashboxUsers(cashbox) {
    Cashboxes.users.read(cashbox)
      .then(users => {
        $ctrl.initialLoad = true;
        $ctrl.users = users;
      });
  }

  // cashbox ID may not be available to controller on component load, allow
  // this to be set any time
  $ctrl.$onChanges = function onChanges(changes) {
    if (changes.cashbox && changes.cashbox.currentValue) {
      loadCashboxUsers(changes.cashbox.currentValue);
    }
  };
}
