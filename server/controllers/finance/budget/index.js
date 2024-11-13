/**
 * The /budget HTTP API endpoint
 *
 * This module is responsible for budget storing and retrieving as well as other budget-related actions
 */

const _ = require('lodash');
const path = require('path');

const db = require('../../../lib/db');
const util = require('../../../lib/util');
const constants = require('../../../config/constants');
const BadRequest = require('../../../lib/errors/BadRequest');

const i18n = require('../../../lib/helpers/translate');

const Fiscal = require('../fiscal');
const budgetReport = require('../reports/budget');

const legalAccountTypes = ['title', 'income', 'expense'];

const { TITLE, EXPENSE, INCOME } = constants.accounts;
const allowedTypes = [TITLE, EXPENSE, INCOME];

// expose the API
exports.deleteBudget = deleteBudget;
exports.downloadTemplate = downloadTemplate;
exports.fillBudget = fillBudget;
exports.getBudgetData = getBudgetData;
exports.buildBudgetData = buildBudgetData;
exports.importBudget = importBudget;
exports.insertBudgetItem = insertBudgetItem;
exports.list = list;
exports.populateBudgetPeriods = populateBudgetPeriods;
exports.updateBudgetItem = updateBudgetItem;
exports.updateBudgetPeriods = updateBudgetPeriods;
exports.getReport = budgetReport.getReport;

const periodsSql = 'SELECT * FROM period p WHERE fiscal_year_id = ?';

const budgetSql = `
  SELECT
    b.id AS budgetId, b.period_id, b.budget, b.locked,
    a.id, a.number AS acctNum, a.label AS acctLabel, a.locked AS acctLocked,
    a.type_id AS acctTypeId, at.type AS acctType, p.number AS periodNum
  FROM budget AS b
  JOIN period AS p ON p.id = b.period_id
  JOIN account AS a ON a.id = b.account_id
  JOIN account_type AS at ON at.id = a.type_id
  WHERE p.fiscal_year_id = ?
  ORDER BY acctNum, periodNum
`;

/**
 * List budget data
 *
 * GET /budget  (include 'fiscal_year_id' in the query)
 *
 * @param {object} req - the request object
 * @param {object} res - the response object
 * @param {object} next - next middleware object to pass control to
 * @returns {object} HTTP/JSON response object
 */
function list(req, res, next) {
  const fiscalYearId = req.query.fiscal_year_id;
  return db.exec(budgetSql, [fiscalYearId])
    .then(rows => {
      res.status(200).json(rows);
    })
    .catch(next)
    
}

/**
 * Builds the budget data for display
 *
 * @param {number} fiscalYearId - id for the fiscal year
 * @returns {Promise} of all the rows of account and budget data
 */
function buildBudgetData(fiscalYearId) {
  let allAccounts;
  let accounts;
  let periodActuals;

  // Get basic info on all relevant accounts excluding hidden and blocked accounts.
  const accountsSql = `
    SELECT
      a.id, a.number, a.label, a.locked, a.type_id,
      a.parent, a.locked, a.hidden
    FROM account AS a
    WHERE a.type_id in (${allowedTypes}) AND a.locked = 0 AND a.hidden = 0;
  `;

  // First get the basic account and FY budget data (if available)
  const sql = `
    SELECT
      a.id, a.number, a.type_id, at.type AS acctType,
      a.label, a.parent, a.locked, a.hidden, a.locked AS acctLocked,
      bdata.budget
    FROM account AS a
    JOIN account_type AS at ON at.id = a.type_id
    LEFT JOIN (
    SELECT b.budget, b.account_id
    FROM budget AS b
    JOIN period AS p ON p.id = b.period_id
    WHERE p.number = 0 and p.fiscal_year_id = ?
    ) AS bdata ON bdata.account_id = a.id
    WHERE a.type_id in (${INCOME}, ${EXPENSE}) AND a.locked = 0 AND a.hidden = 0;
  `;

  // Retrieving the values for the periods, excluding period 0 and the closing period 13
  const actualsSql = `
    SELECT
      a.id,
      IFNULL(SUM(pt.debit), 0) AS debit,
      IFNULL(SUM(pt.credit), 0) AS credit
    FROM period_total pt
    JOIN account AS a ON a.id = pt.account_id
    JOIN account_type AS at ON at.id = a.type_id
    JOIN period AS p ON p.id = pt.period_id
    WHERE pt.fiscal_year_id = ? AND a.type_id in (${INCOME}, ${EXPENSE}) AND a.locked = 0
    AND a.hidden = 0 AND (p.number <> 0 AND p.number <> 13)
    GROUP BY a.id;
  `;

  // Retrieving the values for the periods, excluding period 0 and the closing period 13
  const periodActualsSql = `
    SELECT a.id, pt.debit, pt.credit, p.number AS periodNum
    FROM period_total pt
    JOIN period AS p ON p.id = pt.period_id
    JOIN account AS a ON a.id = pt.account_id
    JOIN account_type AS at ON at.id = a.type_id
    WHERE pt.fiscal_year_id = ? AND a.type_id in (${INCOME}, ${EXPENSE}) AND a.locked = 0
    AND a.hidden = 0 AND (p.number <> 0 AND p.number <> 13);
  `;

  const months = constants.periods.filter(elt => elt.periodNum !== 0);

  return db.exec(accountsSql)
    .then(acctData => {
      allAccounts = acctData;
      return db.exec(sql, [fiscalYearId]);
    })
    .then(data => {
      // This is the basic budget/accounts data
      accounts = data;

      // Get the FY debit/credit balances for all accounts
      return db.exec(actualsSql, [fiscalYearId]);
    })
    .then(actuals => {
      // Save the FY debit/credit balances for each account
      accounts.forEach(acct => {
        const adata = actuals.find(item => item.id === acct.id);
        acct.debit = adata ? adata.debit : null;
        acct.credit = adata ? adata.credit : null;
      });
      // Get the actuals for each account and period in the FY
      return db.exec(periodActualsSql, [fiscalYearId]);
    })
    .then(pActuals => {
      periodActuals = pActuals;
      // Get the budget information for each period in the FY
      return db.exec(budgetSql, [fiscalYearId]);
    })
    .then(budget => {
      // Add data to for the months for items with budget details
      accounts.forEach(acct => {
        acct.period = [];

        months.forEach(mon => {
          // Find the budget record for the period for this account
          const bdata = budget.find(bd => bd.id === acct.id && bd.periodNum === mon.periodNum);
          const adata = periodActuals.find(item => item.id === acct.id && item.periodNum === mon.periodNum);
          const record = {
            key : mon.key,
            label : mon.label,
          };
          if (bdata) {
            record.budget = bdata.budget;
            record.budgetId = bdata.budgetId;
            record.periodNum = bdata.periodNum;
            record.periodId = bdata.period_id;
            record.locked = bdata.locked;
          }
          if (adata) {
            record.credit = adata.credit || 0;
            record.debit = adata.debit || 0;
            record.actuals = (acct.type_id === INCOME) ? adata.credit - adata.debit : adata.debit - adata.credit;
          }
          acct.period.push(record);
        });
      });
      return accounts;
    })
    .then(data => {

      data.forEach(acct => {
        // Add the code/csv/translation friendly account types
        switch (acct.type_id) {
        case TITLE:
          acct.acctType = 'title';
          acct.type = 'ACCOUNT.TYPES.TITLE';
          acct.isTitle = true;
          break;
        case EXPENSE:
          acct.acctType = 'expense';
          acct.type = 'ACCOUNT.TYPES.EXPENSE';
          break;
        case INCOME:
          acct.acctType = 'income';
          acct.type = 'ACCOUNT.TYPES.INCOME';
          break;
        default:
        }
      });
      return sortAccounts(data, allAccounts);
    })
    .then(data => {
      return computeTitleAccountTotals(data, allAccounts);
    })
    .then(data => {
      computeSubTotals(data);
      return computeTitleAccountPeriodTotals(data, allAccounts);
    })
    .then(data => {
      return computeBudgetTotalsYTD(data, fiscalYearId);
    })
    .then(data => {
      return excludeTopLevelIEAccounts(data);
    })
    .then(data => {
      return data; // NOP for debugging convenience
    });
}

/**
 * Get the account and budget data for the fiscal year
 *
 * GET /budget/data/:fiscal_year
 *
 * @param {object} req - the request object
 * @param {object} res - the response object
 * @param {object} next - next middleware object to pass control to
 * @returns {object} HTTP/JSON response object
 */
function getBudgetData(req, res, next) {
  const fiscalYearId = req.params.fiscal_year;

  return buildBudgetData(fiscalYearId)
    .then(data => {
      res.status(200).json(data);
    })
    .catch(next)
    
}

/**
 * Sort the accounts into income and expenses sections
 *
 * (1) divide the accounts into income and expense accounts
 * (2) put the income accounts first
 * (3) add an income totals line after the incomes (and a blank row afterwards)
 * (4) add expenses accounts
 * (5) add an expenses total line
 *
 * Note that only income and expense accounts along with their title accounts are preserved.
 * All other account types (such as balance accounts) are excluded.
 *
 * @param {Array} origAccounts - list of accounts (modified in place)
 * @param {Array} allAccounts - list of all accounts (including title accounts)
 * @returns {Array} updated accounts list
 */
function sortAccounts(origAccounts, allAccounts) {

  // first separate the types of accounts
  const expenses = origAccounts.filter(item => item.type_id === EXPENSE);
  const incomes = origAccounts.filter(item => item.type_id === INCOME);

  // Improvement of the function for sorting account numbers by treating account numbers as strings.
  expenses.sort((a, b) => {
    return String(a.number).localeCompare(String(b.number));
  });

  incomes.sort((a, b) => {
    return String(a.number).localeCompare(String(b.number));
  });

  // Construct the list of periods (leave out the FY total period)
  const periods = constants.periods.filter(elt => elt.periodNum !== 0);

  // Reassemble the accounts array in the desired order
  const accounts = [];

  incomes.forEach(acct => {
    // Insert the title accounts first (if not already added)
    const parentIds = getTitleAccounts(acct.id, allAccounts);
    parentIds.forEach(pid => {
      if (!accounts.find(item => item.id === pid)) {
        const title = allAccounts.find(a => a.id === pid);
        title.type = typeToken(title.type_id);
        title.period = _.cloneDeep(periods);
        accounts.push(title);
      }
    });

    accounts.push(acct);
  });

  // Add a fake account for the income totals row
  accounts.push({
    $$treeLevel : 0,
    _$$treeLevel : 0,
    id : null,
    number : null,
    acctType : 'total-income',
    isTitle : true,
    type : 'ACCOUNT.TYPES.INCOME',
    label : 'BUDGET.INCOME_TOTAL',
    parent : 0,
    budget : null,
    debit : null,
    credit : null,
    period : _.cloneDeep(periods), // Make a copy
  });

  // Add in a blank row to separate income accounts from expense accounts
  accounts.push({
    $$treeLevel : 0,
    _$$treeLevel : 0,
    id : null,
    number : null,
    type_id : TITLE,
    isTitle : true,
    label : '',
    parent : 0,
    budget : null,
    debit : null,
    credit : null,
  });

  // Add the expense accounts next
  expenses.forEach(acct => {
    // Insert the title accounts first (if not already added)
    const parentIds = getTitleAccounts(acct.id, allAccounts);
    parentIds.forEach(pid => {
      if (!accounts.find(item => item.id === pid)) {
        const title = allAccounts.find(a => a.id === pid);
        title.type = typeToken(title.type_id);
        accounts.push(allAccounts.find(a => a.id === pid));
      }
    });

    accounts.push(acct);
  });

  // Add a fake account for the expense totals row
  accounts.push({
    $$treeLevel : 0,
    _$$treeLevel : 0,
    id : null,
    number : null,
    acctType : 'total-expenses',
    isTitle : true,
    type : 'ACCOUNT.TYPES.EXPENSE',
    label : 'BUDGET.EXPENSES_TOTAL',
    parent : 0,
    budget : null,
    debit : null,
    credit : null,
    period : _.cloneDeep(periods), // Make a copy
  });

  // Add in a blank row to separate income accounts from expense accounts
  accounts.push({
    $$treeLevel : 0,
    _$$treeLevel : 0,
    id : null,
    number : null,
    isTitle : true,
    label : '',
    parent : 0,
    budget : null,
    debit : null,
    credit : null,
  });

  // Finally, add a fake account for the totals summary row
  accounts.push({
    $$treeLevel : 0,
    _$$treeLevel : 0,
    id : null,
    number : null,
    acctType : 'total-summary',
    isTitle : true,
    type : '',
    label : 'BUDGET.TOTAL_SUMMARY',
    parent : 0,
    budget : null,
    debit : null,
    credit : null,
    period : _.cloneDeep(periods), // Make a copy
  });

  return accounts;
}

/**
 * Get the IDs of the parent title accounts for an account
 *
 * This is a recursive function used by getTitleAccounts
 *
 * @param {number} id - id of account to get parents of
 * @param {object} accounts - list of all accounts
 * @param {Array} parents - current list of parents
 * @returns {Array} of parent account IDs
 */
function getParentTitleAccounts(id, accounts, parents) {
  const acct = accounts.find(item => item.id === id);
  if (acct.parent === id) {
    // In some cases, some accounts erroneously point to themselves as parents.
    // Assume that there are no more parents.
    return parents;
  }
  const parentAcct = accounts.find(a => (a.id === acct.parent) && (a.type_id === TITLE));
  if (parentAcct) {
    parents.push(parentAcct.id);
    return getParentTitleAccounts(parentAcct.id, accounts, parents);
  }
  return parents;
}

/**
 * Return the IDs of all children accounts of an account given
 *
 * @param {Array} accounts - list of accounts
 * @param {number} parentId - The parent id
 * @returns {Array} list of IDs of all children accounts
 */
function getChildrenAccounts(accounts, parentId) {
  const children = accounts.filter(account => account.parent === parentId);
  if (children.length === 0) { return []; }

  const results = [];
  children.forEach(acct => {
    results.push(acct.id);
    const grandChildren = getChildrenAccounts(accounts, acct.id);
    results.push(...grandChildren);
  });

  return results;
}

/**
 * Get a list of the parent title accounts for an account
 *
 * @param {number} id - id of account to get title accounts for
 * @param {Array} accounts - list of all acounts
 * @returns {Array} of title (parent) accounts for this account (in hierarchical order)
 */
function getTitleAccounts(id, accounts) {
  const parents = getParentTitleAccounts(id, accounts, []);
  return parents.sort((a, b) => a - b);
}

/**
 * Get the periods for a fiscal year
 *
 * An additional pseudo period (number = 0) is appended
 * for the bounds of the FY
 *
 * @param {number} fiscalYearId - ID for the fiscal year
 * @returns {Promise} of the list of periods
 */
function getPeriods(fiscalYearId) {
  let fiscalYear;
  return Fiscal.lookupFiscalYear(fiscalYearId)
    .then(fy => {
      fiscalYear = fy;
      return Fiscal.getPeriodByFiscal(fiscalYearId);
    })
    .then(periods => {
      // Append period zero to provide FY dates
      periods.push({
        number : 0,
        end_date :  fiscalYear.end_date,
        start_date : fiscalYear.start_date,
      });

      // Set up compatibility with other period-related code for budgets
      periods.forEach(p => {
        p.periodNum = p.number;
      });

      return periods;
    });
}

// For each child title account, compute the budget for all child accounts
function computeTitleAccountTotals(budgetAccts, allAccounts) {

  // Construct the list of periods (leave out the FY total period)
  const periods = constants.periods.filter(elt => elt.periodNum !== 0);

  function computeChildrenSubtotal(acct) {
    const childrenIDs = getChildrenAccounts(allAccounts, acct.id);
    childrenIDs.forEach(childId => {
      const bdAcct = budgetAccts.find(item => item.id === childId);
      if (bdAcct) {
        if (bdAcct.type_id === INCOME) {
          acct.isIncomeTitle = true;
        } else if (bdAcct.type_id === EXPENSE) {
          acct.isExpenseTitle = true;
        }
        if ((bdAcct.type_id === INCOME) || (bdAcct.type_id === EXPENSE)) {
          acct.budget += bdAcct.budget;
          acct.actuals += bdAcct.actuals ? bdAcct.actuals : 0;
        }
        // NB: Ignore child title accounts
      }
    });
  }

  // Now compute the total for all children
  budgetAccts.forEach(acct => {
    if (acct.type_id === TITLE && acct.id !== null) {
      acct.budget = 0;
      acct.actuals = 0;
      acct.period = _.cloneDeep(periods); // Make a copy
      computeChildrenSubtotal(acct);
    }
  });

  return budgetAccts;
}

/**
 * Compute the subtotals for expenses and incomes
 *
 * NOTE: The sortAccounts must have be called first in order to add the subtotal rows.
 *
 * @param {object} accounts - the list of accounts (processed in place)
 */
function computeSubTotals(accounts) {
  const incomeTotal = accounts.find(acct => acct.acctType === 'total-income');
  const expensesTotal = accounts.find(acct => acct.acctType === 'total-expenses');
  const summaryTotal = accounts.find(acct => acct.acctType === 'total-summary');

  // Make sure the rows for account totals have been added.
  if (!incomeTotal || !expensesTotal) {
    throw new Error('sortAccounts must be called before computeSubTotals');
  }

  let budgetTotal = 0;
  let debitTotal = 0;
  let creditTotal = 0;
  let actualsTotal = 0;

  // Construct the list of periods (leave out the FY total period)
  const periods = constants.periods.filter(elt => elt.periodNum !== 0);
  const periodSums = _.cloneDeep(periods); // Make a copy
  // Clear the totals for each period (income)
  periodSums.forEach(pt => {
    pt.budget = 0;
    pt.credit = 0;
    pt.debit = 0;
    pt.actuals = 0;
  });

  // compute income totals
  accounts.forEach(acct => {
    if (acct.type_id === INCOME) {

      // Compute the actuals
      acct.actuals = acct.credit ? acct.credit : 0;
      if (acct.debit) {
        acct.actuals -= acct.debit;
      }

      // Compute the percent deviation
      acct.deviationPct = ((acct.credit || acct.debit) && acct.budget && acct.budget !== 0)
        ? Math.round(100.0 * (acct.actuals / acct.budget)) : null;

      // Sum the totals
      budgetTotal += acct.budget ? acct.budget : 0;
      creditTotal += acct.credit ? acct.credit : 0;
      debitTotal += acct.debit ? acct.debit : 0;
      actualsTotal += acct.credit ? acct.credit : 0;
      if (acct.debit) {
        actualsTotal -= acct.debit;
      }

      periodSums.forEach(pt => {
        const acctPeriod = acct.period.find(item => item.key === pt.key);
        if (acctPeriod) {
          pt.budget += acctPeriod.budget ? acctPeriod.budget : 0;
          pt.credit += acctPeriod.credit ? acctPeriod.credit : 0;
          pt.debit += acctPeriod.debit ? acctPeriod.debit : 0;
          pt.actuals += acctPeriod.credit ? acctPeriod.credit : 0;
          if (acctPeriod.debit) {
            pt.actuals -= acctPeriod.debit;
          }
        }
      });
    }
  });

  // Save the income totals
  incomeTotal.budget = budgetTotal;
  incomeTotal.debit = debitTotal;
  incomeTotal.credit = creditTotal;
  incomeTotal.actuals = actualsTotal;
  incomeTotal.deviationPct = (budgetTotal !== 0)
    ? Math.round(100.0 * (actualsTotal / budgetTotal)) : null;

  // save the income totals for the periods
  incomeTotal.period.forEach(pit => {
    const pdata = periodSums.find(item => item.key === pit.key);
    pit.budget = pdata.budget ? pdata.budget : 0;
    pit.credit = pdata.credit ? pdata.credit : 0;
    pit.debit = pdata.debit ? pdata.debit : 0;
    pit.actuals = pdata.actuals ? pdata.actuals : 0;
  });

  // compute expense totals
  budgetTotal = 0;
  debitTotal = 0;
  creditTotal = 0;
  actualsTotal = 0;

  // Clear the totals for each period (expense)
  periodSums.forEach(pt => {
    pt.budget = 0;
    pt.credit = 0;
    pt.debit = 0;
    pt.actuals = 0;
  });

  accounts.forEach(acct => {
    if (acct.type_id === EXPENSE) {

      // Compute the actuals
      acct.actuals = acct.debit ? acct.debit : 0;
      if (acct.credit) {
        acct.actuals -= acct.credit;
      }

      // Compute the percent deviation
      acct.deviationPct = ((acct.credit || acct.debit) && acct.budget && acct.budget !== 0)
        ? Math.round(100.0 * (acct.actuals / acct.budget)) : null;

      // Sum the totals
      budgetTotal += acct.budget ? acct.budget : 0;
      creditTotal += acct.credit ? acct.credit : 0;
      debitTotal += acct.debit ? acct.debit : 0;
      actualsTotal += acct.debit ? acct.debit : 0;
      if (acct.credit) {
        actualsTotal -= acct.credit;
      }

      periodSums.forEach(pt => {
        const acctPeriod = acct.period.find(item => item.key === pt.key);
        if (acctPeriod) {
          pt.budget += acctPeriod.budget ? acctPeriod.budget : 0;
          pt.credit += acctPeriod.credit ? acctPeriod.credit : 0;
          pt.debit += acctPeriod.debit ? acctPeriod.debit : 0;
          pt.actuals += acctPeriod.debit ? acctPeriod.debit : 0;
          if (acctPeriod.credit) {
            pt.actuals -= acctPeriod.credit;
          }
        }
      });
    }
  });

  // Save the expense totals
  expensesTotal.budget = budgetTotal;
  expensesTotal.debit = debitTotal;
  expensesTotal.credit = creditTotal;
  expensesTotal.actuals = actualsTotal;
  expensesTotal.deviationPct = (budgetTotal !== 0)
    ? Math.round(100.0 * (actualsTotal / budgetTotal)) : null;

  // save the expense totals for the periods
  expensesTotal.period.forEach(pet => {
    const pdata = periodSums.find(item => item.key === pet.key);
    pet.budget = pdata.budget ? pdata.budget : null;
    pet.credit = pdata.credit ? pdata.credit : null;
    pet.debit = pdata.debit ? pdata.debit : null;
    pet.actuals = pdata.actuals ? pdata.actuals : null;
  });

  // Compute the summary data
  summaryTotal.budget = incomeTotal.budget - expensesTotal.budget;
  summaryTotal.debit = incomeTotal.debit - expensesTotal.debit;
  summaryTotal.credit = incomeTotal.credit - expensesTotal.credit;
  summaryTotal.actuals = incomeTotal.actuals - expensesTotal.actuals;
  summaryTotal.deviationPct = (summaryTotal.budget !== 0)
    ? Math.round(100.0 * (summaryTotal.actuals / summaryTotal.budget)) : null;

  // save the expense totals for the periods
  summaryTotal.period.forEach(pst => {
    const incomePeriod = incomeTotal.period.find(item => item.key === pst.key);
    const expensesPeriod = expensesTotal.period.find(item => item.key === pst.key);
    pst.budget = (incomePeriod && expensesPeriod) ? incomePeriod.budget - expensesPeriod.budget : 0;
    pst.credit = (incomePeriod && expensesPeriod) ? incomePeriod.credit - expensesPeriod.credit : 0;
    pst.debit = (incomePeriod && expensesPeriod) ? incomePeriod.debit - expensesPeriod.debit : 0;
    pst.actuals = (incomePeriod && expensesPeriod) ? incomePeriod.actuals - expensesPeriod.actuals : 0;
  });
}

function computeTitleAccountPeriodTotals(budgetAccts, allAccounts) {

  function computeChildrenPeriodTotals(acct) {
    const childrenIDs = getChildrenAccounts(allAccounts, acct.id);
    childrenIDs.forEach(childId => {
      const bdAcct = budgetAccts.find(item => item.id === childId);
      if (bdAcct) {
        if ((bdAcct.type_id === INCOME) || (bdAcct.type_id === EXPENSE)) {
          acct.actuals += bdAcct.actuals ? bdAcct.actuals : 0;
          acct.credit += bdAcct.credit ? bdAcct.credit : 0;
          acct.debit += bdAcct.debit ? bdAcct.debit : 0;
          bdAcct.period.forEach((pt, i) => {
            acct.period[i].budget += pt.budget;
            acct.period[i].actuals += pt.actuals ? pt.actuals : 0;
            acct.period[i].credit += pt.credit ? pt.credit : 0;
            acct.period[i].debit += pt.debit ? pt.debit : 0;
          });
        }
        // NB: Ignore child title accounts
      }
    });
  }

  // Now compute the period totals for all children
  budgetAccts.forEach(acct => {
    if (acct.type_id === TITLE && acct.id !== null) {
      // Prepare for summing over all child accounts
      // @TODO : Move the computation of title account budgets here too?
      acct.actuals = 0;
      acct.credit = 0;
      acct.debit = 0;
      // Zero the budget for each period
      acct.period.forEach(pt => {
        pt.budget = 0;
        pt.credit = 0;
        pt.debit = 0;
        pt.actuals = 0;
      });

      computeChildrenPeriodTotals(acct);
    }
  });

  return budgetAccts;
}

/**
 * Update the accounts with YTD calculations
 *
 * @param {Array} accounts - list of accounts to process for YTD data
 * @param {number} fiscalYearId - Id of the fiscal year
 * @returns {Promise} of the accounts with updated YTD data
 */
async function computeBudgetTotalsYTD(accounts, fiscalYearId) {
  const today = new Date();

  const periods = (await getPeriods(fiscalYearId)).filter(elt => elt.periodNum !== 0);

  let incomeTotalYTD = 0;
  let expensesTotalYTD = 0;

  accounts.forEach(acct => {

    if ((acct.type_id === INCOME) || (acct.type_id === EXPENSE)
      || (acct.type_id === TITLE && acct.isIncomeTitle)
      || (acct.type_id === TITLE && acct.isExpenseTitle)) {
      let budgetYTD = 0;

      acct.period.forEach(p => {
        const pdata = periods.find(item => item.number === p.periodNum);

        if (pdata) {
          const pStart = new Date(pdata.start_date);
          const pEnd = new Date(pdata.end_date);

          if (pEnd < today) {
            // this period is entirely in the past, count the full period budget
            budgetYTD += p.budget ? p.budget : 0;
          } else if (pStart > today) {
            // NOP - This is period is entirely in the future, do not count it
          } else {
            // today must be inside the period, compute the budget portion
            const monthDays = Math.round((pEnd.getTime() - pStart.getTime()) / (1000 * 60 * 60 * 24));
            const numDays = Math.round((today.getTime() - pStart.getTime()) / (1000 * 60 * 60 * 24));
            budgetYTD += p.budget ? (p.budget * (numDays / monthDays)) : 0;
          }
        }
        acct.budgetYTD = budgetYTD;
        acct.differenceYTD = acct.actuals && acct.actuals !== 0 ? acct.actuals - budgetYTD : null;

        // Compute the deviation percent YTD
        acct.deviationYTDPct = (budgetYTD !== 0)
          ? Math.round(100.0 * (acct.actuals / budgetYTD)) : null;
      });

      if (acct.type_id === INCOME) {
        incomeTotalYTD += budgetYTD;
      } else if (acct.type_id === EXPENSE) {
        expensesTotalYTD += budgetYTD;
      }
    }
  });

  // Add the YTD totals to the income summary row
  const incomeTotalRow = accounts.find(acct => acct.acctType === 'total-income');
  if (incomeTotalRow) {
    incomeTotalRow.budgetYTD = incomeTotalYTD;
    incomeTotalRow.differenceYTD = incomeTotalRow.actuals - incomeTotalRow.budgetYTD;
    incomeTotalRow.deviationYTDPct = incomeTotalYTD !== 0
      ? Math.round(100.0 * (incomeTotalRow.actuals / incomeTotalRow.budgetYTD)) : null;
  }

  // Add the YTD totals to the expenses summary row
  const expensesTotalRow = accounts.find(acct => acct.acctType === 'total-expenses');
  if (expensesTotalRow) {
    expensesTotalRow.budgetYTD = expensesTotalYTD;
    expensesTotalRow.differenceYTD = expensesTotalRow.actuals - expensesTotalRow.budgetYTD;
    expensesTotalRow.deviationYTDPct = expensesTotalYTD !== 0
      ? Math.round(100.0 * (expensesTotalRow.actuals / expensesTotalRow.budgetYTD)) : null;
  }

  const summaryTotalRow = accounts.find(acct => acct.acctType === 'total-summary');
  if (summaryTotalRow) {
    summaryTotalRow.budgetYTD = incomeTotalYTD - expensesTotalYTD;
    summaryTotalRow.differenceYTD = summaryTotalRow.actuals - summaryTotalRow.budgetYTD;
    summaryTotalRow.deviationYTDPct = expensesTotalYTD !== 0
      ? Math.round(100.0 * (summaryTotalRow.actuals / summaryTotalRow.budgetYTD)) : null;
  }

  return accounts;
}

/**
 * Exclude any top-level title accounts that have both expenses and income sub-accounts
 *
 * In the OHADA system, '8' title accounts can have both income and expenses.
 * But if a top-level '8' title account appears in two places in the budget display
 * with different totals, it would be confusing.  So do not display those
 * top-level title accounts.
 *
 * @param {Array} accounts - list of accounts
 * @returns {Promise} of the accounts with updated YTD data
 */
function excludeTopLevelIEAccounts(accounts) {

  function hasIncomeAndExpenses(acctId) {
    let hasIncome = false;
    let hasExpenses = false;
    const childrenIds = getChildrenAccounts(accounts, acctId);
    childrenIds.forEach(id => {
      const child = accounts.find(item => item.id === id);
      if (child.type_id === INCOME) {
        hasIncome = true;
      } else if (child.type_id === EXPENSE) {
        hasExpenses = true;
      }
    });
    return hasIncome && hasExpenses;
  }

  // Collect the IDs of any dual-nature title accounts
  const excludeIDs = [];
  accounts.forEach(acct => {
    if ((acct.id !== null) && (acct.parent === 0)) {
      if (hasIncomeAndExpenses(acct.id)) {
        excludeIDs.push(acct.id);
      }
    }
  });

  // Filter out the dual-nature title accounts
  return accounts.filter(item => !excludeIDs.includes(item.id));
}

/**
 * Send the client the template file for budget import
 *
 * GET /budget/download_template_file
 *
 * @param {object} req - the request object
 * @param {object} res - the response object
 * @param {object} next - next middleware object to pass control to
 */
function downloadTemplate(req, res, next) {
  try {
    const file = path.join(__dirname, '../../../resources/templates/import-budget-template.csv');
    res.download(file);
  } catch (error) {
    next(error);
  }
}

/**
 * Return the translation token for this account
 *
 * @param {number} typeId - the account type id (number)
 * @returns {string} the translation token for the specified account type
 */
function typeToken(typeId) {
  const typeName = Object.keys(constants.accounts).find(key => constants.accounts[key] === typeId);
  const token = typeName ? `ACCOUNT.TYPES.${typeName}` : '';
  return token;
}

/**
 * Delete all budget entries for a specific fiscal year
 *
 * DELETE /budget/:fiscal_year
 *
 * @param {object} req - the request object
 * @param {object} res - the response object
 * @param {object} next - next middleware object to pass control to
 */
function deleteBudget(req, res, next) {
  try {
    if (!req.params.fiscal_year) {
      throw new BadRequest(`ERROR: Missing 'fiscal_year' ID parameter in DELETE /budget/:fiscal_year`);
    }
    const fiscalYearId = Number(req.params.fiscal_year);
    db.exec('CALL DeleteBudget(?)', [fiscalYearId])
      .then(() => {
        res.sendStatus(200);
      });
  } catch (error) {
    next(error);
  }
}

/**
 * Import budget data for a fiscal year
 *
 * POST /budget/import/:fiscal_year
 *
 * @param {object} req - the request object
 * @param {object} res - the response object
 * @param {object} next - next middleware object to pass control to
 */
async function importBudget(req, res, next) {
  try {
    if (!req.params.fiscal_year) {
      throw new BadRequest(`ERROR: Missing 'fiscal_year' ID parameter in POST /budget/import`);
    }
    const fiscalYearId = Number(req.params.fiscal_year);
    const { lang } = req.query;

    if (!req.files || req.files.length === 0) {
      throw new BadRequest('Expected at least one file upload but did not receive any files.',
        'ERRORS.MISSING_UPLOAD_FILES');
    }
    const filePath = req.files[0].path;

    const data = await util.formatCsvToJson(filePath);

    if (!hasValidHeaders(data)) {
      throw new BadRequest('The given budget file has a bad column headers',
        'BUDGET.IMPORT_BUDGET_BAD_HEADERS');
    }

    // Make sure the data in the file is valid
    const validData = await hasValidData(data);
    if (validData !== true) {
      const [errCode, lineNum] = validData;
      throw new BadRequest(`The given budget file has missing or invalid data on line ${lineNum + 1}`,
        errCode);
    }

    // Get the basic account data to check imports
    const accountsSql = 'SELECT a.locked, a.number, a.label FROM account AS a;';
    const accounts = await db.exec(accountsSql);
    data.forEach(importAccount => {
      const acct = accounts.find(item => item.number === Number(importAccount.AcctNum));
      if (acct && acct.locked) {
        const errMsg = `${i18n(lang)('BUDGET.IMPORT_BUDGET_ERROR_LOCKED_ACCOUNT')} ${acct.number} - ${acct.label}`;
        throw new BadRequest('The given budget file includes the locked account.', errMsg);
      }
    });

    // Clear any previously uploaded budget data
    db.exec('CALL DeleteBudget(?)', [fiscalYearId])
      .then(() => {
        // Get the period ID for the totals for the fiscal year
        return db.one('SELECT id FROM period WHERE period.number = 0 AND period.fiscal_year_id = ?', [fiscalYearId]);
      })
      .then((fyPeriod) => {
        const periodId = fyPeriod.id;
        // Then create new budget entries for the totals for the fiscal year
        const sql = 'CALL InsertBudgetItem(?, ?, ?, ?)';
        const transaction = db.transaction();
        data.forEach(line => {
          // Do not insert budgets for title accounts or accounts with zero budget
          if (line.Type !== 'title' && Number(line.Budget) > 0) {
            transaction.addQuery(sql, [line.AcctNum, periodId, line.Budget, 1]);
            // NOTE: Always lock budget lines for the entire year (period.number == 0)
          }
        });
        return transaction.execute();
      })
      .then(() => {
        res.sendStatus(200);
      });
  } catch (e) {
    next(e);
  }

}

/**
 * Insert a new budget item
 *
 * POST /budget  (with query)
 *
 * Query must include: acctNumber, periodId, budget, locked
 *
 * NOTE: This will fail if the item already exists
 *
 * @param {object} req - the request object
 * @param {object} res - the response object
 * @param {object} next - next middleware object to pass control to
 * @returns {object} HTTP/JSON response object
 */
function insertBudgetItem(req, res, next) {
  const q = req.query;
  const sql = 'CALL InsertBudgetItem(?, ?, ?, ?)';
  return db.exec(sql, [q.acctNumber, q.periodId, q.budget, q.locked])
    .then(() => {
      res.sendStatus(200);
    })
    .catch(next)
    
}

/**
 * Update a budget item or create it if it does not exist
 *
 * PUT /budget/update/:id  (put data to change in query)
 *
 * Query should include: budget and/or locked
 *
 * @param {object} req - the request object
 * @param {object} res - the response object
 * @param {object} next - next middleware object to pass control to
 * @returns {object} HTTP/JSON response object
 */
function updateBudgetItem(req, res, next) {
  const budgetId = req.params.id;
  const q = req.query;
  const params = [];

  // Construct the SQL statement
  let sql = 'UPDATE `budget` SET ';
  if (q.budget) {
    sql += `\`budget\` = ${q.budget}`;
    params.push(q.budget);
  }
  if (q.budget && q.locked) {
    sql += ', ';
  }
  if (q.locked) {
    sql += `\`locked\` = ${q.locked}`;
    params.push(q.locked);
  }
  sql += ' WHERE `budget`.`id` = ?';

  return db.exec(sql, [budgetId])
    .then(() => {
      res.sendStatus(200);
    })
    .catch(next)
    
}

/**
 * Update periods with new budget and locked values
 *
 * /PUT /budget/updatePeriodBudgets
 *
 * Provide a list of (periodId, newBudget, and newLocked) values
 * as { params : [{change},...] } as the second argument of the put.
 *
 * @param {object} req - the request object
 * @param {object} res - the response object
 * @param {object} next - next middleware object to pass control to
 * @returns {object} HTTP/JSON response object
 */
function updateBudgetPeriods(req, res, next) {
  const { params } = req.body;

  // Update the budget records
  const transaction = db.transaction();
  params.forEach(p => {
    transaction.addQuery('UPDATE budget SET budget = ?, locked = ? WHERE id = ?',
      [p.newBudget, p.newLocked, p.budgetId]);
  });
  return transaction.execute()
    .then(() => {
      res.sendStatus(200);
    })
    .catch(next)
    
}

/**
 * Populate the budget periods for the fiscal year
 *
 * PUT /budget/populate/:fiscal_year
 *
 * ASSUMES budget has already been added for the fiscal year (period.number=0)
 *
 * WARNING: Does not insert budget amounts and sets locked=0 for each new period
 *
 * @param {object} req - the request object
 * @param {object} res - the response object
 * @param {object} next - next middleware object to pass control to
 * @returns {object} HTTP/JSON response object
 */
function populateBudgetPeriods(req, res, next) {
  const fiscalYearId = Number(req.params.fiscal_year);
  let periods;
  let budgetData;

  // Get the periods for this fiscal year
  return db.exec(periodsSql, [fiscalYearId])
    .then(pres => {
      periods = pres;

      // Now get the budget data for the year
      return db.exec(budgetSql, [fiscalYearId]);
    })
    .then(bres => {
      budgetData = bres;
      const transaction = db.transaction();
      budgetData.forEach(b => {
        periods.forEach(p => {
          if (p.number > 0 && p.number < 13) {
            transaction.addQuery('CALL InsertBudgetItem(?, ?, ?, ?)',
              [b.acctNum, p.id, 0, 0]);
          }
        });
      });
      return transaction.execute();
    })
    .then(() => {
      res.sendStatus(200);
    })
    .catch(next)
    
}

/**
 * Fill/update the budget data for the fiscal year
 *
 * PUT /budget/fill/:fiscal_year
 *
 * ASSUMES All budget periods have been created for all accounts for the fiscal year
 *
 * @param {object} req - the request object
 * @param {object} res - the response object
 * @param {object} next - next middleware object to pass control to
 * @returns {object} HTTP/JSON response object
 */
async function fillBudget(req, res, next) {
  const fiscalYearId = Number(req.params.fiscal_year);

  let budgetData;

  // Now get the budget data for the year (just for period.number = 0)
  const sql = budgetSql.replace('ORDER BY', 'AND p.number = 0 ORDER BY');
  return db.exec(sql, [fiscalYearId])
    .then(bRes => {
      budgetData = bRes;

      // Rebalance the budget for each account
      const promises = [];
      budgetData.forEach(b => {
        const acct = b.id;
        const totalBudget = b.budget;
        promises.push(rebalanceBudget(fiscalYearId, acct, totalBudget, false));
      });
      return Promise.all(promises);
    })
    .then(() => {
      res.sendStatus(200);
    })
    .catch(next)
    
}

/* -------------------------------------------------------------------------------- */

/**
 * Rebalance the budget values for the account for the FY.
 * (Compute total for locked periods and redristribute the rest to the unlocked periods)
 *
 * @param {number} fiscalYearId - the ID for the fiscal year
 * @param {number} accountId - the ID for the account to update
 * @param {number} budget - total budget for this account for the fiscal year
 * @returns {Promise} of result status
 */
async function rebalanceBudget(fiscalYearId, accountId, budget) {
  // Get the total budget for unlocked budget periods for this account
  const sql = `
    SELECT SUM(b.budget) AS lockedTotal, COUNT(b.locked) AS numUnlocked
    FROM budget AS b
    JOIN period AS p ON p.id = b.period_id
    WHERE p.fiscal_year_id = ? AND p.number > 0 AND b.account_id = ? AND b.locked = 0
  `;
  const { lockedTotal, numUnlocked } = await db.one(sql, [fiscalYearId, accountId]);
  const monthly = (budget - lockedTotal) / numUnlocked;

  // Set all the unlocked budget values for this account for the fiscal year
  const setSql = `
    UPDATE budget AS b
    JOIN period AS p ON p.id = b.period_id
    SET b.budget = ?
    WHERE p.fiscal_year_id = ? AND p.number > 0 AND b.account_id = ? AND b.locked = 0
  `;
  return db.exec(setSql, [monthly, fiscalYearId, accountId]);
}

/**
 * Check if data has a valid format for inventories
 *
 * @param {Array} data - array of objects to check for valid properties
 * @returns {boolean} - true if data is valid
 */
function hasValidHeaders(data) {
  const [headers] = data;
  return 'AcctNum' in headers
    && 'Label' in headers
    && 'Type' in headers
    && 'Budget' in headers;
}

/**
 * Check if import data has a valid format
 *
 * @param {Array} data - array of objects to check for valid properties
 * @returns {boolean} - true if data is valid
 */
async function hasValidData(data) {

  // eslint-disable-next-line no-restricted-syntax
  for (let i = 0; i < data.length; i++) {
    const line = data[i];

    // Make sure the account number is a valid integer number
    try {
      const acctNum = Number(line.AcctNum);
      if (!_.isInteger(acctNum)) {
        return ['BUDGET.IMPORT_BUDGET_ERROR_ACCT_NUM', i];
      }
    } catch {
      return ['BUDGET.IMPORT_BUDGET_ERROR_ACCT_NUM', i];
    }

    // Make sure budget data is valid floating point number
    // NOTE: We ignore budget values on title accounts
    if (line.Type !== 'title') {
      const budget = Number(line.Budget);
      if (Number.isNaN(budget)) {
        return ['BUDGET.IMPORT_BUDGET_ERROR_BAD_BUDGET_VALUE', i];
      }
      if (budget < 0) {
        return ['BUDGET.IMPORT_BUDGET_ERROR_NEGATIVE_BUDGET_VALUE', i];
      }
    }

    // Make sure the account type is valid
    if (!legalAccountTypes.includes(line.Type)) {
      return ['BUDGET.IMPORT_BUDGET_ERROR_ACCT_TYPE', i];
    }

    // Make sure the account type matches the actual account info
    const acctSql = 'SELECT at.type FROM account AS a JOIN account_type AS at ON at.id = a.type_id WHERE a.number = ?';
    if (i > 0) {
      // skip the headers line
      const account = await db.one(acctSql, [line.AcctNum]); // eslint-disable-line no-await-in-loop
      if (line.Type !== account.type) {
        return ['BUDGET.IMPORT_BUDGET_ERROR_ACCT_TYPE_INCORRECT', i];
      }
    }

  }

  return true;
}
