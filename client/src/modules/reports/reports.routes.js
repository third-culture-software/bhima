angular.module('bhima.routes')
  .config(['$stateProvider', $stateProvider => {
    // a list of all supported reported and their respective keys, this allows
    // the ui-view to be populated with the correct report configuration form
    const SUPPORTED_REPORTS = [
      'account_reference',
      'account_report',
      'account_report_multiple',
      'aged_creditors',
      'aged_debtors',
      'analysis_auxiliary_cashboxes',
      'annual_clients_report',
      'avg_med_costs_per_patient',
      'balance_report',
      'balance_sheet_report',
      'cashflow',
      'cashflow_by_service',
      'cash_report',
      'client_debts',
      'client_support',
      'configurable_analysis_report',
      'cost_center_accounts',
      'cost_center_income_and_expense',
      'cost_center_step_down',
      'data_kit',
      'debtor_summary',
      'employee_standing',
      'indicators_report',
      'inventory_changes',
      'inventory_report',
      'invoiced_received_stock',
      'lost_stock_report',
      'monthly_balance',
      'monthly_consumption_report',
      'needed_inventory_scans',
      'ohada_balance_sheet_report',
      'ohada_profit_loss',
      'open_debtors',
      'operating',
      'patient_standing',
      'purchase_order_analysis',
      'purchase_prices',
      'realized_profit',
      'recovery_capacity',
      'rumer_report',
      'satisfaction_rate_report',
      'stock_entry',
      'stock_exit',
      'stock_expiration_report',
      'stock_movement_report',
      'stock_sheet',
      'stock_value',
      'system_usage_stat',
      'unpaid_invoice_payments',
      'visit_report',
      'budget_report',
    ];

    /**
     *
     * @param $stateParams
     * @param SavedReports
     */
    function resolveReportData($stateParams, SavedReports) {
      const reportKey = $stateParams.key;

      return SavedReports.requestKey(reportKey)
        .then((results) => {
          const data = results[0];
          data.params = { ...$stateParams };
          return data;
        });
    }

    // make sure that the state's transitions refresh the abstract state
    const onEnter = ['$transition$', '$state$', (transition, state) => {
      const { key } = state.params;
      const SavedReports = transition.injector().get('BaseReportService');

      // run to update the current report.
      return SavedReports.setCurrentReportByRequestKey(key);
    }];

    $stateProvider
      .state('reportsBase', {
        url : '/reports',
        abstract : true,
        controller : 'ReportsController as ReportCtrl',
        templateUrl : 'modules/reports/reports.html',
        resolve : {
          reportData : ['$stateParams', 'BaseReportService', resolveReportData],
        },
      })
      .state('reportsBase.reportsArchive', {
        url : '/:key/archive',
        controller : 'ReportsArchiveController as ArchiveCtrl',
        templateUrl : 'modules/reports/archive.html',
        params : { key : { squash : true, value : null } },
        resolve : {
          reportData : ['$stateParams', 'BaseReportService', resolveReportData],
        },
      });

    SUPPORTED_REPORTS.forEach((key) => {
      $stateProvider.state('reportsBase.'.concat(key), {
        url : '/'.concat(key),
        controller : key.concat('Controller as ReportConfigCtrl'),
        templateUrl : `/modules/reports/generate/${key}/${key}.html`,
        params : { key, data : { value : null } },
        resolve : {
          reportData : ['$stateParams', 'BaseReportService', resolveReportData],
        },
        onEnter,
      });
    });
  }]);
