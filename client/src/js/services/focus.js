/**
 * This service helps to give the focus on an element
 * by it Id
 * @example
 * .controller('Ctrl', function($scope, focus) {
 *  $scope.doSomething = function() {
 *    // give the focus to the element with id = "email"
 *    focus('email');
 *  };
 * });
 */
angular.module('bhima.services')
  .factory('focus', Focus);

Focus.$inject = ['$timeout', '$window'];

/**
 *
 * @param $timeout
 * @param $window
 */
function Focus($timeout, $window) {
  return (id) => {
    $timeout(() => {
      const element = $window.document.getElementById(id);
      if (element) { element.focus(); }
    });
  };
}
