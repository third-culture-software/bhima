angular.module('bhima.controllers')
  .controller('CashboxController', CashboxController);

CashboxController.$inject = [
  'SessionService', 'ProjectService', 'CashboxService', 'util',
  'NotifyService', '$state',
];

/**
 * Cashbox Controller
 *
 * This controller is responsible for creating new cashboxes for the enterprise.
 * A valid cashbox must have accounts defined for each enterprise currency, for
 * ease of use thought the application.
 * @param Session
 * @param Projects
 * @param CashBoxes
 * @param util
 * @param Notify
 * @param $state
 */
function CashboxController(Session, Projects, CashBoxes, util, Notify, $state) {
  const vm = this;

  // bind variables
  vm.state = $state;

  vm.isUpdateState = isUpdateState;
  vm.isEditState = isEditState;
  vm.isCreateState = isCreateState;

  vm.enterprise = Session.enterprise;
  vm.project = Session.project;
  vm.maxLength = util.maxTextLength;

  /* ------------------------------------------------------------------------ */

  // is update state function
  /**
   *
   */
  function isUpdateState() {
    return ($state.current.name === 'cashboxes.edit' || $state.current.name === 'cashboxes.create');
  }

  // is edit state function
  /**
   *
   */
  function isEditState() {
    return ($state.current.name === 'cashboxes.edit');
  }

  // is create state function
  /**
   *
   */
  function isCreateState() {
    return ($state.current.name === 'cashboxes.create');
  }

  // fired on startup
  /**
   *
   */
  function startup() {
    // load projects
    Projects.read()
      .then((projects) => {
        vm.projects = projects;
      })
      .catch(Notify.handleError);

    // load cashboxes
    CashBoxes.read(null, { includeUsers : true }).then((cashboxes) => {
      vm.cashboxes = cashboxes;
    }).catch(Notify.handleError);
  }

  startup();
}
