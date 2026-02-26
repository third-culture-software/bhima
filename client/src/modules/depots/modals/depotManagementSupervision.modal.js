angular.module('bhima.controllers')
  .controller('DepotManagementSupervisionController', DepotManagementSupervisionController);

DepotManagementSupervisionController.$inject = [
  '$state', 'UserService',
  'NotifyService', 'appcache', 'DepotService', 'params',
];

/**
 *
 * @param $state
 * @param Users
 * @param Notify
 * @param AppCache
 * @param Depots
 * @param params
 */
function DepotManagementSupervisionController($state, Users, Notify, AppCache, Depots, params) {
  const vm = this;
  const cache = AppCache('UserDepot');

  vm.isManagementState = params.isManagementState;
  vm.isSupervisionState = params.isSupervisionState;

  if (params.uuid) {
    cache.stateParams = params;
    vm.stateParams = cache.stateParams;
  } else {
    vm.stateParams = cache.stateParams;
  }

  // the user object that is either edited or created
  vm.user = {};
  vm.depots = [];
  vm.setNodeValue = setNodeValue;
  vm.setAllNodeValue = setAllNodeValue;

  // exposed methods
  vm.submit = submit;
  vm.closeModal = closeModal;
  vm.toggleFilter = toggleFilter;
  vm.loading = true;

  vm.onDepotChange = (depots) => {
    vm.user.depots = depots;
  };

  /**
   *
   * @param childrens
   * @param depot
   */
  function setNodeValue(childrens, depot) {
    childrens.forEach(child => {
      vm.depotsData.forEach(d => {
        if (child.uuid === d.uuid) {
          d._checked = depot._checked;
        }
      });
      // Set Children
      if (child.children.length) {
        setNodeValue(child.children, child);
      }
    });
  }

  /**
   *
   * @param depots
   * @param allStatus
   */
  function setAllNodeValue(depots, allStatus) {
    depots.forEach(depot => {
      depot._checked = allStatus;
    });
  }

  /**
   *
   * @param depot
   */
  function setRootValue(depot) {
    depot._checked = !depot._checked;
  }
  vm.setRootValue = setRootValue;

  // Naive filter toggle - performance analysis should be done on this
  /**
   *
   */
  function toggleFilter() {
    if (vm.filterActive) {

      // clear the filter
      vm.filterActive = false;
      vm.filter = '';
    } else {
      vm.filterActive = true;
    }
  }

  // submit the data to the server from all two forms (update, create)
  /**
   *
   * @param userForm
   */
  function submit(userForm) {
    const filterChecked = vm.usersData.filter((item) => {
      return item._checked;
    });

    const usersDepot = filterChecked.map(user => user.id);

    if (userForm.$invalid || !vm.depot.uuid) { return 0; }

    const promise = (vm.isManagementState)
      ? Depots.updateUsersManagement(vm.depot.uuid, usersDepot || [])
      : Depots.updateUsersSupervision(vm.depot.uuid, usersDepot || []);

    return promise
      .then(() => {
        Notify.success('FORM.INFO.SAVE_SUCCESS');
        $state.go('depots', null, { reload : true });
      })
      .catch(Notify.handleError);
  }

  const getDataManagementSupervision = (vm.isManagementState)
    ? Depots.management(vm.stateParams.uuid)
    : Depots.supervision(vm.stateParams.uuid);

  getDataManagementSupervision
    .then((users) => {
      vm.depotsUser = users;
      return Users.read();
    })
    .then(data => {
      data.map(item => {
        item.key = item.display_name;
        item._checked = false;
        item.parent = null;

        if (vm.depotsUser.length) {
          vm.depotsUser.forEach(id => {
            if (item.id === id.user_id) {
              item._checked = true;
            }
          });
        }
        return item;
      });

      vm.usersData = data;
      vm.loading = false;
    })
    .catch(Notify.handleError);

  Depots.read(vm.stateParams.uuid)
    .then((depot) => {
      vm.depot = depot;
    })
    .catch(Notify.handleError);

  /**
   *
   */
  function closeModal() {
    $state.go('depots');
  }
}
