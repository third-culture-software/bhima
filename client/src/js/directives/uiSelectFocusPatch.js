/**
 * This is a temporary directive used to resolve known issues with angular-ui-select
 * and ng-animate. It is used to focus the input on the angular-ui-select when
 * it is selected. If this directive is not placed this will not automatically be
 * fired.
 *
 * This directive should be removed when it is possible to update angular animate/
 * angular-ui-select with the mentioned issues resolved.
 *
 * @example
 * <ui-select-choices ui-select-focus-patch>
 * </ui-select-choices>
 */
angular.module('bhima.directives')
  .directive('uiSelectFocusPatch', ['$animate', ($animate) => {
    return {
      link(scope, element) { $animate.enabled(element, false); },
    };
  }]);
