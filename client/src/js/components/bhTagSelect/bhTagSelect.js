angular.module('bhima.components')
  .component('bhTagSelect', {
    templateUrl : 'js/components/bhTagSelect/bhTagSelect.html',
    controller  : TagSelectController,
    transclude  : true,
    bindings    : {
      tagUuids         : '<',
      onSelectCallback : '&',
      required         : '<?',
      label            : '@?',
      enableAddTag     : '<?',
    },
  });

TagSelectController.$inject = ['$rootScope', 'TagService', 'NotifyService'];

/**
 * Tag selection component
 * @param $rootScope
 * @param Tags
 * @param Notify
 */
function TagSelectController($rootScope, Tags, Notify) {
  const $ctrl = this;

  $ctrl.createUpdateTagsModal = Tags.createUpdateTagsModal;

  $rootScope.$on('TAGS_CHANGED', () => {
    loadTags();
  });

  $ctrl.$onInit = function onInit() {
    $ctrl.label = $ctrl.label || 'TAG.TAGS';
    $ctrl.tagUuids = $ctrl.tagUuids || [];
    loadTags();
  };

  // fires the onSelectCallback bound to the component boundary
  $ctrl.onChanges = () => {
    $ctrl.onSelectCallback({ tags : $ctrl.tagUuids });
    loadTags();
  };

  $ctrl.getTagColor = t => {
    return t ? { color : t.color } : null;
  };

  /**
   *
   */
  function loadTags() {
    Tags.read()
      .then(tags => {
        const identifiers = $ctrl.tagUuids.map(t => t.uuid);
        $ctrl.tags = identifiers.length ? tags.filter(t => identifiers.includes(t.uuid) === false) : tags;
      })
      .catch(Notify.handleError);
  }
}
