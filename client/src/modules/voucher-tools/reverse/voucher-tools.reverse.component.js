angular.module('bhima.components')
  .component('bhVoucherToolsReverse', {
    templateUrl : 'modules/voucher-tools/reverse/voucher-tools.reverse.tmpl.html',
    controller : bhVoucherToolsReverse,
    bindings : {
      source : '<',
      onClose : '&?',
      showBadge : '@?',
    },
  });

bhVoucherToolsReverse.$inject = ['VoucherService', '$translate'];

/**
 * @param Vouchers
 * @param $translate
 * @component bhVoucherToolsReverse
 * @description
 * A tool in the voucher-tools collection. Responsible for reversing any given
 * transaction.
 *
 * Bindings:
 * `source`: an object defining the input parameters for the reverse action, in
 *           this case source expects an object defining a (required) `transaction_id`
 * `show-badge`: display the `bh-voucher-tools-status-badge` element
 * @example
 * ```html
 * <bh-voucher-tools-reverse
 *  source="{ transaction_id : Ctrl.transaction_id">
 * </bh-voucher-tools-reverse>
 * ```
 */
function bhVoucherToolsReverse(Vouchers, $translate) {
  const $ctrl = this;

  $ctrl.state = {
    input : true,
    errored : false,
    pending : false,
    flag : null,
  };

  const VOUCHER_TOOLS_REVERSE_DESCRIPTION = 'VOUCHERS.TOOLS.REVERSE.DESCRIPTION';

  $ctrl.$onChanges = function onChanges(changes) {

    if (changes.source && changes.source.currentValue) {
      // standard process naming conventions
      $ctrl.input = changes.source.currentValue;
    }

    if (changes.showBadge && angular.isDefined(changes.showBadge.currentValue)) {
      // any binding for show-badge should be accepted by the `ng-if` condition
      $ctrl.showBadge = true;
    }

  };

  // record_uuid - uuid of transaction to be reversed
  // trans_id - human readable string version of transaction id
  $ctrl.actionSubmitInput = function actionSubmitInput() {
    $ctrl.state.pending = true;

    // check component has been configured correctly
    if (!($ctrl.input && $ctrl.input.record_uuid)) {
      handleErrors({ data : { code : 'VOUCHERS.TOOLS.ERRORS.NO_INPUT_PROVIDED' } });
      return null;
    }

    // get description according to the users language
    // assume everything has loaded correctly by the time this code is running
    const description = `${$translate.instant(VOUCHER_TOOLS_REVERSE_DESCRIPTION)} ${$ctrl.input.trans_id}`;

    const packaged = {
      uuid : $ctrl.input.record_uuid,
      description,
    };
    return Vouchers.reverse(packaged)
      .then((result) => {
        // result should contain voucher uuid along with additional voucher infomration
        $ctrl.state.errored = false;
        $ctrl.state.input = false;
        $ctrl.output = result;
      })
      .catch(handleErrors)
      .finally(() => {
        $ctrl.state.pending = false;
      });
  };

  // internally handle errors thrown during the input -> process -> output
  // steps within this component;
  /**
   *
   * @param error
   */
  function handleErrors(error) {
    $ctrl.state.errored = true;
    $ctrl.state.flag = error.data.code;
  }
}
