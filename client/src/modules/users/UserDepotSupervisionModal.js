angular.module('bhima.controllers')
  .controller('UsersDepotSupervisionController', UsersDepotSupervisionController);

UsersDepotSupervisionController.$inject = [
  '$state', 'UserService', '$q', 'NotifyService', 'appcache',
  'DepotService', 'FormatTreeDataService', 'params',
];

function UsersDepotSupervisionController($state, Users, $q, Notify, AppCache, Depots, FormatTreeData, params) {
  const vm = this;
  const cache = AppCache('UserDepotSupervision');

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
  vm.toggleFilter = toggleFilter;

  vm.closeModal = () => $state.go('users.list');
  vm.onDepotChange = (depots) => { vm.user.depots = depots; };
  vm.setRootValue = (depot) => { depot._checked = !depot._checked; };

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

  function setAllNodeValue(depots, allStatus) {
    depots.forEach(depot => {
      depot._checked = allStatus;
    });
  }

  // Naive filter toggle - performance analysis should be done on this
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
  function submit(userForm) {
    if (userForm.$invalid || !vm.user.id) { return 0; }

    const userDepots = vm.depotsData
      .filter(item => item._checked)
      .map(depot => depot.uuid);

    return Users.updateDepotsSupervision(vm.user.id, userDepots || [])
      .then(() => {
        Notify.success('USERS.UPDATED');
        $state.go('users.list', null, { reload : true });
      })
      .catch(Notify.handleError);
  }

  function startup() {
    vm.loading = true;

    $q.all([
      Users.read(vm.stateParams.id),
      Depots.read(),
      Users.depotsSupervision(vm.stateParams.id),
    ])
      .then(([
        user,
        depotList,
        userDepotUuids = [],
      ]) => {
        vm.user = user;
        vm.depotsUser = userDepotUuids;
        // set up of user uuids
        const userDepotSet = new Set(vm.depotsUser);

        // sort in alphabetical order
        depotList.sort((a, b) => a.text.localeCompare(b.text));

        const formattedDepots = depotList.map(item => ({
          ...item,
          id : item.uuid,
          parent : item.parent_uuid === '0' ? 0 : item.parent_uuid,
          key : item.text,
          _checked : userDepotSet.has(item.uuid),
        }));

        vm.depotsData = FormatTreeData.formatStore(formattedDepots);
        vm.loading = false;
      })
      .catch(Notify.handleError);
  }

  startup();
}
