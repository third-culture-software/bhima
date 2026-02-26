angular.module('bhima.directives')
  .directive('bhSubmit', bhSubmitDirective);

/**
 *
 */
function bhSubmitDirective() {
  return {
    restrict : 'A',
    require : 'form', // make sure we are on an ngForm element
    priority : 1, // This must be a number greater than zero
    scope : {
      submit : '&bhSubmit',
    },
    link : function bhSubmitLinkFn($scope, $element, $attrs, $controller) {

      // pick up the form controller
      const FormController = $controller;

      // bind the initial loading state to false
      FormController.$loading = false;

      // bind the $toggleLoading method to switch the form's loading state
      FormController.$toggleLoading = function $toggleLoading() {
        FormController.$loading = !FormController.$loading;
      };

      // check to see if an object is a promise
      /**
       *
       * @param object
       */
      function isPromise(object) {
        return object && angular.isFunction(object.finally);
      }

      // the function is called on the 'submit' event
      /**
       *
       */
      function submitEventHandler() {

        // start the loading state
        FormController.$toggleLoading();

        // make sure the form is registered as submitted
        FormController.$setSubmitted();

        // fire the submit method
        const response = $scope.submit();

        // the response is a promise, toggle the loading state on
        // fulfillment/rejection
        if (isPromise(response)) {
          response
            .then(() => FormController.$toggleLoading())
            .catch(() => FormController.$toggleLoading());

        // otherwise, toggle the loading state off right away.
        } else {
          FormController.$toggleLoading();
        }

      }

      // bind to the 'submit' event, ensure a $digest loop is run
      $element.bind('submit', () => {
        $scope.$apply(submitEventHandler);
      });
    },
  };
}
