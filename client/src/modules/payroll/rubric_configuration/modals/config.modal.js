angular.module('bhima.controllers')
  .controller('RubricConfigModalController', RubricConfigModalController);

RubricConfigModalController.$inject = [
  '$state', 'ConfigurationService', 'NotifyService', 'appcache', 'RubricService', 'params', '$q',
];

/**
* @function RubricConfigModalController
*
* @description This controller is responsible for the configuration of rubrics in the payroll module.
* It provides the user with a modal to select which rubrics are active in the payroll configuration.
*/
function RubricConfigModalController($state, Configs, Notify, AppCache, Rubrics, params, $q) {
  const vm = this;
  vm.config = {};

  const cache = AppCache('RubricConfigModal');

  if (params.isCreateState || params.id) {
    cache.stateParams = params;
    vm.stateParams = cache.stateParams;
  } else {
    vm.stateParams = cache.stateParams;
  }

  vm.isCreateState = params.isCreateState;

  // exposed methods
  vm.all = false;
  vm.socialCheck = false;
  vm.taxCheck = false;
  vm.otherCheck = false;
  vm.membershipFeeCheck = false;

  vm.toggleAllRubrics = toggleAllRubrics;
  vm.toggleSocialCares = toggleSocialCares;
  vm.toggleTaxes = toggleTaxes;
  vm.toggleMembershipFee = toggleMembershipFee;
  vm.toggleOthers = toggleOthers;
  vm.toggleIndexes = toggleIndexes;

  vm.submit = submit;
  vm.closeModal = closeModal;

  // TODO(@jniles): use a classify() statement to classify the rubrics based on their respective categtorization
  function startup() {
    vm.loading = true;

    $q.all([
      Configs.read(vm.stateParams.id),
      Rubrics.read(),
    ])
      .then(([config, rubrics]) => {
        vm.config = config;
        vm.rubrics = rubrics;

        // TODO(@jniles): why do we have a different classifcation of rubrics here?
        vm.socialCares = rubrics.filter(Rubrics.isSocialCareRubric);
        vm.taxes = rubrics.filter(Rubrics.isTaxRubric);
        vm.indexes = rubrics.filter(Rubrics.isIndexRubric);
        vm.membershipFee = rubrics.filter(Rubrics.isMembershipFeeRubric);
        vm.others = rubrics.filter(Rubrics.isOtherRubric);

        // return early if we are in the "create" state, since we don't have any items to process.
        if (vm.isCreateState) {
          return;
        }

        // check the rubrics in the UI that are configured for this rubric.
        const rubricGroups = [vm.socialCares, vm.taxes, vm.indexes, vm.membershipFee, vm.others];
        const rubricItems = new Set(vm.config.items.map(c => c.rubric_payroll_id));

        rubricGroups.forEach(group => {
          group.forEach(unit => {
            if (rubricItems.has(unit.id)) {
              unit.checked = true;
            }
          });
        });
      })
      .catch(Notify.handleError)
      .finally(() => { vm.loading = false; });
  }

  // toggles all Rubrics to match there Configuration Rubric's setting
  function toggleAllRubrics(bool) {
    vm.headSocial = bool;
    vm.headTax = bool;
    vm.headOther = bool;
    vm.headMembershipFee = bool;

    vm.rubrics.forEach(rubric => {
      rubric.checked = bool;
    });
  }

  function toggleSocialCares(status) {
    vm.headSocial = !status;
    vm.socialCares.forEach(rubric => {
      vm.socialCheck = !status;
      rubric.checked = !status;
    });
  }

  function toggleIndexes(status) {
    vm.indexes.forEach(rubric => {
      rubric.checked = status;
    });
  }

  function toggleTaxes(status) {
    vm.headTax = !status;

    vm.taxes.forEach(rubric => {
      vm.taxCheck = !status;
      rubric.checked = !status;
    });
  }

  function toggleOthers(status) {
    vm.headOther = !status;

    vm.others.forEach(rubric => {
      vm.otherCheck = !status;
      rubric.checked = !status;
    });
  }

  function toggleMembershipFee(status) {
    vm.headMembershipFee = !status;

    vm.membershipFee.forEach(rubric => {
      vm.membershipFeeCheck = !status;
      rubric.checked = !status;
    });
  }

  // submit the data to the server from all two forms (update, create)
  function submit() {
    const rubricChecked = [];
    const rubricGroups = [vm.socialCares, vm.taxes, vm.indexes, vm.membershipFee, vm.others];

    rubricGroups.forEach(group => {
      group.forEach(rubric => {
        if (rubric.checked) rubricChecked.push(rubric.id);
      });
    });

    const data = {
      items : rubricChecked,
      label : vm.config.label,
    };

    const promise = vm.isCreateState
      ? Configs.create(data)
      : Configs.update(vm.stateParams.id, data);

    return promise
      .then(() => {
        if (vm.isCreateState) {
          Notify.success('FORM.INFO.CREATE_SUCCESS');
        } else {
          Notify.success('FORM.INFO.UPDATE_SUCCESS');
        }
        $state.go('configurationRubric', null, { reload : true });
      })
      .catch(Notify.handleError);
  }

  function closeModal() { $state.go('^'); }

  startup();
}
