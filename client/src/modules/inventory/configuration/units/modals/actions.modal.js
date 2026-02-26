angular.module('bhima.controllers')
  .controller('InventoryUnitActionsModalController', InventoryUnitActionsModalController);

InventoryUnitActionsModalController.$inject = [
  'InventoryUnitService', 'NotifyService', '$uibModalInstance', 'data',
];

/**
 *
 * @param InventoryUnit
 * @param Notify
 * @param Instance
 * @param Data
 */
function InventoryUnitActionsModalController(InventoryUnit, Notify, Instance, Data) {
  const vm = this;
  vm.session = {};

  // map for actions
  const map = { add : addUnit, edit : editUnit };

  // expose to the view
  vm.submit = submit;
  vm.cancel = () => Instance.dismiss();

  // startup
  startup();

  /**
   * submit data
   * @param form
   */
  function submit(form) {
    if (form.$invalid) { return; }

    const record = cleanForSubmit(vm.session);
    map[vm.action](record, vm.identifier)
      .then((res) => {
        Instance.close(res);
      });
  }

  /**
   * add inventory unit
   * @param record
   */
  function addUnit(record) {
    return InventoryUnit.create(record)
      .catch(Notify.handleError);
  }

  /**
   * edit inventory unit
   * @param record
   * @param uuid
   */
  function editUnit(record, uuid) {
    return InventoryUnit.update(uuid, record)
      .catch(Notify.handleError);
  }

  /**
   * format data to data structure in the db
   * @param session
   */
  function cleanForSubmit(session) {
    return {
      abbr : session.abbr,
      text : session.text,
    };
  }

  /** startup */
  function startup() {
    vm.action = Data.action;
    vm.identifier = Data.identifier;

    if (vm.identifier) {
      InventoryUnit.read(vm.identifier)
        .then((unit) => {
          [vm.session] = unit;
        })
        .catch(Notify.handleError);
    }
  }
}
