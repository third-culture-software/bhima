angular.module('bhima.components')
  .component('bhInputText', {
    templateUrl : 'modules/templates/bhInputText.tmpl.html',
    controller : InputTextController,
    transclude : true,
    bindings : {
      textValue : '=',
      required : '@?',
      label : '@?',
      leftLabel : '<?',
      placeholder : '@?',
      autocomplete : '@?',
      type : '@?',
      onChange : '&',
      key : '@?',
      description : '@?',
      isCurrency : '<?',
      disabled : '<?',
      maxLength : '@?',
      min   : '@?',
    },
  });

InputTextController.$inject = ['CurrencyService', 'SessionService'];

/**
 * input fiel component
 * @param Currencies
 * @param Session
 */
function InputTextController(Currencies, Session) {
  const $ctrl = this;

  // fired at the beginning
  $ctrl.$onInit = () => {
    $ctrl.type = $ctrl.type || 'text';
    $ctrl.key = $ctrl.key || 'inputText';
    $ctrl.placeholder = $ctrl.placeholder || '';
    $ctrl.noLabel = $ctrl.noLabel || false;
    $ctrl.onChange = $ctrl.onChange || angular.noop;
    $ctrl.autocomplete = $ctrl.autocomplete || 'on';

    if ($ctrl.isCurrency) {
      loadCurrency(Session.enterprise.currency_id);
    }
  };

  $ctrl.valueChange = () => {
    $ctrl.onChange({ key : $ctrl.key, value : $ctrl.textValue });
  };

  /* @private loads a particular currency from the server */
  /**
   *
   * @param id
   */
  function loadCurrency(id) {
    if (!angular.isDefined(id)) { return; }

    // load currency from the currency service
    Currencies.detail(id)
      .then(currency => {
        $ctrl.currency = currency;
      });
  }
}
