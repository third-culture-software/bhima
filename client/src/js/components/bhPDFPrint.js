angular.module('bhima.components')
  .component('bhPdfPrint', {
    bindings : {
      pdfUrl       : '@',
      disableCache : '@?',
      options      : '<?',
      disabled     : '<?',
    },
    template :
      `<bh-loading-button
          button-class="btn-default"
          loading-state="$ctrl.$loading"
          ng-click="$ctrl.print()"
          disabled="$ctrl.disabled">
        <span><i class="fa fa-print"></i> <span translate>FORM.BUTTONS.PRINT</span></span>
      </bh-loading-button>
      <iframe ng-src="{{$ctrl.src}}" id="{{$ctrl.embeddedContentId}}" style="display : none"></iframe>`,
    controller : bhPDFPrintController,
  });

angular.module('bhima.components')
  .component('bhPdfLink', {
    bindings : {
      pdfUrl       : '@',
      buttonText   : '@?',
      disableCache : '@?',
      options      : '<?',
    },
    transclude : true,
    template   :
      `<a href ng-click="$ctrl.print()">
        <span ng-if="!$ctrl.$loading"><i class="fa fa-print"></i> <span translate>{{ $ctrl.buttonText }}</span></span>
        <span ng-if="$ctrl.$loading">
          <i class="fa fa-spin fa-circle-o-notch"></i> <span translate>FORM.INFO.LOADING</span>
        </span>
      </a>
      <iframe ng-src="{{$ctrl.src}}" id="{{$ctrl.embeddedContentId}}" style="display : none"></iframe>`,
    controller : bhPDFPrintController,
  });

bhPDFPrintController.$inject = [
  '$window', '$http', '$sce', '$timeout', 'LanguageService',
  'NotifyService',
];

/**
 * @class bhPDFPrintController
 *
 * @description
 * This component allows printing of a BHIMA PDF report route. It abstracts the
 * server request and PDF display directly calling the browser `print()` method.
 * This directive can be used where there are no confirmation or configuration
 * steps for the report and may be abstracted in the future to allow for the
 * technology to be used in an export drop-down etc.
 *
 * The provided pdf url should be relative to the servers path and does not need
 * to include the renderer option (this is performed by the component.
 * Options will be passed as params in the get request.
 *
 * @todo Investigate abstracting direct print to browser window functionality to allow export drop-down
 *
 * @example
 * let url = '/reports/receipt/invoice';
 * let options = { filters : [] };
 *
 * <bh-pdf-print
 *   pdf-url="url"
 *   options="options"
 *   disable-cache="false">
 * </bh-pdf-print>
 */
function bhPDFPrintController($window, $http, $sce, $timeout, Languages, Notify) {
  const $ctrl = this;
  let cachedRequest;

  $ctrl.$onInit = function $onInit() {
    $ctrl.buttonText = $ctrl.buttonText || 'FORM.BUTTONS.PRINT';

    $ctrl.$loading = false;
    $ctrl.embeddedContentId = `pdfdirect-${Date.now()}`;

    // turn off caching via disable-cache="true".  Caching is enabled by default.
    $ctrl.enableCache = ($ctrl.disableCache !== 'true');
  };

  // expose the print method to the view
  $ctrl.print = printChildFrame;

  const pdfOptions = {
    renderer : 'pdf',
    lang : Languages.key,
  };

  const responseType = 'arraybuffer';
  const pdfType = 'application/pdf';

  // delay between GET request completion and loading indication, this is used
  // to compensate for the delay in browsers opening the print dialog
  const loadingIndicatorDelay = 1000;

  function printChildFrame() {
    const url = $ctrl.pdfUrl;
    const configuration = requestOptions();

    // check to see if this request has been made before - if it has and caching is enabled,
    // we will use the local resource
    if ($ctrl.enableCache && angular.equals(configuration, cachedRequest)) {
      printEmbeddedContent();
      return 0;
    }

    cachedRequest = configuration;
    $ctrl.$loading = true;
    let testUrl = false;

    // return the value to allow the controller to perform error handling
    return $http.get(url, { params : configuration, responseType })
      .then(result => {
        const file = new Blob([result.data], { type : pdfType });
        const fileURL = URL.createObjectURL(file);
        $ctrl.blobFileURL = fileURL;

        // Check if fileURL return a valid file
        testUrl = !!fileURL;

        // expose the stored pdf to the hidden view
        // the print method is automatically called with the load listener on the $window option
        $ctrl.src = $sce.trustAsResourceUrl(fileURL);

        $timeout(bindPrintEventMethod);
      })
      .finally(() => {
        $timeout(toggleLoading, loadingIndicatorDelay);
        // Check if was not found on the server
        if (!testUrl) {
          Notify.danger('FORM.WARNINGS.DOC_NOT_FOUND');
        }

      });
  }

  // ensure the blob is cleared when this $scope is cleaned up
  $ctrl.$onDestroy = () => {
    if ($ctrl.blobFileURL) {
      URL.revokeObjectURL($ctrl.blobFileUrl);
    }

    const frame = $window.frames[$ctrl.embeddedContentId];
    if (frame) {
      frame.removeEventListener('load', printEmbeddedContent);
    }
  };

  /**
   * @method requestOptions
   *
   * @description
   * Combine the pdf options and the report options passed in from the
   * controller.
   */
  function requestOptions() {
    const combined = angular.copy(pdfOptions);
    angular.extend(combined, $ctrl.options);
    return combined;
  }

  /**
   * @method toggleLoading
   *
   * @description
   * This method is responsible for updating the loading state for the controllers
   * HTTP requests.
   */
  function toggleLoading() {
    $ctrl.$loading = !$ctrl.$loading;
  }

  // ensure that the template/ iframe element is available
  // both the $onInit and $postLink methods are fired before guaranteeing the
  // id has been dynamically set

  function bindPrintEventMethod() {
    $window.frames[$ctrl.embeddedContentId].addEventListener('load', printEmbeddedContent);
  }

  /**
   * @method printEmbeddedContent
   *
   * @description
   *
   * register a method to invoke print on the hidden iframe on load
   * if print() is called as soon as the content is available it will not yet be
   * ready to be printed - waiting until the load event is fired ensures everything
   * is ready for printing.
   */
  function printEmbeddedContent() {
    // ensure this is considered in Angular's $digest
    $timeout(() => {
      // invoke print on the target window
      $window.frames[$ctrl.embeddedContentId].contentWindow.print();
    });
  }
}
