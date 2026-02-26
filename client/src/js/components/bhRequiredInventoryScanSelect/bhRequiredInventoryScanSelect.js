angular.module('bhima.components')
  .component('bhRequiredInventoryScanSelect', {
    templateUrl : 'js/components/bhRequiredInventoryScanSelect/bhRequiredInventoryScanSelect.tmpl.html',
    controller  : RequiredInventoryScanSelectController,
    transclude  : true,
    bindings    : {
      requiredInventoryScanUuid  : '<?',
      onSelectCallback           : '&',
      required                   : '<?',
    },
  });

RequiredInventoryScanSelectController.$inject = [
  'RequiredInventoryScansService', 'NotifyService',
];

/**
 * Required Inventory Scan selection component
 * @param RequiredInventoryScans
 * @param Notify
 */
function RequiredInventoryScanSelectController(RequiredInventoryScans, Notify) {
  const $ctrl = this;

  $ctrl.$onInit = function onInit() {

    // load all required inventory scans
    $ctrl.loading = true;
    RequiredInventoryScans.list()
      .then(scans => {
        $ctrl.required_scans = scans;
      })
      .catch(Notify.handleError)
      .finally(() => {
        $ctrl.loading = false;
      });
  };

  // fires the onSelectCallback bound to the component callback
  $ctrl.onSelect = (scan) => $ctrl.onSelectCallback({ scan });
}
