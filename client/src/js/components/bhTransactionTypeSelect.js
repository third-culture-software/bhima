angular.module('bhima.components')
  .component('bhTransactionTypeSelect', {
    templateUrl : 'modules/templates/bhTransactionTypeSelect.tmpl.html',
    controller  : transactionTypeSelectController,
    bindings    : {
      onChange : '&',
      transactionTypeIds : '<?',
      label : '@?',
      required : '<?',
    },
  });

transactionTypeSelectController.$inject = [
  'TransactionTypeService', 'NotifyService',
];

/**
 * transaction type Selection Component
 * @param TransactionTypes
 * @param Notify
 */
function transactionTypeSelectController(TransactionTypes, Notify) {
  const $ctrl = this;

  $ctrl.$onInit = () => {
    // label to display
    $ctrl.label = $ctrl.label || 'FORM.LABELS.TRANSACTION_TYPE';

    // init the model
    $ctrl.selectedTransactionTypes = $ctrl.transactionTypeIds || [];

    // load all Transaction types
    TransactionTypes.read()
      .then(transactionTypes => {
        $ctrl.transactionTypes = transactionTypes;
      })
      .catch(Notify.handleError);
  };

  // fires the onSelectCallback bound to the component
  $ctrl.handleChange = transactionTypes => $ctrl.onChange({ transactionTypes });
}
