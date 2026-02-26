angular.module('bhima.controllers')
  .controller('SupplierCreateUpdateController', SupplierCreateUpdateController);

SupplierCreateUpdateController.$inject = [
  'data', 'SupplierService',
  'NotifyService', '$uibModalInstance',
  'CreditorGroupService',
];

/**
 *
 * @param data
 * @param SupplierService
 * @param Notify
 * @param Instance
 * @param CreditorGroups
 */
function SupplierCreateUpdateController(data, SupplierService, Notify,
  Instance, CreditorGroups) {
  const vm = this;
  vm.close = Instance.close;
  vm.submit = submit;
  vm.supplier = angular.copy(data);
  vm.isCreate = !vm.supplier.uuid;
  vm.action = vm.isCreate ? 'FORM.LABELS.CREATE' : 'FORM.LABELS.UPDATE';

  vm.onSelectContact = entity => {
    vm.supplier.contact_uuid = entity.uuid;
  };

  init();

  /**
   *
   * @param form
   */
  function submit(form) {
    if (form.$invalid) {
      Notify.danger('FORM.ERRORS.HAS_ERRORS');
      return false;
    }

    if (data.uuid) {
      delete vm.supplier.contact_name;
      delete vm.supplier.contact_phone;
      delete vm.supplier.contact_email;
      delete vm.supplier.contact_title;
    }

    const operation = (!data.uuid)
      ? SupplierService.create(vm.supplier)
      : SupplierService.update(data.uuid, vm.supplier);

    return operation
      .then(() => {
        Notify.success('FORM.INFO.OPERATION_SUCCESS');
        const message = vm.isCreate ? 'FORM.INFO.CREATE_SUCCESS' : 'FORM.INFO.UPDATE_SUCCESS';
        Notify.success(message);
        return Instance.close(true);
      })
      .catch(Notify.handleError);
  }

  /**
   *
   */
  function init() {
    // load Creditors
    CreditorGroups.read().then(groups => {
      vm.groups = groups;
      return data.uuid ? SupplierService.read(data.uuid) : null;
    })
      .catch(Notify.handleError);
  }

  vm.onInputTextChange = (key, value) => {
    vm.supplier[key] = value;
  };

}
