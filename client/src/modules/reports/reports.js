angular.module('bhima.controllers')
  .controller('ReportsController', ReportsController);

ReportsController.$inject = [
  '$state', 'reportData', '$scope', 'BaseReportService',
];

// TODO(@jniles) - make the archive work into a component.
/**
 *
 * @param $state
 * @param reportData
 * @param $scope
 * @param SavedReports
 */
function ReportsController($state, reportData, $scope, SavedReports) {
  const vm = this;
  const archiveState = 'reportsBase.reportsArchive';
  vm.isArchive = isArchive;
  /**
   *
   */
  function isArchive() {
    return $state.current.name === archiveState;
  }

  vm.SavedReports = SavedReports;
}
