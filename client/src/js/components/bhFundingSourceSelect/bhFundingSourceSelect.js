angular.module('bhima.components')
  .component('bhFundingSourceSelect', {
    templateUrl : 'js/components/bhFundingSourceSelect/bhFundingSourceSelect.html',
    controller  : FundingSourceSelectController,
    transclude  : true,
    bindings    : {
      fundingSourceUuid : '<',
      onSelectCallback  : '&',
      required          : '<?',
      label             : '@?',
      enableAdd         : '<?',
    },
  });

FundingSourceSelectController.$inject = [
  '$rootScope',
  'FundingSourceService',
  'NotifyService',
];

/**
 * Funding source selection component
 */
function FundingSourceSelectController($rootScope, FundingSources, Notify) {
  const $ctrl = this;

  $ctrl.createUpdateFundingSourcesModal = FundingSources.createUpdateFundingSourcesModal;

  $rootScope.$on('FUNDING_SOURCES_CHANGED', () => {
    loadFundingSources();
  });

  $ctrl.$onInit = function onInit() {
    $ctrl.label = $ctrl.label || 'FORM.LABELS.FUNDING_SOURCE';
    $ctrl.fundingSourceUuid = $ctrl.fundingSourceUuid || null;
    loadFundingSources();
  };

  // if required is undefined, default to not being required
  if (!angular.isDefined($ctrl.required)) {
    $ctrl.required = false;
  }

  $ctrl.onSelect = ($item) => {
    $ctrl.onSelectCallback({ fundingSource : $item });
  };

  function loadFundingSources() {
    FundingSources.read()
      .then((fundingSources) => {
        $ctrl.fundingSources = fundingSources;
      })
      .catch(Notify.handleError);
  }
}
