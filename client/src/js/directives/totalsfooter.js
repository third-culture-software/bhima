angular.module('bhima.directives')
  .directive('totalsFooter', TotalsFooterDirective);

function TotalsFooterDirective() {
  return {
    restrict : 'A',
    transclude : true,
    scope : {

      // Direct model binding to the grid that should be tracked
      grid : '=',

      // One time binding for a setting that should not change
      leadingColumns : '@',
    },
    template : '<ng-transclude></ng-transclude>',
    link : function linkFn(scope) {

      // Variable to track grid columns in order to calculate widths
      let columns;

      // FIXME hard-coded navigation offset
      let navigationOffset = 0;

      // Object to be exposed to parent scope - allowing custom widths to be set
      // dependent on the columns of the grid object provided
      const trackGridColumns = { width : null };

      // Reference grid passed in parameter - this will be used to calculate
      // %'s for column widths
      const { grid } = scope;

      // This variable keeps track of the current callback to be fired on
      // API registration - this can be refined if someone can think of a better
      // way of exposing the columns object without adding controller code
      const interceptOnRegisterApi = grid.onRegisterApi;

      // The number of columns that the directive should calculate the width of,
      // this will determine the column that the totals should line up with
      // (defaults to 1 column)
      const leadingColumns = scope.leadingColumns || 1;

      // the $rootScope will send a 'nav:toggle' event when the navigation is toggled open/close.
      // this allows us to update the column when the navigation flexed.
      // FIXME hardcoded navigation offset
      scope.$on('nav:toggle', (e, open) => {
        navigationOffset = (open) ? 260 : 0;
        updateColumnWidths();
      });

      grid.onRegisterApi = function intercept(gridApi) {
        const columnReference = gridApi.grid.columns;

        // Make column reference available to internal scope
        columns = columnReference;

        // Hook into grid rendering event - this will allow us to only update
        // column widths when the grid has redrawn a row. This is much more
        // effecient than watching an object with angulars $scope.$watch
        gridApi.core.on.rowsRendered(null, updateColumnWidths);

        // Expose external scope to track column width number
        // note : this could be passed in through a parameter track-columns that
        // would then be assigned width - this assumes a configured UI grid
        grid.appScopeProvider.trackColumns = trackGridColumns;

        // Pass the grid API onto the controller if it is defined
        if (angular.isDefined(interceptOnRegisterApi)) {
          interceptOnRegisterApi(gridApi);
        }
      };

      function updateColumnWidths() {
        trackGridColumns.width = columns.reduce(sumColumnWidths, 0);
        trackGridColumns.trackedWidth = columns[leadingColumns].drawnWidth - navigationOffset;
      }

      function sumColumnWidths(currentWidth, column, index) {
        let adjustedWidth = currentWidth;
        if (index < leadingColumns) {
          adjustedWidth += column.drawnWidth;
        }
        return adjustedWidth;
      }
    },
  };
}
