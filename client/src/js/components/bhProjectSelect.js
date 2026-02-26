angular.module('bhima.components')
  .component('bhProjectSelect', {
    templateUrl : 'modules/templates/bhProjectSelect.tmpl.html',
    controller  : ProjectSelectController,
    transclude  : true,
    bindings    : {
      projectId        : '<',
      onSelectCallback : '&',
      name             : '@?',
      required         : '<?',
    },
  });

ProjectSelectController.$inject = [
  'ProjectService', 'NotifyService',
];

/**
 * Project Select component
 * @param Projects
 * @param Notify
 */
function ProjectSelectController(Projects, Notify) {
  const $ctrl = this;

  $ctrl.$onInit = () => {
    Projects.read()
      .then((projects) => {
        $ctrl.projects = projects;
      })
      .catch(Notify.handleError);
  };

  // fires the onSelectCallback bound to the component boundary
  $ctrl.onSelect = (project) => {
    $ctrl.onSelectCallback({ project });
  };
}
