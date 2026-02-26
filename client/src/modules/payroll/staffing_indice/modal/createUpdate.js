angular.module('bhima.controllers')
  .controller('StaffingIndiceModalController', StaffingIndiceModalController);

StaffingIndiceModalController.$inject = [
  'data', '$state', 'StaffingIndiceService',
  'NotifyService', '$uibModalInstance',
];

/**
 *
 * @param data
 * @param $state
 * @param StaffingIndice
 * @param Notify
 * @param Instance
 */
function StaffingIndiceModalController(data, $state, StaffingIndice, Notify, Instance) {
  const vm = this;
  vm.close = Instance.close;
  vm.submit = submit;
  vm.indice = {};

  vm.isCreate = !data.uuid;
  vm.action = vm.isCreate ? 'FORM.LABELS.CREATE' : 'FORM.LABELS.UPDATE';

  init();

  // custom filter grade_uuid - assign the value to the searchQueries object
  vm.onSelectGrade = function onSelectGrade(grade) {
    vm.indice.grade_uuid = grade.uuid;
  };

  vm.onSelectFonction = function onSelectFonction(fonction) {
    vm.indice.fonction_id = fonction.id;
  };

  vm.onSelectEmployee = (employee) => {
    vm.indice.employee_uuid = employee.uuid;
    vm.indice.grade_uuid = employee.grade_uuid;
    if (employee.fonction_id) {
      vm.indice.fonction_id = employee.fonction_id;
    }
  };

  vm.onInputTextChange = (key, value) => {
    vm.indice[key] = value;
  };

  /**
   *
   */
  function init() {
    if (!vm.isCreate) {
      StaffingIndice.read(data.uuid).then(indice => {
        vm.indice = indice;
      }).catch(Notify.handleError);
    }
  }

  /**
   *
   * @param form
   */
  function submit(form) {
    if (form.$invalid) {
      Notify.danger('FORM.ERRORS.HAS_ERRORS');
      return false;
    }

    const operation = (!data.uuid)
      ? StaffingIndice.create(vm.indice)
      : StaffingIndice.update(data.uuid, vm.indice);

    return operation
      .then(() => {
        Notify.success('FORM.INFO.OPERATION_SUCCESS');
        return Instance.close(true);
      })
      .catch(Notify.handleError);
  }
}
