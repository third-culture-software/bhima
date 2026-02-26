angular.module('bhima.controllers')
  .controller('ReportsArchiveController', ReportsArchiveController);

ReportsArchiveController.$inject = [
  '$state', 'BaseReportService', 'NotifyService', 'reportData',
];

/**
 *
 * @param $state
 * @param SavedReports
 * @param Notify
 * @param reportData
 */
function ReportsArchiveController($state, SavedReports, Notify, reportData) {
  const vm = this;

  const typeTemplate = `
  <div class="ui-grid-cell-contents">
    <i class="fa" ng-class="row.entity.icon" ng-attr-title="{{row.entity.extension}}"></i>
  </div>`.trim();

  const dateTemplate = `
    <div class="ui-grid-cell-contents">
      {{ row.entity.timestamp | date }} (<span am-time-ago="row.entity.timestamp"></span>)
    </div>`.trim();

  const printTemplate = `
  <div class="ui-grid-cell-contents">
    <span ng-if="row.entity.isPrintable">
      <bh-pdf-link pdf-url="/reports/archive/{{row.entity.uuid}}"></bh-pdf-link>
    </span>
  </div>`.trim();

  const reportId = reportData.id;
  vm.key = $state.params.key;

  vm.deleteReport = deleteReport;
  vm.emailReport = emailReport;

  vm.gridOptions = {
    fastWatch : true,
    flatEntityAccess : true,
    enableColumnMenus : false,
    enableSorting : false,
    appScopeProvider : vm,
  };

  vm.gridOptions.columnDefs = [
    {
      field : 'typeicon', displayName : '', cellTemplate : typeTemplate, width : 25,
    },
    { field : 'label', displayName : 'FORM.LABELS.LABEL', headerCellFilter : 'translate' },
    {
      field : 'timestamp',
      displayName : 'FORM.LABELS.DATE_CREATED',
      headerCellFilter : 'translate',
      cellTemplate : dateTemplate,
      sort : { priority : 0, direction : 'desc' },
    },
    { field : 'display_name', displayName : 'FORM.LABELS.USER', headerCellFilter : 'translate' },
    {
      field : 'print', displayName : '', cellTemplate : printTemplate, width : 90,
    },
    {
      field : 'actions', displayName : '', cellTemplate : '/modules/templates/actionsDropdown.html', width : 80,
    },
  ];

  // load reports
  loadSavedReports();

  /**
   *
   * @param uuid
   */
  function deleteReport(uuid) {
    SavedReports.deleteReport(uuid)
      .then(() => {
        Notify.success('FORM.INFO.DELETE_SUCCESS');
        loadSavedReports();
      })
      .catch(Notify.handleError);
  }

  /**
   *
   * @param uid
   * @param name
   */
  function emailReport(uid, name) {
    SavedReports.emailReportModal({ uuid : uid, reportName : name })
      .then((result) => {
        if (result.sent) {
          Notify.success('FORM.INFO.EMAIL_SUCCESS');
        }
      })
      .catch(Notify.handleError);
  }

  /**
   *
   */
  function loadSavedReports() {
    vm.loading = true;

    // Load archived reports
    SavedReports.listSavedReports(reportId)
      .then((results) => {
        results.forEach(row => {
          row.icon = SavedReports.parseFileUrlToIcon(row.link);
          row.extension = SavedReports.parseFileUrlToExtension(row.link);
          row.isPrintable = row.extension === 'pdf';
        });

        vm.gridOptions.data = results;
      })
      .catch(() => {
        vm.hasError = true;
      })
      .finally(() => {
        vm.loading = false;
      });
  }
}
