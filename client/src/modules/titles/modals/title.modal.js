angular.module('bhima.controllers')
  .controller('TitleModalController', TitleModalController);

TitleModalController.$inject = [
  '$state', 'TitleService', 'NotifyService', 'appcache', 'params',
];

/**
 *
 * @param $state
 * @param Titles
 * @param Notify
 * @param AppCache
 * @param params
 */
function TitleModalController($state, Titles, Notify, AppCache, params) {
  const vm = this;

  const cache = AppCache('TitleModal');

  if (params.isCreateState || params.id) {
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
    Titles.read(vm.stateParams.id)
      .then(data => {
        vm.title = data;
      })
      .catch(Notify.handleError);
  }

  // submit the data to the server from all two forms (update, create)
  /**
   *
   * @param titleForm
   */
  function submit(titleForm) {

    if (titleForm.$invalid || titleForm.$pristine) { return 0; }

    const promise = (vm.isCreateState)
      ? Titles.create(vm.title)
      : Titles.update(vm.title.id, vm.title);

    return promise
      .then(() => {
        const translateKey = (vm.isCreateState) ? 'FORM.INFO.SAVE_SUCCESS' : 'FORM.INFO.UPDATE_SUCCESS';
        Notify.success(translateKey);
        $state.go('titles', null, { reload : true });
      })
      .catch(Notify.handleError);
  }

  /**
   *
   */
  function closeModal() {
    $state.go('titles');
  }
}
