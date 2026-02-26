angular.module('bhima.components')
  .component('bhMultipleDepotSelect', {
    templateUrl : 'modules/templates/bhMultipleDepotSelect.tmpl.html',
    controller  : MultipleDepotSelectController,
    bindings    : {
      onChange : '&',
      depotUuids : '<?',
      label : '@?',
      required : '<?',
      filterByUserPermission  : '@?',
      filterAuthorizedDepotForDistribution : '@?',
      filterManagementSupervision : '@?',
      filterAllowedDistributionDepots : '@?',
      onSelectCallback : '&',
      disabled         : '<?',
      exception        : '<?', // uuid string or an array of uuids
    },
  });

MultipleDepotSelectController.$inject = [
  'DepotService', 'NotifyService',
];

/**
 * Multiple depot Selection Component
 * @param Depots
 * @param Notify
 */
function MultipleDepotSelectController(Depots, Notify) {
  const $ctrl = this;

  $ctrl.$onInit = () => {

    // label to display
    $ctrl.label = $ctrl.label || 'FORM.SELECT.DEPOTS';

    // init the model
    $ctrl.depotUuids = $ctrl.depotUuids || [];

    const options = {};

    if ($ctrl.filterByUserPermission) {
      options.only_user = true;
    }

    // For the selection of supplier depots
    if ($ctrl.filterAuthorizedDepotForDistribution) {
      options.only_distributor = true;
    }

    // For selection of beneficiary deposits
    if ($ctrl.filterAllowedDistributionDepots) {
      options.only_depot_allowed_distribution = true;
    }

    if ($ctrl.filterManagementSupervision) {
      options.only_management_supervision = true;
    }

    // load all depots
    Depots.read(null, options)
      .then(depots => {
        depots.sort((a, b) => a.label > b.label);

        $ctrl.depots = depots;
      })
      .catch(Notify.handleError);
  };

  $ctrl.handleChange = (depots) => $ctrl.onChange({ depots });
}
