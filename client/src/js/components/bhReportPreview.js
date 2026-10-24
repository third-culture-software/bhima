angular.module('bhima.components')
  .component('bhReportPreview', {
    bindings : {
      sourceDocument : '<',
      onClearCallback : '&', // clears the preview (go back to the report config)
      onSaveCallback : '&', // saves the report
    },
    templateUrl : 'modules/templates/bhReportPreview.tmpl.html',
    controller : bhReportPreviewController,
  });

bhReportPreviewController.$inject = ['$element'];

/**
 * bhReportPreview Component
 *
 * Renders an HTML report inside a sandboxed iframe, with buttons to cancel
 * the preview, save the report, or print it.
 * @param $element
 * @example
 * <bh-report-preview
 *   source-document="vm.previewDocument"
 *   on-clear-callback="vm.clearPreview()"
 *   on-save-callback="vm.saveReport()">
 * </bh-report-preview>
 */
function bhReportPreviewController($element) {
  const ctrl = this;

  // print the iframe contents only, not the surrounding page
  ctrl.onPrintCallback = function onPrintCallback() {
    const frame = $element.find('iframe')[0];
    const frameWindow = frame && frame.contentWindow;

    if (!frameWindow) { return; }

    frameWindow.focus();
    frameWindow.print();
  };
}
