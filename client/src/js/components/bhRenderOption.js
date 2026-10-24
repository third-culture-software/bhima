angular.module('bhima.components')
  .component('bhRenderOption', {
    templateUrl : '/modules/templates/bhRenderOption.tmpl.html',
    controller : RenderOptionController,
    bindings : {
      orientation : '<?', 
      onChange : '&',
    },
  });

/**
 * bhRenderOption Component
 *
 * used for specifying the documents properties (layout, ...)
 * @example
 * <bh-render-option
 *  orientation="vm.orientation"
 *  on-change="vm.onChangeOrientation(orientation)">
 * </bh-render-option>
 * @module components/bhRenderOption
 */
function RenderOptionController() {
  const ctrl = this;

  ctrl.$onInit = () => {
    ctrl.orientation = ctrl.orientation || 'portrait';
  };

  ctrl.setOrientation = (orientation) => {
    ctrl.onChange({ orientation });
  };
}
