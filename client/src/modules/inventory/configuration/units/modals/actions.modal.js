angular.module('bhima.controllers')
  .controller('InventoryUnitActionsModalController', InventoryUnitActionsModalController);

InventoryUnitActionsModalController.$inject = [
  'InventoryUnitService', 'NotifyService', '$uibModalInstance', 'data',
];

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

  /** submit data */
  function submit(form) {
    if (form.$invalid) { return; }

    const record = cleanForSubmit(vm.session);
    map[vm.action](record, vm.identifier)
      .then((res) => {
        Instance.close(res);
      });
  }

  /** add inventory unit */
  function addUnit(record) {
    return InventoryUnit.create(record)
      .catch(Notify.handleError);
  }

  /** edit inventory unit */
  function editUnit(record, uuid) {
    return InventoryUnit.update(uuid, record)
      .catch(Notify.handleError);
  }

  /** format data to data structure in the db */
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
