angular.module('bhima.controllers')
  .controller('UserModalController', UserModalController);

UserModalController.$inject = [
  '$state', 'ProjectService', 'UserService', 'NotifyService', 'appcache', 'params', 'LanguageService',
];

function UserModalController($state, Projects, Users, Notify, AppCache, params, Languages) {
  const vm = this;

  const cache = AppCache('UserModal');

  // the user object that is either edited or created
  vm.user = {};
  vm.stateParams = {};

  // exposed methods
  vm.submit = submit;
  vm.closeModal = closeModal;
  vm.validPassword = () => Users.validatePassword(vm.user.password, vm.user.passwordVerify);
  vm.editPassword = editPassword;

  if (params.isCreateState || params.id) {
    cache.stateParams = params;
    vm.stateParams = cache.stateParams;
  } else {
    vm.stateParams = cache.stateParams;
  }

  vm.isCreateState = vm.stateParams.isCreateState;

  Projects.read()
    .then((projects) => {
      vm.projects = projects;
    })
    .catch(Notify.handleError);

  Languages.read()
    .then(languages => {
      vm.languages = languages;
    })
    .catch(Notify.handleError);

  if (!vm.isCreateState) {
    Users.read(vm.stateParams.id)
      .then((user) => {
        vm.user = user;
        vm.oldUserName = user.username;
      })
      .catch(Notify.handleError);
  } else {
    vm.user.projects = [];
  }

  // submit the data to the server from all two forms (update, create)
  function submit(userForm) {
    if (userForm.$pristine && !vm.isCreateState) { return closeModal(); }
    if (userForm.$invalid) { return 0; }

    const promise = (vm.isCreateState) ? Users.create(vm.user) : Users.update(vm.user.id, vm.user);

    return promise
      .then(() => {
        const translateKey = (vm.isCreateState) ? 'USERS.CREATED' : 'USERS.UPDATED';
        Notify.success(translateKey);
        $state.go('users.list', null, { reload : true });
      })
      .catch(Notify.handleError);
  }

  function closeModal() {
    $state.go('users.list', {}, { reload : false });
  }

  // opens a new modal to let the user set a password
  function editPassword() {
    $state.go('users.editPassword', { id : vm.user.id }, { reload : true });
  }
}
