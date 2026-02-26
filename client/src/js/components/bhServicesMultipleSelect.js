angular.module('bhima.components')
  .component('bhServicesMultipleSelect', {
    templateUrl : 'modules/templates/bhServicesMultipleSelect.tmpl.html',
    controller  : ServicesMultipleSelectController,
    bindings    : {
      onChange : '&',
      servicesIds : '<?',
      label : '@?',
      required : '<?',
    },
  });

ServicesMultipleSelectController.$inject = [
  'ServiceService', 'NotifyService',
];

/**
 * Services Selection Component
 * @param Services
 * @param Notify
 */
function ServicesMultipleSelectController(Services, Notify) {
  const $ctrl = this;

  $ctrl.$onInit = function onInit() {
    // label to display
    $ctrl.label = $ctrl.label || 'FORM.LABELS.SERVICES';

    // init the model
    $ctrl.selectedServices = $ctrl.servicesIds || [];

    // load all Services
    Services.read()
      .then((services) => {
        $ctrl.services = services;
      })
      .catch(Notify.handleError);
  };

  // fires the onSelectCallback bound to the component
  $ctrl.handleChange = (services) => {
    $ctrl.onChange({ services });
  };
}
