angular.module('bhima.components')
  .component('bhBadge', {
    templateUrl : 'modules/voucher-tools/shared/voucher-tools.badge.tmpl.html',
    bindings : {
      voucherTools : '@?',
    },
    controller : bhBadge,
  });

/**
 *
 */
function bhBadge() {
  const $ctrl = this;

  const labelMap = {
    voucherTools : {
      label : 'label-voucher-tools',
      text : 'VOUCHERS.TOOLS.BADGE',
    },
  };

  // @TODO(sfount) component has no fallback state, user must specify a binding
  //               using a map element as fallback could lead to unexpected results
  $ctrl.$onInit = function onInit() {
    // look for the first defined key
    Object.keys(labelMap).some((labelBinding) => {
      if (angular.isDefined($ctrl[labelBinding])) {
        setActiveBadge(labelMap[labelBinding]);
        return true;
      }
      return false;
    });
  };

  /**
   *
   * @param details
   */
  function setActiveBadge(details) {
    $ctrl.label = details.label;
    $ctrl.text = details.text;
  }
}
