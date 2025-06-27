angular.module('bhima.directives')
  .directive('loadingIndicator', () => {
    return {
      restrict : 'E',
      // eslint-disable-next-line
      template: `<p><p class="text-info"><span class="fa fa-circle-o-notch fa-spin"></span> <span translate>FORM.INFO.LOADING</span></p></p>`,
    };
  });
