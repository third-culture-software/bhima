angular.module('bhima.components')
  .component('bhEntityTypeSelect', {
    templateUrl : 'js/components/bhEntityTypeSelect/bhEntityTypeSelect.tmpl.html',
    controller  : EntityTypeSelectController,
    transclude  : true,
    bindings    : {
      id               : '<',
      onSelectCallback : '&',
      required         : '<?',
      label            : '@?',
    },
  });

EntityTypeSelectController.$inject = ['EntityService', 'NotifyService', '$translate'];

/**
 * EntityType selection component
 * @param Entities
 * @param Notify
 * @param $translate
 */
function EntityTypeSelectController(Entities, Notify, $translate) {
  const $ctrl = this;

  $ctrl.$onInit = function onInit() {

    // load all entity types
    Entities.types.read(null)
      .then((types) => {
        $ctrl.types = types.map(type => {
          type.hrLabel = $translate.instant(type.translation_key || type.label);
          return type;
        });

      })
      .catch(Notify.handleError);
  };

  // fires the onSelectCallback bound to the component boundary
  $ctrl.onSelect = $item => {
    $ctrl.onSelectCallback({ type : $item });
  };
}
