angular.module('bhima.controllers')
  .controller('ConfigurationAnalysisToolsModalController', ConfigurationAnalysisToolsModalController);

ConfigurationAnalysisToolsModalController.$inject = [
  '$state', 'ConfigurationAnalysisToolsService', 'NotifyService', 'appcache', 'params',
];

/**
 * Configuration Analysis Tools Controller
 */

/**
 *
 * @param $state
 * @param AnalysisTools
 * @param Notify
 * @param AppCache
 * @param params
 */
function ConfigurationAnalysisToolsModalController($state, AnalysisTools, Notify, AppCache, params) {
  const vm = this;
  const cache = AppCache('AccountReferenceModal');

  vm.reference = {};
  vm.stateParams = {};

  // exposed methods
  vm.submit = submit;
  vm.closeModal = closeModal;
  vm.onSelectAccountReference = onSelectAccountReference;
  vm.onSelectAnalysisToolType = onSelectAnalysisToolType;

  if (params.isCreateState || params.id) {
    cache.stateParams = params;
    vm.stateParams = cache.stateParams;
  } else {
    vm.stateParams = cache.stateParams;
  }

  vm.isCreateState = vm.stateParams.isCreateState;

  if (!vm.isCreateState) {
    AnalysisTools.read(vm.stateParams.id)
      .then(data => {
        vm.reference = data;
        vm.revenueType = !vm.reference.is_cost;
      })
      .catch(Notify.handleError);
  }

  /**
   *
   * @param accountReference
   */
  function onSelectAccountReference(accountReference) {
    vm.reference.account_reference_id = accountReference.id;
  }

  /**
   *
   * @param analysisToolType
   */
  function onSelectAnalysisToolType(analysisToolType) {
    vm.reference.analysis_tool_type_id = analysisToolType.id;
  }

  // submit the data to the server from all two forms (update, create)
  /**
   *
   * @param configurationAnalysisToolsForm
   */
  function submit(configurationAnalysisToolsForm) {
    if (configurationAnalysisToolsForm.$invalid) { return null; }
    if (!configurationAnalysisToolsForm.$dirty) { return null; }

    const promise = (vm.isCreateState)
      ? AnalysisTools.create(vm.reference)
      : AnalysisTools.update(vm.reference.id, vm.reference);

    return promise
      .then(() => {
        const translateKey = (vm.isCreateState) ? 'FORM.INFO.CREATE_SUCCESS' : 'FORM.INFO.UPDATE_SUCCESS';
        Notify.success(translateKey);
        $state.go('configuration_analysis_tools', null, { reload : true });
      })
      .catch(Notify.handleError);
  }

  /**
   *
   */
  function closeModal() {
    $state.go('configuration_analysis_tools');
  }
}
