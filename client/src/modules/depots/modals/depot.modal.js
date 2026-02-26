angular.module('bhima.controllers')
  .controller('DepotModalController', DepotModalController);

DepotModalController.$inject = [
  '$state', 'DepotService', 'NotifyService', 'SessionService', 'params',
  'FormatTreeDataService',
];

/**
 *
 * @param $state
 * @param Depots
 * @param Notify
 * @param Session
 * @param params
 * @param FormatTreeData
 */
function DepotModalController($state, Depots, Notify, Session, params, FormatTreeData) {
  const vm = this;

  vm.depot = {};

  vm.identifier = params.uuid;
  vm.isCreateState = params.isCreateState;
  vm.enable_strict_depot_distribution = Session.stock_settings.enable_strict_depot_distribution;

  vm.onSelectDepot = onSelectDepot;
  vm.onDistributionDepotChange = onDistributionDepotChange;
  vm.clear = clear;
  vm.submit = submit;

  if (params.parentUuid) {
    vm.depot.parent_uuid = params.parentUuid;
  }

  /**
   *
   * @param depots
   * @param checkedDepotUuids
   */
  function buildDepotsTree(depots = [], checkedDepotUuids = []) {
    const tree = depots.map(item => {
      item.id = item.uuid;
      item.parent = item.parent_uuid;
      item.key = item.text;
      item._checked = false;

      if (item.parent === '0') {
        item.parent = 0;
      }

      if (checkedDepotUuids.length) {
        checkedDepotUuids.forEach(depotUuid => {
          if (item.uuid === depotUuid) {
            item._checked = true;
          }
        });
      }
      return item;
    });
    vm.depotsData = FormatTreeData.formatStore(tree);
  }

  Depots.read()
    .then(depots => {
      vm.depots = depots;

      if (vm.isCreateState) {
        buildDepotsTree(depots, []);
      }
    })
    .then(() => {
      if (vm.isCreateState || !vm.identifier) { return null; }

      return Depots.read(vm.identifier)
        .then(depot => {
          buildDepotsTree(vm.depots, depot.allowed_distribution_depots);

          vm.depot = depot;

          // make sure hasLocation is set
          vm.hasLocation = vm.depot.location_uuid ? 1 : 0;

          if (vm.depot.parent === 0) {
            delete vm.depot.parent_uuid;
          }
        });
    })
    .catch(Notify.handleError);

  // if creating, insert the default min_months_security_stock
  if (vm.isCreateState) {
    vm.depot.min_months_security_stock = Session.stock_settings.default_min_months_security_stock;
  }

  /**
   *
   * @param depot
   */
  function onSelectDepot(depot) {
    vm.depot.parent_uuid = depot.uuid;
  }

  /**
   *
   * @param depots
   */
  function onDistributionDepotChange(depots) {
    vm.depot.allowed_distribution_depots = depots;
  }

  /**
   *
   * @param item
   */
  function clear(item) {
    delete vm.depot[item];
  }

  /**
   * @function submit
   * @param {object} depotForm the form object
   * @description submit the data to the server from all two forms (update, create)
   * @todo check depotForm.$pristine state also for changes in components
   */
  function submit(depotForm) {
    if (depotForm.$invalid) {
      return 0;
    }

    vm.depot.allowed_distribution_depots = [];
    const filterChecked = vm.depotsData.filter(item => item._checked);
    const authorizedDestinationDepots = filterChecked.map(depot => depot.uuid);
    vm.depot.allowed_distribution_depots = authorizedDestinationDepots;

    Depots.clean(vm.depot);

    if (vm.hasLocation === 0) {
      vm.depot.location_uuid = null;
    }

    if (!vm.depot.parent_uuid) {
      vm.depot.parent_uuid = 0;
    }

    const promise = (vm.isCreateState)
      ? Depots.create(vm.depot)
      : Depots.update(vm.depot.uuid, vm.depot);

    return promise
      .then(() => {
        const translateKey = (vm.isCreateState) ? 'DEPOT.CREATED' : 'DEPOT.UPDATED';
        Notify.success(translateKey);
        $state.go('depots', null, { reload : true });
      })
      .catch(Notify.handleError);
  }

  /**
   * destination depots handlers
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
  vm.setNodeValue = setNodeValue;

  /**
   *
   * @param depot
   */
  function setRootValue(depot) {
    depot._checked = !depot._checked;
  }
  vm.setRootValue = setRootValue;

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
  vm.setAllNodeValue = setAllNodeValue;

  /**
   *
   */
  function toggleFilter() {
    if (vm.filterActive) {
      vm.filterActive = false;
      vm.filter = '';
    } else {
      vm.filterActive = true;
    }
  }
  vm.toggleFilter = toggleFilter;
}
