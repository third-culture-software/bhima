angular.module('bhima.components')
  .component('bhFilterToggle', {
    templateUrl : 'modules/templates/bhFilterToggle.tmpl.html',
    controller : ToggleFillterController,
    bindings : {
      onToggle : '&', // use a callback to handle on click function
    },
  });

/**
 * @component bhFilterToggle
 * @description
 * An easy way to add the standard filtering button to the ui-grid.  Note that
 * this component only contains the view, not the filtering logic.  The parent
 * controller is responsible for controlling the logic by binding the "onToggle"
 * callback.
 *
 * USAGE:
 * <bh-filter-toggle on-toggle="SomeController.toggleInlineFilter()">
 * </bh-filter-toggle>
 */
function ToggleFillterController() {
  const $ctrl = this;

  $ctrl.$onInit = function onInit() {
    $ctrl.filterEnabled = false;
  };

  $ctrl.toggle = () => {
    $ctrl.filterEnabled = !$ctrl.filterEnabled;
    $ctrl.onToggle();
  };
}
