angular.module('bhima.components')
  .component('bhDashboardFilter', {
    templateUrl : 'js/components/bhDashboardFilter/bhDashboardFilter.html',
    controller  : DashboardFilterController,
    bindings    : {
      showServiceFilter : '<?',
      dateFrom : '<?',
      dateTo : '<?',
      onChange : '&?',
    },
  });

DashboardFilterController.$inject = [
  'ServiceService', 'NotifyService', 'bhConstants',
];

/**
 *
 * @param Services
 * @param Notify
 * @param bhConstants
 */
function DashboardFilterController(Services, Notify, bhConstants) {
  const $ctrl = this;

  $ctrl.selected = {};

  $ctrl.$onInit = function onInit() {
    $ctrl.dateFrom = $ctrl.dateFrom || new Date();
    $ctrl.dateTo = $ctrl.dateTo || new Date();

    $ctrl.dateFormat = bhConstants.dayOptions.format;
    $ctrl.pickerFromOptions = { showWeeks : false };
    $ctrl.pickerToOptions = { showWeeks : false, minDate : $ctrl.dateFrom };

    if ($ctrl.showServiceFilter) {
      Services.read()
        .then((services) => {
          $ctrl.services = services;
        })
        .catch(Notify.handleError);
    }
  };

  $ctrl.onServiceSelect = service => {
    $ctrl.selected.service = service;
    $ctrl.onChange({ selected : $ctrl.selected });
  };

  $ctrl.onDateFromChange = date => {
    $ctrl.selected.dateFrom = date;
    $ctrl.onChange({ selected : $ctrl.selected });
  };

  $ctrl.onDateToChange = date => {
    $ctrl.selected.dateTo = date;
    $ctrl.onChange({ selected : $ctrl.selected });
  };
}
