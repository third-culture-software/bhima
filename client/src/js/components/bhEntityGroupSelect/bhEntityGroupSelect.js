angular.module('bhima.components')
  .component('bhEntityGroupSelect', {
    templateUrl : 'js/components/bhEntityGroupSelect/bhEntityGroupSelect.tmpl.html',
    controller  : EntityGroupSelectController,
    transclude  : true,
    bindings    : {
      uuid             : '<',
      onSelectCallback : '&',
      required         : '<?',
      label            : '@?',
    },
  });

EntityGroupSelectController.$inject = ['EntityGroupService', 'NotifyService'];

/**
 * EntityGroup selection component
 * @param EntityGroups
 * @param Notify
 */
function EntityGroupSelectController(EntityGroups, Notify) {
  const $ctrl = this;

  $ctrl.$onInit = function onInit() {
    $ctrl.label = $ctrl.label || 'ENTITY.GROUP.GROUP';
    $ctrl.multiple = $ctrl.multiple || false;

    // load all depots
    EntityGroups.read(null)
      .then(data => {
        $ctrl.entityGroups = data;
      })
      .catch(Notify.handleError);
  };

  // fires the onSelectCallback bound to the component boundary
  $ctrl.onSelect = $item => {
    $ctrl.onSelectCallback({ entityGroup : $item });
  };
}
