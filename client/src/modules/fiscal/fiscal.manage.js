angular.module('bhima.controllers')
  .controller('FiscalManagementController', FiscalManagementController);

FiscalManagementController.$inject = [
  '$state', 'FiscalService', 'NotifyService', 'ModalService', 'util', 'moment',
];

/**
 * This controller is responsible for creating and updating a fiscal year. It
 * provides utility functions for submission and error handling.
 * @param $state
 * @param Fiscal
 * @param Notify
 * @param Modal
 * @param util
 * @param moment
 */
function FiscalManagementController($state, Fiscal, Notify, Modal, util, moment) {
  const vm = this;

  // state constiables
  vm.isUpdateState = $state.current.name === 'fiscal.update';
  vm.isListState = $state.current.name === 'fiscal.list';
  vm.isCreateState = $state.current.name === 'fiscal.create';

  // identifier
  const { id } = $state.params;
  const isUpdate = (id && vm.isUpdateState);

  // global constiables
  vm.fiscal = {};
  vm.state = $state;
  vm.submit = submit;
  vm.maxLength = util.maxTextLength;
  vm.numberOfMonths = numberOfMonths;

  // expose to the view
  vm.closingFiscalYear = closingFiscalYear;

  /**
   *
   */
  function startup() {
    if (id && vm.isUpdateState) {
      // concerned fiscal year
      Fiscal.read(id)
        .then(fiscalYear => {
          vm.fiscal = fiscalYear;
          $state.params.label = vm.fiscal.label;
          vm.fiscal.start_date = new Date(vm.fiscal.start_date);
          vm.fiscal.end_date = new Date(vm.fiscal.end_date);
        })
        .catch(Notify.handleError);
    }

    // previous fiscal year
    Fiscal.read(null, { detailed : 1 })
      .then((previous) => {
        if (!previous.length) { return; }

        let years = previous;

        // remove the current fiscal year in the previous one list
        if (id && vm.isUpdateState) {
          years = years.filter((fiscYear) => {
            return parseInt(fiscYear.id, 10) !== parseInt(id, 10);
          });
        }

        const fmt = (date) => moment(date).format('DD MMM YYYY');

        vm.previous_fiscal_year = years.map(fy => {
          fy.hrLabel = fy.label
            .concat(` (${fmt(fy.start_date)} - ${fmt(fy.end_date)})`);
          return fy;
        });
      })
      .catch(Notify.handleError);
  }

  /**
   * @function closingFiscalYear
   * @description launch the modal for closing a fiscal year
   */
  function closingFiscalYear() {
    if (!vm.isUpdateState) { return; }

    Modal.openClosingFiscalYear(vm.fiscal)
      .then(res => {
        if (!res) { return; }
        $state.go('fiscal.list', null, { reload : true });
      });
  }

  /**
   * @param dateFrom
   * @param dateTo
   * @function numberOfMonths
   * @description get the number of months between two dates
   */
  function numberOfMonths(dateFrom, dateTo) {
    if (!vm.fiscal) { return; }
    const startDate = moment(dateFrom);
    const endDate = moment(dateTo);
    vm.fiscal.number_of_months = Math.ceil(endDate.diff(startDate, 'months', true));
  }

  /**
   * @param form
   * @function submit
   * @description submit the form
   */
  function submit(form) {
    // ensure all angular form validation checks have passed
    if (form.$invalid) {
      Notify.danger('FORM.ERRORS.RECORD_ERROR');
      return 0;
    }

    // get the number of months
    numberOfMonths(vm.fiscal.start_date, vm.fiscal.end_date);

    // remove timezone information by considering just date
    vm.fiscal.start_date = moment(vm.fiscal.start_date).format('YYYY-MM-DD');
    vm.fiscal.end_date = moment(vm.fiscal.end_date).format('YYYY-MM-DD');

    const promise = isUpdate ? Fiscal.update(id, vm.fiscal) : Fiscal.create(vm.fiscal);

    return promise
      .then(() => {
        Notify.success(isUpdate ? 'FORM.INFO.UPDATE_SUCCESS' : 'FORM.INFO.CREATE_SUCCESS');

        // navigate back to list view
        $state.go('fiscal.list', null, { reload : true });
      })
      .catch(Notify.handleError);
  }

  startup();
}
