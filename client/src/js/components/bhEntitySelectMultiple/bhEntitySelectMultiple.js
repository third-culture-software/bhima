angular.module('bhima.components')
  .component('bhEntitySelectMultiple', {
    templateUrl : 'js/components/bhEntitySelectMultiple/bhEntitySelectMultiple.tmpl.html',
    controller  : EntitySelectMultipleController,
    transclude  : true,
    bindings    : {
      entityUuids      : '<',
      onSelectCallback : '&',
      required         : '<?',
      label            : '@?',
    },
  });

EntitySelectMultipleController.$inject = ['EntityService', 'NotifyService'];

/**
 * Entity selection component
 * @param Entities
 * @param Notify
 */
function EntitySelectMultipleController(Entities, Notify) {
  const $ctrl = this;

  $ctrl.$onInit = function onInit() {
    $ctrl.label = $ctrl.label || 'ENTITY.LABEL';
    $ctrl.entityUuids = $ctrl.entityUuids || [];
    loadEntities();
  };

  // fires the onSelectCallback bound to the component boundary
  $ctrl.onChanges = () => {
    $ctrl.onSelectCallback({ entities : $ctrl.entityUuids });
    loadEntities();
  };

  /**
   *
   */
  function loadEntities() {
    Entities.read(null)
      .then(entities => {
        if ($ctrl.entityUuids.length) {
          const givenEntities = $ctrl.entityUuids.map(e => e.uuid);
          $ctrl.entities = entities.filter(e => {
            return givenEntities.includes(e.uuid) === false;
          });
        } else {
          $ctrl.entities = entities;
        }

      })
      .catch(Notify.handleError);
  }
}
