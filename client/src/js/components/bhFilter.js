angular.module('bhima.components')
  .component('bhFilter', {
    templateUrl : 'modules/templates/bhFilter.tmpl.html',
    controller : bhFilterController,
    bindings : {
      filter : '<',
      onRemove : '&',
    }
    ,
  });

/**
 *
 */
function bhFilterController() {
  const $ctrl = this;
  const DEFAULT_FILTER_COMPARITOR = ':';

  $ctrl.$onInit = function onInit() {
    // fill in label details required by the template
    $ctrl.filter = $ctrl.filter || {};
    $ctrl.filter.comparitorLabel = $ctrl.filter._comparitor || DEFAULT_FILTER_COMPARITOR;
  };
}
