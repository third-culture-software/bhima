angular.module('bhima.controllers')
  .controller('FindDuplicatePatientsModalController', FindDuplicatePatientsModalController);

FindDuplicatePatientsModalController.$inject = [
  'PatientService', '$uibModalInstance',
];

/**
 *
 * @param Patients
 * @param Instance
 */
function FindDuplicatePatientsModalController(Patients, Instance) {
  const vm = this;
  vm.submit = submit;
  vm.dismiss = () => Instance.close();

  /**
   *
   * @param err
   */
  function handleError(err) {
    vm.errorValue = err;
    vm.hasError = true;
  }

  vm.uiGridOptions = {
    appScopeProvider : vm,
    enableFiltering : false,
    enableSorting : true,
    fastWatch : true,
    flatEntityAccess : true,
    enableSelectionBatchEvent : false,
    onRegisterApi,
  };

  /**
   *
   * @param others
   */
  function parseOtherPatientsField(others) {
    const patients = others.split(',');
    return patients.map(patient => patient.split(':'));
  }

  /**
   *
   */
  function lookupDuplicates() {
    vm.loading = true;
    const options = { sensitivity : 2, limit : 25 };

    // clear errors if they exist.
    delete vm.hasError;
    delete vm.errorValue;

    Patients.findDuplicatePatients(options)
      .then(data => {
        vm.uiGridOptions.data = data;
        vm.hasNoDuplicates = data.length === 0;
      })
      .catch(handleError)
      .finally(() => {
        vm.loading = false;
      });
  }

  vm.uiGridOptions.columnDefs = [{
    field : 'num_patients',
    displayName : 'TABLE.COLUMNS.TOTAL',
    headerCellFilter : 'translate',
    type : 'number',
  }, {
    field : 'display_name',
    displayName : 'TABLE.COLUMNS.NAME',
    headerCellFilter : 'translate',
  }];

  /**
   *
   * @param gridApi
   */
  function onRegisterApi(gridApi) {
    vm.gridApi = gridApi;
    vm.gridApi.selection.on.rowSelectionChanged(null, rowSelectionCallback);
  }

  // called whenever the selection changes in the ui-grid
  /**
   *
   */
  function rowSelectionCallback() {
    const selected = vm.gridApi.selection.getSelectedRows();
    vm.hasSelectedRows = selected.length > 0;
  }

  /**
   *
   */
  function submit() {
    const selected = vm.gridApi.selection.getSelectedRows();

    const parsed = selected.map(row => parseOtherPatientsField(row.others));

    const { uuids, names } = parsed.reduce((agg, patients) => {
      agg.uuids.push(...patients.map(v => v[0]));
      agg.names.push(...patients.map(v => v[1]));
      return agg;
    }, { uuids : [], names : [] });

    // display the references in a predicatable order
    const displayValues = names.sort().join(',');

    const filters = [
      { key : 'period', value : 'allTime' },
      { key : 'limit', value : '10000', cacheable : false },
      {
        key : 'uuids', value : uuids, displayValue : displayValues, cacheable : false,
      },
    ];

    return Instance.close(filters);
  }

  lookupDuplicates();
}
