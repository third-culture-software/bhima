angular.module('bhima.controllers')
  .controller('ConfigIndicePaiementModalController', ConfigIndicePaiementModalController);

ConfigIndicePaiementModalController.$inject = [
  '$state', 'NotifyService', 'appcache', 'MultipleIndicesPayrollService', 'SessionService', 'params',
  'StaffingIndiceService', '$translate',
];

/**
 *
 * @param $state
 * @param Notify
 * @param AppCache
 * @param MultiplePayroll
 * @param Session
 * @param params
 * @param StaffingIndice
 * @param $translate
 */
function ConfigIndicePaiementModalController(
  $state, Notify, AppCache, MultiplePayroll, Session, params, StaffingIndice, $translate,
) {
  const vm = this;
  vm.config = {};
  vm.payroll = {};
  vm.employee = {};
  vm.rubrics = [];

  const rubricsMap = {};

  vm.selectedRubrics = {};
  vm.employeeGradeRubrics = {};
  vm.frequencyRubrics = {};
  vm.onUpdateRubricValue = onUpdateRubricValue;

  vm.rubValueLabel = $translate.instant('FORM.LABELS.VALUE');
  vm.rubValueFrequency = $translate.instant('FORM.LABELS.FREQUENCY');

  vm.enterprise = Session.enterprise;
  vm.lastExchangeRate = {};

  const cache = AppCache('multiple-indice-payroll-grid');

  if (params.isCreateState || params.uuid) {
    cache.stateParams = params;
    vm.stateParams = cache.stateParams;
  } else {
    vm.stateParams = cache.stateParams;
  }

  // exposed methods
  vm.submit = submit;
  vm.closeModal = closeModal;

  vm.latestViewFilters = MultiplePayroll.filters.formatView();

  // FIXE ME
  // Dont use index but use the property to found label, display value and value for each filter (@lomamech)
  vm.label = vm.latestViewFilters.defaultFilters[0]._label;
  vm.displayValue = vm.latestViewFilters.defaultFilters[0]._displayValue;
  vm.idPeriod = vm.latestViewFilters.defaultFilters[0]._value;
  vm.currencyId = vm.latestViewFilters.defaultFilters[1]._value;

  vm.isEnterpriseCurrency = vm.currencyId === Session.enterprise.currency_id;

  vm.payroll.currency_id = vm.latestViewFilters.defaultFilters[1]._value;

  vm.setCurrency = function setCurrency(currency) {
    vm.payroll.currency_id = currency.id;
  };

  // initialize module
  /**
   *
   */
  function startup() {
    if (params.filters.length) {
      MultiplePayroll.filters.replaceFiltersFromState(params.filters);
      MultiplePayroll.cacheFilters();
    }

    vm.latestViewFilters = MultiplePayroll.filters.formatView();

    const parameters = MultiplePayroll.filters.formatHTTP(true);
    parameters.employee_uuid = parameters.uuid;
    load(parameters);

  }

  /**
   *
   * @param filters
   */
  function load(filters) {
    MultiplePayroll.read(null, filters)
      .then((result) => {
        // Correction of the error when configuring data linked
        // to an employee with the payroll module with indice
        result.employees.forEach(item => {
          if (item.uuid === params.uuid) {
            vm.employee = item;
          }
        });

        vm.employee.rubrics.forEach(r => {
          vm.selectedRubrics[r.rubric_id] = r.rubric_value;
        });

        vm.rubrics = result.rubrics;

        vm.rubrics.forEach(r => {
          rubricsMap[r.id] = r;
          if (!vm.selectedRubrics[r.id]) {
            vm.selectedRubrics[r.id] = r.value || 0;
          }
        });

        return StaffingIndice.getRubricsGradeEmp({ employee_uuid : params.uuid });
      })
      .then(data => {
        vm.rubricsGrade = data;

        vm.rubrics.forEach(rub => {
          vm.rubricsGrade.forEach(rubGrade => {
            if (rub.id === rubGrade.rubric_id) {
              vm.employeeGradeRubrics[rub.id] = rubGrade.value;
              vm.frequencyRubrics[rub.id] = 0;
              if (vm.selectedRubrics[rub.id] > 0) {
                vm.frequencyRubrics[rub.id] = vm.selectedRubrics[rub.id] / vm.employeeGradeRubrics[rub.id];
              }
            }
          });
        });

      })
      .catch(Notify.handleError);

  }

  /**
   *
   * @param object
   */
  function formatRubrics(object) {
    const keys = Object.keys(vm.selectedRubrics);
    return keys.map(k => {
      // For the case where the object is not defined
      const checkMonetaryValue = rubricsMap[k] ? rubricsMap[k].is_monetary_value : 0;

      return {
        id : k,
        value : object[k],
        is_monetary : checkMonetaryValue,
      };
    });
  }

  // submit the data to the server from all two forms (update, create)
  /**
   *
   * @param ConfigPaiementForm
   */
  function submit(ConfigPaiementForm) {

    if (ConfigPaiementForm.$invalid) {
      return Notify.danger('FORM.ERRORS.INVALID');
    }

    const data = MultiplePayroll.filters.formatHTTP(true);

    angular.extend(data, {
      rubrics : formatRubrics(vm.selectedRubrics),
      employee_uuid : params.uuid,
    });

    return MultiplePayroll.create(data)
      .then(() => {
        Notify.success('FORM.INFO.OPERATION_SUCCESS');
        closeModal();
      })
      .catch(Notify.handleError);

  }

  /**
   *
   */
  function closeModal() {
    $state.go('multiple_payroll_indice', null, { reload : true });
  }

  /**
   *
   * @param rubricId
   */
  function onUpdateRubricValue(rubricId) {
    vm.selectedRubrics[rubricId] = vm.frequencyRubrics[rubricId] * vm.employeeGradeRubrics[rubricId];
  }

  startup();
}
