angular.module('bhima.controllers')
  .controller('ContainerEditModalController', ContainerEditModalController);

// dependencies injections
ContainerEditModalController.$inject = [
  'data', 'ShipmentContainerService', 'NotifyService', '$uibModalInstance',
];

/**
 *
 * @param Data
 * @param Containers
 * @param Notify
 * @param Instance
 */
function ContainerEditModalController(Data, Containers, Notify, Instance) {

  const vm = this;

  const { NOT_CREATED } = Containers;

  vm.isCreate = Data.action === 'create';
  vm.existingContainer = Data.action === 'edit' && !(NOT_CREATED in Data.container);

  vm.knownContainers = new Set();
  if (Data.known) {
    Data.known.forEach(lab => {
      vm.knownContainers.add(lab.toLowerCase());
    });
  }

  vm.loading = false;

  vm.container = {};

  vm.cancel = () => Instance.close(null);
  vm.submit = submit;

  vm.checkLabel = checkLabel;

  /**
   *
   */
  function startup() {
    vm.loading = true;

    Containers.containerTypes()
      .then((ctypes) => {
        vm.containerTypes = ctypes;
        return true;
      })
      .then(() => {
        if (Data.container) {
          // This means we are editing
          vm.container = Data.container;

          // Don't complain if we re-use the same label while editing
          vm.knownContainers.delete(vm.container.label.toLowerCase());
        }
      })
      .finally(() => {
        vm.loading = false;
      });
  }

  /* tslint: disable:no-unused-variable */
  /**
   *
   * @param key
   * @param value
   */
  function checkLabel(key, value) {
    if (vm.form) {
      // If we have entered a duplicate label before, reset the field and form when it is okay
      const valid = value ? !vm.knownContainers.has(value.toLowerCase()) : true;
      vm.form.textValueForm.inputTextElement.$invalid = !valid;
      vm.form.textValueForm.inputTextElement.$valid = valid;
      vm.form.$valid = valid;
      vm.form.$invalid = !valid;
    }
  }

  /**
   *
   * @param form
   */
  function submit(form) {
    if (form.$invalid) { return false; }

    // Make sure the proposed container label is unique
    // @TODO: Add a validator to bhInputText component to avoid these hacks
    if (vm.knownContainers.has(vm.container.label.toLowerCase())) {
      form.textValueForm.inputTextElement.$invalid = true;
      form.textValueForm.inputTextElement.$valid = false;
      form.textValueForm.inputTextElement.$setValidity('unique', false);
      vm.form = form; // save a reference for resetting the form when the label is corrected
      return false;
    }

    // NOTE: If the container did not already exist, do not create a new one.
    //       Let the parent controller (create_shipment) do that when
    //       appropriate.  Return the new/edited container.

    if (vm.existingContainer) {
      // The container already exists, so update it in the database immediately
      const updates = { // These are the only fields that we can update
        label : vm.container.label,
        weight : vm.container.weight,
        description : vm.container.description,
        container_type_id : vm.container.container_type_id,
      };
      Containers.update(vm.container.uuid, updates)
        .catch(Notify.handleError);
    }

    const ctype = vm.containerTypes.find(ct => ct.id === vm.container.container_type_id);
    vm.container.container_type = ctype.text;

    return Instance.close(vm.container);
  }

  startup();
}
