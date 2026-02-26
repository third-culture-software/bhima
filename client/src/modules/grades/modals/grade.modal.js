angular.module('bhima.controllers')
  .controller('GradeModalController', GradeModalController);

GradeModalController.$inject = [
  '$state', 'GradeService', 'ModalService', 'NotifyService', 'appcache', 'params',
];

/**
 *
 * @param $state
 * @param Grades
 * @param ModalService
 * @param Notify
 * @param AppCache
 * @param params
 */
function GradeModalController($state, Grades, ModalService, Notify, AppCache, params) {
  const vm = this;
  const cache = AppCache('GradeModal');

  if (params.isCreateState || params.uuid) {
    cache.stateParams = params;
    vm.stateParams = cache.stateParams;
  } else {
    vm.stateParams = cache.stateParams;
  }
  vm.isCreateState = vm.stateParams.isCreateState;

  // exposed methods
  vm.submit = submit;
  vm.closeModal = closeModal;

  if (!vm.isCreateState) {
    Grades.read(vm.stateParams.uuid)
      .then((grade) => {
        vm.grade = grade;
      })
      .catch(Notify.handleError);
  }

  // submit the data to the server from all two forms (update, create)
  /**
   *
   * @param gradeForm
   */
  function submit(gradeForm) {
    if (gradeForm.$invalid || gradeForm.$pristine) { return 0; }

    const promise = (vm.isCreateState)
      ? Grades.create(vm.grade)
      : Grades.update(vm.grade.uuid, vm.grade);

    return promise
      .then(() => {
        const translateKey = (vm.isCreateState) ? 'GRADE.CREATED' : 'GRADE.UPDATED';
        Notify.success(translateKey);
        $state.go('grades', null, { reload : true });
      })
      .catch(Notify.handleError);
  }

  /**
   *
   */
  function closeModal() {
    $state.go('grades');
  }
}
