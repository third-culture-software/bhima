angular.module('bhima.controllers')
  .controller('FiscalController', FiscalController);

FiscalController.$inject = [
  '$state', 'FiscalService', 'ModalService', 'NotifyService', '$window',
];

/**
 *
 * @param $state
 * @param Fiscal
 * @param ModalService
 * @param Notify
 * @param $window
 */
function FiscalController($state, Fiscal, ModalService, Notify, $window) {
  const vm = this;
  const today = new Date();

  // pagination configuration
  /** @todo this should all be moved to a component */
  vm.pageSize = 5;
  vm.currentPage = 1;
  vm.fiscalYears = [];
  vm.maxSize = 5;
  vm.del = del;

  vm.sort = sort;
  vm.state = $state;
  vm.back = back;

  vm.sortByName = 'ASC';
  vm.sortByDateCreated = 'ASC';
  vm.sortByNumberOfMonth = 'ASC';

  vm.loadingState = true;
  vm.loadingError = false;

  // refresh Fiscal Year
  /**
   *
   * @param option
   */
  function refreshFiscalYear(option = {}) {
    option.detailed = 1;
    return Fiscal.read(null, option)
      .then(fiscalYears => {
        vm.fiscalYears = fiscalYears;
      }).catch(err => {
        vm.loadingError = true;
        Notify.handleError(err);
      }).finally(() => {
        vm.loadingState = false;
      });
  }

  // Get the fiscal Year By Date
  Fiscal.getFiscalYearByDate({ date : today })
    .then((current) => {
      vm.current = current;
      vm.currentFiscalYearId = vm.current[0].fiscal_year_id;
      vm.previousFiscalYearId = vm.current[0].previous_fiscal_year_id;
    })
    .catch(Notify.handleError);

  // switch to delete warning mode
  /**
   *
   * @param fiscal
   */
  function del(fiscal) {
    ModalService.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then((bool) => {
        // if the user clicked cancel, reset the view and return
        if (!bool) { return; }
        Fiscal.delete(fiscal.id)
          .then(() => {
            Notify.success('FORM.INFO.DELETE_SUCCESS');
            return refreshFiscalYear();
          })
          .catch(() => {
            Notify.danger('FISCAL.CAN_NOT_DELETE_FY');
          });
      });
  }

  /**
   *
   */
  function back() {
    $window.history.back();
  }

  /**
   *
   * @param option
   */
  function sort(option) {
    vm.sorted = option.by;
    option.detailed = 1;

    if (option.by === 'label' && option.order === 'ASC') {
      vm.sortByName = 'DESC';
      vm.nameDesc = 'up';
    } else if (option.by === 'label' && option.order === 'DESC') {
      vm.sortByName = 'ASC';
      vm.nameDesc = 'down';
    }

    if (option.by === 'created_at' && option.order === 'ASC') {
      vm.sortByDateCreated = 'DESC';
      vm.dateDesc = 'up';
    } else if (option.by === 'created_at' && option.order === 'DESC') {
      vm.sortByDateCreated = 'ASC';
      vm.dateDesc = 'down';
    }

    if (option.by === 'number_of_months' && option.order === 'ASC') {
      vm.sortByNumbrerOfMonth = 'DESC';
      vm.nbMonthDesc = 'up';
    } else if (option.by === 'number_of_months' && option.order === 'DESC') {
      vm.sortByNumbrerOfMonth = 'ASC';
      vm.nbMonthDesc = 'down';
    }

    refreshFiscalYear(option);
  }

  refreshFiscalYear();
}
