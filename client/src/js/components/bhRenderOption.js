angular.module('bhima.components')
  .component('bhRenderOption', {
    templateUrl : '/modules/templates/bhRenderOption.tmpl.html',
    controller : RenderOptionController,
    bindings : {
      orientation : '<', // one-way binding
      onChange : '&',
    },
  });

/**
 * bhRenderOption Component
 *
 * used for specifying the documents properties (layout, ...)
 * @example
 * <bh-render-option
 *  orientation="vm.orientation">
 * </bh-render-option>
 * @module components/bhRenderOption
 */
function RenderOptionController() {
  const ctrl = this;
  this.$onInit = function $onInit() {
    ctrl.orientation = ctrl.orientation || 'portrait';
  };

  this.setOrientation = ($item) => {
    ctrl.onChange({ orientation : $item });
  };
}
