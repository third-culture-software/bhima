angular.module('bhima.components')
  .component('bhAccountTypeSelect', {
    templateUrl : 'js/components/bhAccountTypeSelect/bhAccountTypeSelect.html',
    controller  : AccountTypeSelectController,
    transclude  : true,
    bindings    : {
      accountTypeId    : '<',
      onSelectCallback : '&',
      required         : '<?',
      disabled         : '<?',
      label            : '@?',
      helpText         : '@?',
    },
  });

AccountTypeSelectController.$inject = ['AccountTypeService', 'NotifyService', '$translate'];

/**
 * @param AccountTypes
 * @param Notify
 * @param $translate
 * @function AccountTypeSelectionController
 * @description
 * AccountType selection component
 */
function AccountTypeSelectController(AccountTypes, Notify, $translate) {
  const $ctrl = this;

  /**
   *
   */
  function loadAccountTypes() {
    AccountTypes.read()
      .then(accountTypes => {
        $ctrl.accountTypes = accountTypes.map(type => {
          type.hrType = $translate.instant(type.translation_key);
          return type;
        });
      })
      .catch(Notify.handleError);
  }

  $ctrl.$onInit = () => {
    $ctrl.required = !!($ctrl.required);
    $ctrl.label = $ctrl.label || 'FORM.LABELS.ACCOUNT_TYPE';
    $ctrl.accountTypeId = $ctrl.accountTypeId ? +$ctrl.accountTypeId : null;
    loadAccountTypes();
  };

  $ctrl.$onChanges = (changes) => {
    if (changes.accountTypeId && changes.accountTypeId.currentValue) {
      loadAccountTypes();
    }
  };

  $ctrl.onSelect = accountType => {
    $ctrl.onSelectCallback({ accountType });
  };
}
