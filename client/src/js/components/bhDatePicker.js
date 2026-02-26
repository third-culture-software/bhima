angular.module('bhima.components')
  .component('bhDatePicker', {
    templateUrl : '/modules/templates/bhDatePickerAction.tmpl.html',
    controller  : DatePickerController,
    bindings    : {
      date     : '<', // set the date once as the initial date and use callbacks to change it later
      onChange : '&', // use a callback to notify for changes
      format   : '<?',
      mode     : '@?', // will this ever change?  If so, we can use '<'
      disabled : '<?', // Optional flag to disable this field
      required : '<?',
    },
  });

DatePickerController.$inject = ['$uibModal', 'bhConstants'];

/**
 * bhDatePicker Component
 *
 * An inline component for permits to the user to choose a date in a modal box
 * @param Modal
 * @param bhConstants
 * @module components/bhDatePicker
 */
function DatePickerController(Modal, bhConstants) {
  const vm = this;

  vm.$onInit = () => {
    if (vm.date) {
      vm.date = new Date(vm.date);
    }
  };

  const modalParameters = {
    size         : 'sm',
    backdrop     : 'static',
    animation    : true,
    templateUrl  : '/modules/templates/bhDatePicker.tmpl.html',
    controller   : DatePickerModalController,
    controllerAs : '$ctrl',
  };

  // bind methods
  vm.dateFormat = vm.format || bhConstants.dayOptions.format;
  vm.notifyDateChange = notifyDateChange;
  vm.open = open;

  // on date change
  /**
   *
   */
  function notifyDateChange() {
    vm.onChange({ date : vm.date });
  }

  /**
   *
   */
  function open() {
    if (vm.disabled) {
      // Do not open the date picker popup if the field is disabled
      return;
    }
    openDatePicker({ mode : vm.mode })
      .then(date => {
        // notify the parent controller of a date change via a callback
        vm.onChange({ date });
      });
  }

  /**
   *
   */
  function openDatePicker() {
    const params = angular.extend(modalParameters, {
      resolve : { data : () => ({}) },
    });
    const instance = Modal.open(params);
    return instance.result;
  }
}

/**
 * bhDatePicker Modal
 */
DatePickerModalController.$inject = ['$uibModalInstance', 'data'];

/**
 *
 * @param Instance
 * @param Data
 */
function DatePickerModalController(Instance, Data) {
  const vm = this;

  vm.selected = new Date();

  vm.options = {
    datepickerMode : Data.mode || 'day',
    minDate        : vm.minDate,
    maxDate        : vm.maxDate,
    showWeeks      : false,
  };

  vm.submit = submit;
  vm.cancel = Instance.close;

  /**
   *
   */
  function submit() {
    Instance.close(vm.selected);
  }
}
