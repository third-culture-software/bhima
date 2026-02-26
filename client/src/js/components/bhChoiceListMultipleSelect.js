angular.module('bhima.components')
  .component('bhChoiceListMultipleSelect', {
    templateUrl : 'modules/templates/bhChoiceListMultipleSelect.tmpl.html',
    controller  : ChoiceListMultipleSelectController,
    bindings    : {
      onChange : '&',
      lists : '<?',
      label : '@?',
      required : '<?',
      listLabel        : '@?',
      listHint         : '@?',
      isTitle          : '<?',
      isGroup          : '<?',
      parentId         : '<?',
      groupLabel       : '<?',
    },
  });

ChoiceListMultipleSelectController.$inject = [
  'ChoicesListManagementService', 'NotifyService',
];

/**
 * Choice List Multiple SelectController Component
 * @param ChoicesList
 * @param Notify
 */
function ChoiceListMultipleSelectController(ChoicesList, Notify) {
  const $ctrl = this;

  $ctrl.$onInit = function onInit() {

    $ctrl.selectedLists = $ctrl.lists || [];
    // init the model
    const query = {
      is_title : $ctrl.isTitle,
      is_group : $ctrl.isGroup,
      parent : $ctrl.parentId || null,
      group_label  : $ctrl.groupLabel || null,
    };

    ChoicesList.read(null, query)
      .then(elements => {
        $ctrl.elements = elements;
      })
      .catch(Notify.handleError);

  };

  $ctrl.$onChanges = (changes) => {
    if (changes.lists.currentValue) {
      $ctrl.selectedLists = changes.lists.currentValue;
    }
  };

  // fires the onSelectCallback bound to the component
  $ctrl.handleChange = lists => $ctrl.onChange({ lists });
}
