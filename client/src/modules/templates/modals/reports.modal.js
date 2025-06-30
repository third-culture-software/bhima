angular.module('bhima.controllers')
  .controller('ReportsModalController', ReportsModalController);

// dependencies injection
ReportsModalController.$inject = [
  '$http', '$uibModalInstance', '$sce',
  '$window', 'data', 'NotifyService', 'util'];

/**
 * Reports Modal Controller
 * This controller is responsible display document as report
 */
function ReportsModalController($http, Instance, $sce, $window, Data, Notify, util) {
  const vm = this;

  vm.loading = true;
  vm.params = Data.params;
  vm.renderer = Data.params && Data.params.renderer ? Data.params.renderer : Data.renderer;

  // Requesting the report
  reportRequest(Data.url, vm.renderer)
    .then((report) => {

      if (vm.renderer === 'pdf') {

        // store downloaded base64 PDF file in a browser blob - this will be accessible through 'blob://...'
        const file = new Blob([report], { type : 'application/pdf' });

        // determine the direct path to the newly (temporarily) stored PDF file
        const fileURL = URL.createObjectURL(file);

        // trust and expose the file to the view to embed the PDF
        vm.report = $sce.trustAsResourceUrl(fileURL);

      } else {
      // simply expose receipt object to view
        vm.report = report;
      }

      // stop the loading indicator
      vm.loading = false;

    })
    .catch(Notify.handleError);

  function reportRequest(url, filetype) {

    // filetype setup
    const responseType = filetype === 'pdf' ? 'arraybuffer' : null;
    const params = { renderer : filetype };
    angular.extend(params, vm.params);

    // send the GET request
    return $http.get(url, {
      params,
      responseType,
    })
      .then(util.unwrapHttpResponse);
  }

  // Instance manipulation
  vm.close = function close() {
    Instance.close();
  };

  vm.print = () => {
    if (vm.renderer === 'pdf') {
      $window.frames.pdf.contentWindow.print();
      return;
    }

    $window.print();
    Instance.close();
  };
}
