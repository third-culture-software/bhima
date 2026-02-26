angular.module('bhima.services')
  .service('BaseReportService', BaseReportService);

BaseReportService.$inject = ['$http', '$uibModal', 'util', 'LanguageService'];

/**
 *
 * @param $http
 * @param Modal
 * @param util
 * @param Languages
 */
function BaseReportService($http, Modal, util, Languages) {
  const service = this;

  service.requestKey = requestKey;
  service.listSavedReports = listSavedReports;
  service.deleteReport = deleteReport;

  service.saveReport = saveReport;
  service.requestPreview = requestPreview;
  service.saveAsModal = saveAsModal;
  service.emailReportModal = emailReportModal;
  service.emailReport = emailReport;

  service.current = {};

  service.setCurrentReportByRequestKey = setCurrentReportByRequestKey;

  // sets the current service state based on the
  /**
   *
   * @param key
   */
  function setCurrentReportByRequestKey(key) {
    return requestKey(key)
      .then(([report]) => {
        service.current = report;
      });
  }

  /**
   *
   * @param key
   */
  function requestKey(key) {
    const url = '/reports/keys/';
    return $http.get(url.concat(key))
      .then(util.unwrapHttpResponse);
  }

  /**
   *
   * @param reportId
   */
  function listSavedReports(reportId) {
    const url = '/reports/saved/';
    return $http.get(url.concat(reportId))
      .then(util.unwrapHttpResponse);
  }

  /**
   *
   * @param url
   * @param reportId
   * @param reportOptions
   */
  function requestPreview(url, reportId, reportOptions) {
    const htmlParams = {
      reportId,
      saveReport : '0',
      renderer : 'html',
      lang : Languages.key,
    };

    const options = angular.merge(reportOptions, htmlParams);
    return $http.get(url, { params : options })
      .then(util.unwrapHttpResponse);
  }

  /**
   * @param url
   * @param report
   * @param reportOptions
   * @function requestPDF
   * @description
   * Formats a reports configuration options with the PDF report API and returns
   * a request for the PDF document generation.
   */
  function saveReport(url, report, reportOptions) {
    const params = {
      // @TODO This should be known by the server
      reportId : report.id,
      saveReport : 1,
    };
    const options = angular.merge(reportOptions, params);

    return $http.get(url, { params : options });
  }

  /**
   *
   * @param uuid
   */
  function deleteReport(uuid) {
    const url = '/reports/archive/'.concat(uuid);
    return $http.delete(url)
      .then(util.unwrapHttpResponse);
  }

  /**
   *
   * @param uuid
   * @param email
   */
  function emailReport(uuid, email) {
    const url = '/reports/archive/'.concat(uuid, '/email');
    return $http.post(url, { address : email })
      .then(util.unwrapHttpResponse);
  }

  /**
   *
   * @param options
   */
  function emailReportModal(options) {
    const instance = Modal.open({
      keyboard : true,
      resolve : {
        options : function resolveOptions() { return options; },
      },
      controller : 'EmailReportController as EmailCtrl',
      templateUrl : '/modules/reports/modals/reports.email.html',
    });

    return instance.result;
  }

  /**
   *
   * @param options
   */
  function saveAsModal(options) {
    const instance = Modal.open({
      keyboard : true,
      resolve : { options : () => options },
      controller : 'SaveReportController as SaveCtrl',
      templateUrl : '/modules/templates/modals/report.save.html',
    });

    return instance.result;
  }

  /**
   *
   * @param url
   */
  function parseFileUrlToExtension(url) {
    if (!url) { return ''; }
    const parts = url.split('.');
    const extension = parts[parts.length - 1];
    return extension;
  }

  /**
   * @param url
   * @function parseFileUrlToIcon
   * @description
   * Takes in a URL string with an given extension (.pdf, .doc, etc) and
   * returns the font awesome class name associated with that icon.
   */
  function parseFileUrlToIcon(url) {
    const extension = parseFileUrlToExtension(url);

    let icon;

    switch (extension) {
    case 'doc':
    case 'docx':
      icon = 'fa-file-word-o';
      break;
    case 'pdf':
      icon = 'fa-file-pdf-o';
      break;
    case 'xlsx':
    case 'xls':
      icon = 'fa-file-excel-o';
      break;
    case 'zip':
    case 'gz':
      icon = 'fa-file-archive-o';
      break;
    case 'png':
    case 'jpeg':
    case 'jpg':
    case 'svg':
      icon = 'fa-file-image-o';
      break;
    case 'csv':
      icon = 'fa-file-csv-o';
      break;
    default:
      icon = 'fa-file-o';
      break;
    }

    return icon;
  }

  service.parseFileUrlToIcon = parseFileUrlToIcon;
  service.parseFileUrlToExtension = parseFileUrlToExtension;
}
