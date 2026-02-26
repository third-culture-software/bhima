angular.module('bhima.controllers')
  .controller('UsersDepotManagementController', UsersDepotManagementController);

UsersDepotManagementController.$inject = [
  '$state', 'UserService',
  'NotifyService', 'appcache', 'DepotService', 'FormatTreeDataService', 'params',
];

/**
 *
 * @param $state
 * @param Users
 * @param Notify
 * @param AppCache
 * @param Depots
 * @param FormatTreeData
 * @param params
 */
function UsersDepotManagementController($state, Users, Notify, AppCache, Depots, FormatTreeData, params) {
  const vm = this;
  const cache = AppCache('UserDepot');

  if (params.id) {
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
    const filterChecked = vm.depotsData.filter((item) => {
      return item._checked;
    });

    const userDepots = filterChecked.map(depot => depot.uuid);

    if (userForm.$invalid || !vm.user.id) { return 0; }
    return Users.updateDepots(vm.user.id, userDepots || [])
      .then(() => {
        Notify.success('USERS.UPDATED');
        $state.go('users.list', null, { reload : true });
      })
      .catch(Notify.handleError);
  }

  Users.depots(vm.stateParams.id)
    .then((depots) => {
      vm.depotsUser = depots;
      return Depots.read();
    })
    .then(data => {
      data.map(item => {
        item.id = item.uuid;
        item.parent = item.parent_uuid;
        item.key = item.text;
        item._checked = false;

        if (item.parent === '0') {
          item.parent = 0;
        }

        if (vm.depotsUser.length) {
          vm.depotsUser.forEach(depotUuid => {
            if (item.uuid === depotUuid) {
              item._checked = true;
            }
          });
        }
        return item;
      });

      vm.depotsData = FormatTreeData.formatStore(data);
      vm.loading = false;

    })
    .catch(Notify.handleError);

  Users.read(vm.stateParams.id)
    .then((user) => {
      vm.user = user;
    })
    .catch(Notify.handleError);

  /**
   *
   */
  function closeModal() {
    $state.go('users.list');
  }
}
