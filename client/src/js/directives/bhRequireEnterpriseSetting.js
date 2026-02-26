angular.module('bhima.directives')
  .directive('bhRequireEnterpriseSetting', bhRequireEnterpriseSetting);

bhRequireEnterpriseSetting.$inject = ['SessionService'];

/**
 * @param Session
 * @function bhRequireEnterpriseSetting
 * @description
 * A sort directive to remove the underlying HTML if the Enterprise Setting is
 * not set.
 */
function bhRequireEnterpriseSetting(Session) {
  return {
    restrict : 'A',
    scope : { bhRequireEnterpriseSetting : '@bhRequireEnterpriseSetting' },
    link : (scope, element, attrs) => {
      const hasRequiredSetting = Session.isSettingEnabled(attrs.bhRequireEnterpriseSetting);

      // remove setting if not available
      if (!hasRequiredSetting) {
        element.remove();
      }
    },
  };
}
