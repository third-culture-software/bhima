angular.module('bhima.controllers')
  .controller('SaveReportController', SaveReportController);

SaveReportController.$inject = [
  '$uibModalInstance', 'NotifyService', 'BaseReportService', 'options', 'LanguageService',
];

/**
 *
 * @param ModalInstance
 * @param Notify
 * @param SavedReports
 * @param options
 * @param Languages
 */
function SaveReportController(ModalInstance, Notify, SavedReports, options, Languages) {
  const vm = this;
  vm.documentOptions = {};

  vm.report = options.report;
  vm.dismiss = ModalInstance.dismiss;

  /* @TODO verify that options passed in are valid */
  // @TODO this should be derived from the server or compiled in during the build process
  //       it should also be possible to override this depending on the support of each individual report
  vm.supportedRenderTypes = [
    { key : 'pdf', label : 'REPORT.UTIL.PDF' },
    { key : 'doc', label : 'REPORT.UTIL.WORD' },
    { key : 'xls', label : 'REPORT.UTIL.EXCEL' },
  ];

  vm.documentOptions.renderer = vm.supportedRenderTypes[0].key;
  vm.submit = function submit(SaveForm) {
    if (SaveForm.$invalid) { return 0; }

    // vm.documentOptions.renderer = vm.supportedRenderTypes[0].key;
    vm.documentOptions.lang = Languages.key;
    vm.documentOptions.orientation = vm.documentOptions.orientation || 'portrait';

    // @TODO this can directly be loaded from the form
    const reportOptions = angular.merge(vm.documentOptions, options.reportOptions);

    return SavedReports.saveReport(options.url, options.report, reportOptions)
      .then(result => {
        Notify.success('REPORT.UTIL.SAVE_SUCCESS');
        ModalInstance.close(result);
      })
      .catch(Notify.handleError);
  };

  vm.setDocumentorientation = function setDocumentorientation(orientation) {
    vm.documentOptions.orientation = orientation;
  };
}
