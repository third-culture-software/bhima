angular.module('bhima.directives')


  /**
   * This horrible directive exists because chrome somehow killed the rendering of angularjs in the srcdoc 
   * attribute.
   */

  .directive('bhReportSrcdoc', ['$sce', '$timeout', function ($sce, $timeout) {
    return {
      restrict: 'A',
      scope: { bhReportSrcdoc: '<' },
      link: function (scope, element) {
        let iframe = element[0];

        scope.$watch('bhReportSrcdoc', function (value) {
          if (!value) return;

          const html = $sce.trustAsHtml(value);

          iframe.removeAttribute('srcdoc');
          iframe.src = 'about:blank';

          $timeout(function () {
            iframe.srcdoc = html; 
          }, 0);
        });
      }
    };
  }]);
