angular.module('bhima.services')
  .service('IndicatorsDashboardService', IndicatorsDashboardService);

IndicatorsDashboardService.$inject = [
  'PrototypeApiService', 'GridRegistryFilterer', '$uibModal',
];

/**
 *
 * @param Api
 * @param GridRegistryFilterer
 * @param $uibModal
 */
function IndicatorsDashboardService(Api, GridRegistryFilterer, $uibModal) {
  const service = this;

  const defaultFilters = [
    { key : 'limit', label : 'FORM.LABELS.LIMIT', defaultValue : 100 },
  ];
  const grid = new GridRegistryFilterer('IndicatorsFilesRegistryFilterer', defaultFilters);

  service.HOSPITALIZATION_TYPE_ID = 1;
  service.STAFF_TYPE_ID = 2;
  service.FINANCE_TYPE_ID = 3;
  service.INCOMPLETE_STATUS_ID = 1;
  service.COMPLETE_STATUS_ID = 2;
  service.VALIDATED_STATUS_ID = 3;

  service.indicatorsFiles = new Api('/indicators/');
  service.hospitalization = new Api('/indicators/hospitalization/');
  service.staff = new Api('/indicators/staff/');
  service.finances = new Api('/indicators/finances/');
  service.status = new Api('/indicators/status/');
  service.types = new Api('/indicators/types/');
  service.dashboards = new Api('/indicators/dashboards');

  service.indicatorsFilesGridFilterer = grid;
  service.openIndicatorsFilesSearchModal = openIndicatorsFilesSearchModal;

  service.handleNullString = handleNullString;
  service.isFormCompleted = isFormCompleted;
  service.clean = clean;

  /**
   *
   * @param indicators
   */
  function handleNullString(indicators) {
    Object.keys(indicators).forEach(key => {
      if (indicators[key] === '') {
        delete indicators[key];
      }
    });
    return indicators;
  }

  /**
   *
   * @param indicators
   */
  function isFormCompleted(indicators) {
    if (!Object.keys(indicators).length) { return false; }

    return Object.keys(indicators).every(key => {
      return String(indicators[key]).trim() !== '';
    });
  }

  /**
   *
   * @param indicators
   */
  function clean(indicators) {
    delete indicators.uuid;
    delete indicators.service_name;
    delete indicators.fiscal_year_id;
    delete indicators.user_id;
    delete indicators.type_id;
    delete indicators.service_uuid;
    delete indicators.period_id;
    delete indicators.status_id;
  }

  /**
   * @function openSearchModal
   * @param {object} params - an object of filter parameters to be passed to
   *   the modal.
   * @returns {Promise} modalInstance
   */
  function openIndicatorsFilesSearchModal(params) {
    return $uibModal.open({
      templateUrl : 'modules/dashboards/indicators_files_registry/modals/search.modal.html',
      size : 'md',
      keyboard : false,
      animation : false,
      backdrop : 'static',
      controller : 'SearchIndicatorsFilesModalController as $ctrl',
      resolve : {
        filters : function paramsProvider() { return params; },
      },
    }).result;
  }

  return service;
}
