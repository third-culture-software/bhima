angular.module('bhima.directives')
  .directive('bhHasPermission', bhHasPermission);

bhHasPermission.$inject = ['SessionService'];

/**
 * @param Session
 * @function bhHasPermission
 * @description
 * A sort directive to remove the underlying HTML if the user does not have the
 * appropriate permission to access it.
 *
 * USAGE:
 * <element bh-has-permission="bhConstants.actions.SOME_ACTION"></element>
 */
function bhHasPermission(Session) {
  return {
    restrict : 'A',
    scope : { bhHasPermission : '<' },
    link : (scope, element) => {
      const hasPermission = Session.hasUserAction(scope.bhHasPermission);
      // remove setting if not available
      if (!hasPermission) {
        element.remove();
      }
    },
  };
}
