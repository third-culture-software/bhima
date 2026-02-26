angular.module('bhima.components')
  .component('bhAccountReferenceTypeSelect', {
    templateUrl : 'modules/templates/bhAccountReferenceTypeSelect.tmpl.html',
    controller  : AccountReferenceTypeSelectController,
    transclude  : true,
    bindings    : {
      referenceTypeId   : '<?',
      onSelectCallback  : '&',
      disable           : '<?',
    },
  });

AccountReferenceTypeSelectController.$inject = ['AccountReferenceTypeService'];

/**
 * Account Reference Type selection component
 * @param AccountReferenceType
 */
function AccountReferenceTypeSelectController(AccountReferenceType) {
  const $ctrl = this;

  $ctrl.$onInit = function onInit() {
    AccountReferenceType.read()
      .then(accountReferenceTypes => {
        AccountReferenceType.translateLabel(accountReferenceTypes);

        $ctrl.accountReferenceTypes = accountReferenceTypes;
      });
  };

  $ctrl.onSelect = accountReferenceType => $ctrl.onSelectCallback({ accountReferenceType });
}
