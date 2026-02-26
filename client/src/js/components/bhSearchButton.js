const template = `
<div class="toolbar-item">
  <button
    ng-click="$ctrl.onClick()"
    data-method="search"
    class="btn btn-default">
    <span class="fa fa-search"></span> <span class="hidden-xs" translate>FORM.BUTTONS.SEARCH</span>
  </button>
</div>
`;

/**
 * @component bhSearchButton
 * @usage
 * <bh-search-button on-click="Ctrl.search()"></bh-search-button>
 * @description
 * Renders a consistent search button presentation and behavior across the application.
 */
angular.module('bhima.components')
  .component('bhSearchButton', {
    template,
    bindings : { onClick : '&' },
  });
