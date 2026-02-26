angular.module('bhima.controllers')
  .controller('EditAccountBudgetModalController', EditAccountBudgetModalController);

EditAccountBudgetModalController.$inject = [
  'BudgetService', 'CurrencyService', '$uibModalInstance', 'SessionService',
  'NotifyService', 'data', '$translate',
];

/**
 *
 * @param Budget
 * @param Currency
 * @param Instance
 * @param Session
 * @param Notify
 * @param data
 * @param $translate
 */
function EditAccountBudgetModalController(
  Budget, Currency, Instance, Session, Notify, data, $translate) {

  const vm = this;

  vm.loading = false;
  vm.cancel = Instance.close;

  const { account } = data;
  vm.account = account;
  vm.year = data.year;
  vm.currency = Currency;

  // Save the previous budget numbers
  vm.account.period.forEach(p => {
    p.old_budget = p.budget;
    p.old_locked = p.locked;
    p.budget_invalid = false;
  });

  vm.breadcrumb = $translate.instant('BUDGET.EDIT_ACCOUNT_BUDGET.TITLE',
    { acctNum : account.number, acctLabel : account.label });

  vm.budget_column_label = $translate.instant('BUDGET.EDIT_ACCOUNT_BUDGET.BUDGET_COLUMN_LABEL',
    { currencySymbol : (Currency.symbol(Session.enterprise.currency_id)).toUpperCase() });

  /**
   *
   * @param periods
   */
  function computeTrialAdjustment(periods) {
    // Compute the total locked
    let totalLocked = 0.0;
    let numLocked = 0;
    periods.forEach(p => {
      if (p.locked) {
        totalLocked += p.budget;
        numLocked += 1;
      }
    });

    // Make sure the total locked is not greater than the total budget for the account!
    if (totalLocked > vm.account.budget) {
      return false;
    }

    // Do the adjustment
    const newBudget = (account.budget - totalLocked) / (12 - numLocked);
    periods.forEach(p => {
      if (!p.locked) {
        p.budget = newBudget;
      }
    });

    return true;
  }

  vm.updateBudgetPeriod = function updateBudgetPeriod(period) {
    period.old_locked = period.locked ? 0 : 1;
    vm.updateBudgets(period, period.locked);
  };

  vm.updateBudgets = function updateBudgets(period, flag) {
    period.locked = flag;

    // Construct trial data
    const trialPeriods = [];
    account.period.forEach(p => {
      trialPeriods.push({
        key : p.key,
        budget : p.budget,
        locked : p.locked,
      });
    });

    if (computeTrialAdjustment(trialPeriods)) {
      // The trial was okay so apply the adjustments
      account.period.forEach(p => {
        if (!p.locked) {
          const tp = trialPeriods.find(item => item.key === p.key);
          p.budget = tp.budget;
        }
        // No need to adjust the locked budget values
      });

    } else {
      // Revert the changes and complain that the new total is greater than the available budget
      period.locked = period.old_locked;
      period.budget = period.old_budget;
      Instance.close(false);
      Notify.warn($translate.instant('BUDGET.EDIT_ACCOUNT_BUDGET.ERROR_NEW_BUDGET_TOO_HIGH'));
    }

  };

  vm.submit = async () => {
    vm.loading = true;

    // Save the results!
    const changes = [];

    // Note that this will update all periods if one is changed (rebalanced)
    account.period.forEach(p => {
      if ((p.budget !== p.old_budget) || (p.locked !== p.old_locked)) {
        changes.push({
          budgetId : p.budgetId,
          newBudget : p.budget,
          newLocked : p.locked,
        });
      }
    });

    // let the user know if there were no changes
    if (changes.length === 0) {
      Notify.success($translate.instant('BUDGET.EDIT_ACCOUNT_BUDGET.NO_CHANGES'));
      return Instance.close(true);
    }

    try {
      await Budget.updateBudgetPeriods(changes);
    } catch (err) {
      Notify.handleError(err);
    } finally {
      vm.loading = false;
    }

    return Instance.close(true);
  };

}
