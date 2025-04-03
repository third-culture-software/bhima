angular.module('bhima.controllers')
  .controller('EnterpriseController', EnterpriseController);

EnterpriseController.$inject = [
  'EnterpriseService', 'util', 'NotifyService', 'ProjectService', 'ModalService',
  'ScrollService', 'SessionService', 'Upload', '$timeout',
];

/**
 * @function EnterpriseController
 *
 * @description
 * This controller binds the basic CRUD operations on the enterprise.
 */
function EnterpriseController(Enterprises, util, Notify, Projects, Modal, ScrollTo, Session, Upload, $timeout) {
  const vm = this;

  vm.enterprise = {};
  vm.maxLength = util.maxTextLength;
  vm.length50 = util.length50;
  vm.length100 = util.length100;
  vm.hasEnterprise = false;
  vm.maxLogoFileSize = '2MB';

  let $touched = false;

  // bind methods
  vm.submit = submit;
  vm.onSelectGainAccount = onSelectGainAccount;
  vm.onSelectLossAccount = onSelectLossAccount;
  vm.setThumbnail = setThumbnail;
  vm.enablePRFDetails = enablePRFDetails;

  function enablePRFDetails(value) {
    const key = 'enable_prf_details';
    vm.enterprise.settings[key] = value;
    $touched = true;
  }

  function uploadLogo(file) {
    if (!vm.hasThumbnail) { return null; }

    file.upload = Upload.upload({
      url : `/enterprises/${Session.enterprise.id}/logo`,
      data : { logo : file },
    });

    return file.upload
      .then((response) => {
        $timeout(() => {
          vm.enterprise.logo = response.data.logo;
        });
      })
      .catch((error) => {
        Notify.handleError(error);
      });
  }

  /** set thumbnail for the selected image */
  function setThumbnail(file) {
    if (!file) {
      vm.documentError = true;
      return;
    }
    const isImage = file.type.includes('image/');
    vm.thumbnail = file;
    vm.hasThumbnail = (vm.thumbnail && isImage);
  }

  // fired on startup
  function startup() {

    // load enterprises
    Enterprises.read(null, { detailed : 1 })
      .then(enterprises => {
        vm.hasEnterprise = (enterprises.length > 0);
        vm.enterprise = vm.hasEnterprise ? enterprises[0] : {};
        return refreshProjects();
      })
      .catch(Notify.handleError);
  }

  function onSelectGainAccount(account) {
    vm.enterprise.gain_account_id = account.id;
  }

  vm.scrollToSubmission = function scrollToSubmission() {
    ScrollTo('submission');
  };

  function onSelectLossAccount(account) {
    vm.enterprise.loss_account_id = account.id;
  }

  // form submission
  function submit(form) {
    if (form.$invalid) {
      Notify.danger('FORM.ERRORS.HAS_ERRORS');
      return 0;
    }

    // make sure only fresh data is sent to the server.
    if (form.$pristine && !$touched && !vm.hasThumbnail) {
      Notify.warn('FORM.WARNINGS.NO_CHANGES');
      return 0;
    }

    const creation = (vm.hasEnterprise === false);
    const changes = util.filterFormElements(form, true);

    Object.keys(vm.enterprise.settings).forEach(key => {
      delete changes[key];
    });

    changes.settings = angular.copy(vm.enterprise.settings);

    const promise = (creation)
      ? Enterprises.create(changes)
      : Enterprises.update(vm.enterprise.id, changes);

    return promise
      .then(() => {
        return vm.file ? uploadLogo(vm.file) : null;
      })
      .then(() => Notify.success(creation ? 'FORM.INFO.SAVE_SUCCESS' : 'FORM.INFO.UPDATE_SUCCESS'))
      .then(() => Session.reload())
      .catch(Notify.handleError);
  }

  /* ================================ PROJECT ================================ */

  vm.addProject = addProject;
  vm.editProject = editProject;
  vm.deleteProject = deleteProject;

  // refresh the displayed projects
  function refreshProjects() {
    return Projects.read(null, { complete : 1 })
      .then(projects => {
        vm.projects = projects;
      });
  }

  /**
   * @function editProject
   * @desc launch project modal for editing
   */
  function editProject(id) {
    const params = {
      action     : 'edit',
      identifier : id,
      enterprise : vm.enterprise,
    };

    Modal.openProjectActions(params)
      .then(value => {
        if (!value) { return; }

        refreshProjects();
        Notify.success('FORM.INFO.UPDATE_SUCCESS');
      })
      .catch(Notify.handleError);
  }

  /**
   * @function addProject
   * @desc launch project modal for adding new
   */
  function addProject() {
    Modal.openProjectActions({
      action     : 'create',
      enterprise : vm.enterprise,
    })
      .then(value => {
        if (!value) { return; }

        refreshProjects();
        Notify.success('FORM.INFO.CREATE_SUCCESS');
      })
      .catch(Notify.handleError);
  }

  /**
   * @function deleteProject
   * @desc delete an existing project
   * @param {number} id The project id
   */
  function deleteProject(id, pattern) {
    const params = {
      pattern,
      patternName : 'FORM.PATTERNS.PROJECT_NAME',
    };

    Modal.openConfirmDialog(params)
      .then(bool => {
        if (!bool) { return; }

        Projects.delete(id)
          .then(() => {
            Notify.success('FORM.INFO.DELETE_SUCCESS');
            return refreshProjects();
          })
          .catch(Notify.handleError);
      });
  }

  /**
   * @function proxy
   *
   * @description
   * Proxies requests for different enterprise settings.
   *
   * @returns {function}
   */
  function proxy(key) {
    return (enabled) => {
      vm.enterprise.settings[key] = enabled;
      $touched = true;
    };
  }

  vm.enablePriceLockSetting = proxy('enable_price_lock');
  vm.enablePrepaymentsSetting = proxy('enable_prepayments');
  vm.enablePasswordValidationSetting = proxy('enable_password_validation');
  vm.enableBalanceOnInvoiceReceipSetting = proxy('enable_balance_on_invoice_receipt');
  vm.enableBarcodesSetting = proxy('enable_barcodes');
  vm.enableAutoEmailReportSetting = proxy('enable_auto_email_report');
  vm.enableRequireCostCenterForPostingSetting = proxy('enable_require_cost_center_for_posting');

  startup();
}
