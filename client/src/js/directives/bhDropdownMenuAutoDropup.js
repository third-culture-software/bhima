/*
  @bh-dropdown-menu-auto-dropup directive
  This directive check if html element's position is on the bottom if true it
  changes the element's position in order to display it conveniently.

  This directive is useful for carets for example
  Pages won't falls off page thanks to this directive if the user click on a dropdown

  Usage example
  .............

  <ul uib-dropdown-menu  bh-dropdown-menu-auto-dropup>
  </ul>

*/
angular.module('bhima.directives')
  .directive('bhDropdownMenuAutoDropup', ['$document', '$window', 'util', ($document, $window, util) => {
    return {
      restrict : 'AC',
      link(scope, iElement) {
        const iElementWrapper = iElement.parent();
        let documentHeight = angular.element($document).height();
        const offset = 35;

        // only recalculate the document height on window resize
        angular.element($window)
          .on('resize', util.debounce(handleWindowResize, 50));

        /**
         *
         */
        function handleWindowResize() {
          documentHeight = angular.element($document).height();
        }

        /**
         *
         */
        function handleClick() {
          const iElementWrapperOffsetTop = iElementWrapper.offset().top;
          const iElementHeight = iElement.height();

          const shouldDropUp = (documentHeight - iElementHeight - offset) < iElementWrapperOffsetTop;
          const position = shouldDropUp
            ? '-'.concat(iElementHeight + 35, 'px')
            : '0px';

          iElement.css({ 'margin-top' : position });
        }

        iElementWrapper.on('click', () => {
          scope.$apply(handleClick);
        });
      },
    };
  }]);
