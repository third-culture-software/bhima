angular.module('bhima.components')
  .component('bhTitleSelect', {
    templateUrl : 'modules/templates/bhTitleSelect.tmpl.html',
    controller  : TitleSelectController,
    transclude  : true,
    bindings    : {
      titleId        : '<',
      onSelectCallback : '&',
      label : '@?',
    },
  });

TitleSelectController.$inject = [
  'TitleService', 'NotifyService',
];

/**
 * Title Select Controller
 * @param titles
 * @param Notify
 */
function TitleSelectController(titles, Notify) {
  const $ctrl = this;
  $ctrl.$onInit = function onInit() {
    $ctrl.label = $ctrl.label || 'FORM.LABELS.TITLE_JOB';

    titles.read()
      .then(fct => {
        $ctrl.titles = fct;
      })
      .catch(Notify.handleError);
  };

  // fires the onSelectCallback bound to the component boundary
  $ctrl.onSelect = ($item) => {
    $ctrl.onSelectCallback({ title : $item });
  };
}
