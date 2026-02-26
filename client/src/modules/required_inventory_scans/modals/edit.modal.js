angular.module('bhima.controllers')
  .controller('RequiredInventoryScanEditModalController', RequiredInventoryScanEditModalController);

// dependencies injections
RequiredInventoryScanEditModalController.$inject = [
  'data', 'RequiredInventoryScansService',
  'SessionService', 'NotifyService', '$uibModalInstance',
];

/**
 *
 * @param Data
 * @param ReqInvScansService
 * @param Session
 * @param Notify
 * @param Instance
 */
function RequiredInventoryScanEditModalController(Data, ReqInvScansService,
  Session, Notify, Instance) {

  const vm = this;

  vm.loading = false;

  vm.today = new Date();

  vm.model = { };

  vm.enterprise = Session.enterprise;
  vm.cancel = Instance.dismiss;
  vm.submit = submit;

  vm.clear = key => {
    delete vm.model[key];
  };

  vm.onSelectDepot = (depot) => {
    vm.model.depot_uuid = depot.uuid;
  };

  vm.onEndDateChange = (date) => {
    vm.model.end_date = date;
  };

  vm.onStartDateChange = (date) => {
    vm.model.start_date = date;
  };

  /**
   *
   */
  function startup() {
    vm.loading = true;

    if (Data.uuid) {
      ReqInvScansService.details(Data.uuid)
        .then((details) => {
          vm.model = details;
          vm.model.end_date = new Date(details.end_date);
          vm.model.start_date = new Date(details.start_date);
        })
        .catch(Notify.handleError)
        .finally(() => {
          vm.loading = false;
        });
    } else {
      vm.model = {
        start_date : vm.today,
        is_asset : 1,
      };
      if (Data.depot_uuid) {
        vm.model.depot_uuid = Data.depot_uuid;
      }
      vm.loading = false;
    }
  }

  /**
   *
   * @param form
   */
  function submit(form) {
    if (form.$invalid) { return 0; }

    if (vm.model.uuid) {
      return ReqInvScansService.update(Data.uuid, vm.model)
        .then(() => {
          Notify.success('ASSET.REQUIRED_INVENTORY_SCAN_EDITED');
          Instance.close(true);
        })
        .catch(Notify.handleError);
    }

    return ReqInvScansService.create(vm.model)
      .then(() => {
        // Ignore new UUID return value
        Notify.success('ASSET.REQUIRED_INVENTORY_SCAN_CREATED');
        Instance.close(true);
      })
      .catch(Notify.handleError);
  }

  startup();
}
