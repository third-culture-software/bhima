angular.module('bhima.components')
  .component('bhEntitySelect', {
    templateUrl : 'js/components/bhEntitySelect/bhEntitySelect.tmpl.html',
    controller  : EntitySelectController,
    transclude  : true,
    bindings    : {
      entityUuid       : '<',
      onSelectCallback : '&',
      required         : '<?',
      label            : '@?',
    },
  });

EntitySelectController.$inject = ['EntityService', 'NotifyService'];

/**
 * Entity selection component
 * @param Entities
 * @param Notify
 */
function EntitySelectController(Entities, Notify) {
  const $ctrl = this;

  $ctrl.$onInit = function onInit() {
    $ctrl.label = $ctrl.label || 'ENTITY.LABEL';
    $ctrl.multiple = $ctrl.multiple || false;

    // load all depots
    Entities.read(null)
      .then((entities) => {
        $ctrl.entities = entities;
      })
      .catch(Notify.handleError);
  };

  // fires the onSelectCallback bound to the component boundary
  $ctrl.onSelect = $item => {
    $ctrl.onSelectCallback({ entity : $item });
  };
}
