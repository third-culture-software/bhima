angular.module('bhima.components')
  .component('bhReferenceAccountMultipleSelect', {
    templateUrl : 'modules/templates/bhReferenceAccountMultipleSelect.tmpl.html',
    controller  : referenceAccountMultipleSelectController,
    bindings    : {
      onChange : '&',
      referenceAccountIds : '<?',
      label : '@?',
      type : '@?',
      required : '<?',
    },
  });

referenceAccountMultipleSelectController.$inject = [
  'AccountReferenceService', 'NotifyService',
];

/**
 * Reference Account Multiple Select Component
 *
 */
function referenceAccountMultipleSelectController(AccountReferences, Notify) {
  const $ctrl = this;

  $ctrl.$onInit = () => {
    // label to display
    $ctrl.label = $ctrl.label || 'FORM.LABELS.ACCOUNT_REFERENCE';

    // init the model
    $ctrl.selectedReferenceAccounts = $ctrl.referenceAccountIds || [];
    const typefilter = $ctrl.type ? { reference_type_id : $ctrl.type } : {};

    AccountReferences.read(null, typefilter)
      .then(referenceAccounts => {
        $ctrl.referenceAccounts = referenceAccounts;
      })
      .catch(Notify.handleError);
  };

  // fires the onSelectCallback bound to the component
  $ctrl.handleChange = referenceAccounts => $ctrl.onChange({ referenceAccounts });
}
