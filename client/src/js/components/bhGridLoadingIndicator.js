angular.module('bhima.components')
  .component('bhGridLoadingIndicator', {
    bindings : {
      loadingState : '<',
      loadingStateMessage : '@?',
      emptyState : '<',
      emptyStateMessage : '@?',
      errorState : '<',
      errorStateMessage : '@?',
    },
    templateUrl : 'modules/templates/bhGridLoadingIndicator.tmpl.html',
  });
