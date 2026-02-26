angular.module('bhima.components')
  .component('bhCronEmailReport', {
    templateUrl : 'js/components/bhCronEmailReport/bhCronEmailReport.html',
    controller  : bhCronEmailReportController,
    transclude  : true,
    bindings    : {
      reportKey      : '@',
      reportForm     : '<',
      reportDetails  : '<',
      onSelectReport : '&',
    },
  });

bhCronEmailReportController.$inject = [
  'CronEmailReportService', 'NotifyService', 'SessionService',
  'BaseReportService',
];

/**
 *
 * @param CronEmailReports
 * @param Notify
 * @param Session
 * @param BaseReport
 */
function bhCronEmailReportController(CronEmailReports, Notify, Session, BaseReport) {
  const $ctrl = this;

  $ctrl.submit = submit;
  $ctrl.remove = remove;
  $ctrl.details = details;
  $ctrl.send = send;

  $ctrl.onSelectEntityGroup = entityGroup => {
    $ctrl.cron.entity_group_uuid = entityGroup.uuid;
  };

  $ctrl.onSelectCron = cron => {
    $ctrl.cron.cron_id = cron.id;
  };

  $ctrl.onChangeDynamicDates = value => {
    $ctrl.cron.has_dynamic_dates = value;
  };

  $ctrl.$onInit = init;

  /**
   *
   */
  function init() {
    $ctrl.isEmailFeatureEnabled = Session.enterprise.settings.enable_auto_email_report;

    loadReportDetails($ctrl.reportKey)
      .then(([report]) => {
        $ctrl.cron = {
          report_id : report.id,
          has_dynamic_dates : 0,
        };

        return load(report.id);
      });
  }

  /**
   *
   * @param key
   */
  function loadReportDetails(key) {
    return BaseReport.requestKey(key);
  }

  /**
   *
   * @param id
   */
  function load(id) {
    CronEmailReports.read(null, { report_id : id })
      .then(rows => {
        $ctrl.list = rows;
      })
      .catch(Notify.handleError);
  }

  /**
   *
   * @param id
   */
  function details(id) {
    CronEmailReports.read(id)
      .then(row => {
        if (!row) { return; }
        const report = JSON.parse(row.params);
        $ctrl.onSelectReport({ report });
      })
      .catch(Notify.handleError);
  }

  /**
   *
   * @param id
   */
  function send(id) {
    $ctrl.sendingPending = true;
    CronEmailReports.send(id)
      .then(() => {
        Notify.success('CRON.EMAIL_SENT_SUCCESSFULLY');
      })
      .catch(Notify.handleError)
      .finally(() => {
        $ctrl.sendingPending = false;
      });
  }

  /**
   *
   * @param id
   */
  function remove(id) {
    CronEmailReports.delete(id)
      .then(() => load($ctrl.cron.report_id))
      .catch(Notify.handleError);
  }

  /**
   *
   * @param cronForm
   */
  function submit(cronForm) {
    if ($ctrl.reportForm && $ctrl.reportForm.$invalid) {
      Notify.warn('CRON.PLEASE_FILL_REPORT_FORM');
      return false;
    }

    if (cronForm.$invalid) {
      Notify.warn('CRON.PLEASE_FILL_REPORT_FORM');
      return false;
    }

    const params = {
      cron : $ctrl.cron,
      reportOptions : $ctrl.reportDetails,
    };

    return CronEmailReports.create(params)
      .then(() => reset(cronForm))
      .then(() => init())
      .catch(Notify.handleError);
  }

  /**
   *
   * @param form
   */
  function reset(form) {
    form.CronForm.$setPristine();
    form.EntityGroupForm.$setPristine();
    form.textValueForm.$setPristine();
  }
}
