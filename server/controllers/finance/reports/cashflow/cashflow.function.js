/**
 * Cashflow Funcion
 */
const _ = require('lodash');

const db = require('../../../../lib/db');
const AccountsExtra = require('../../accounts/extra');

/**
 *
 * @param accountIds
 * @param openingBalanceData
 * @param periods
 */
function totalOpening(accountIds, openingBalanceData, periods) {
  let sumOpening = 0;
  const tabFormated = {};
  const tabAccountsFormated = [];
  const tabData = [];

  accountIds.forEach(account => {
    let sumOpeningByAccount = 0;
    const accountId = account.account_id;

    const accountsFormated = {
      account_label : account.account_label,
    };

    const getData = openingBalanceData.filter(item => {
      return item.accountId === accountId;
    });

    getData.forEach((gt, idd) => {
      periods.forEach((period, index) => {
        if (idd === index) {
          accountsFormated[period] = gt.balance;
          sumOpeningByAccount += parseFloat(gt.balance, 10);
        }
      });
    });

    accountsFormated.sumOpeningByAccount = sumOpeningByAccount;

    tabAccountsFormated.push(accountsFormated);
    tabData.push({ id : accountId, opening : getData });
  });

  periods.forEach((period, index) => {
    let sum = 0;
    tabData.forEach(tab => {
      tab.opening.forEach((tb, idx) => {
        if (index === idx) {
          sum += parseInt(tb.balance, 10);
        }
      });
    });
    sumOpening += sum;
    tabFormated[period] = sum;
  });

  return { tabFormated, tabAccountsFormated, sumOpening };
}

/**
 * getOpeningBalanceData
 *
 * this function returns details of cashboxe ids given
 * @param {Array} cashboxesIds
 * @param {Array} periods
 */

/**
 *
 * @param cashAccountIds
 * @param periods
 */
function getOpeningBalanceData(cashAccountIds, periods) {
  const getOpening = [];

  cashAccountIds.forEach(account => {
    periods.forEach(period => {
      getOpening.push(AccountsExtra.getOpeningBalanceForDate(account, period.start_date, false));
    });
  });

  return Promise.all(getOpening);
}

/**
 * getCashboxesDetails
 *
 * this function returns details of cashboxe ids given
 * @param {Array} cashboxesIds
 */
function getCashboxesDetails(cashboxesIds) {
  const query = `
    SELECT
      cac.currency_id, cac.account_id, c.id, c.label, cur.symbol,
      a.number AS account_number, a.label AS account_label
    FROM cash_box c
    JOIN cash_box_account_currency cac ON cac.cash_box_id = c.id
    JOIN currency cur ON cur.id = cac.currency_id
    JOIN account a ON a.id = cac.account_id
    WHERE c.id IN ? ORDER BY c.id;
  `;
  return db.exec(query, [[cashboxesIds]]);
}

/**
 *
 * @param data
 */
function aggregateData(data) {
  return Object.values(data).reduce((agg, category) => {
    Object.entries(category).forEach(([key, value]) => {
      agg[key] = (agg[key] || 0) + value;
    });
    return agg;
  }, {});
}

/**
 * aggregateTotalByKeys
 *
 * this function process totals for incomes or expense by transaction type
 * @param {*} source
 * @param {*} sourceTotalByTextKeys
 */

/**
 *
 * @param data
 * @param source
 */
function aggregateTotalByTextKeys(data, source = {}) {
  const sourceTotalByTextKeys = {};

  Object.keys(source).forEach((index) => {
    const currentTransactionText = source[index] || [];
    sourceTotalByTextKeys[index] = {
      sumAggregate : 0,
    };

    // loop for each period
    data.periods.forEach(periodId => {
      // Use _.sumBy safely, fallback to 0 if result is NaN or undefined
      const sum = _.sumBy(currentTransactionText, periodId);
      const safeSum = Number.isFinite(sum) ? sum : 0;

      sourceTotalByTextKeys[index][periodId] = safeSum;
      sourceTotalByTextKeys[index].sumAggregate += safeSum;
    });
  });

  return sourceTotalByTextKeys;
}

/**
 *
 * @param data
 * @param source
 */
function aggregateTotal(data, source = {}) {
  const totals = {};
  const dataset = Object.values(source);
  data.periods.forEach(periodId => {
    totals[periodId] = _.sumBy(dataset, periodId);
  });
  return totals;
}

/**
 *
 * @param data
 * @param source
 */
function sumAggregateTotal(data, source = {}) {
  let sum = 0;
  const dataset = Object.values(source);
  data.periods.forEach(periodId => {
    sum += _.sumBy(dataset, periodId);
  });
  return sum;
}

/**
 *
 * @param data
 * @param incomeTotal
 * @param expenseTotal
 * @param transferTotal
 */
function totalPeriods(data, incomeTotal, expenseTotal, transferTotal) {
  const total = {};
  data.periods.forEach(periodId => {
    total[periodId] = incomeTotal[periodId] + expenseTotal[periodId] + transferTotal[periodId];
  });
  return total;
}

/**
 *
 * @param data
 * @param incomeTotal
 * @param transferTotal
 */
function sumIncomesPeriods(data, incomeTotal, transferTotal) {
  let sum = 0;
  data.periods.forEach(periodId => {
    sum += incomeTotal[periodId] + transferTotal[periodId];
  });
  return sum;
}

/**
 *
 * @param data
 * @param incomeTotal
 * @param expenseTotal
 */
function totalBalances(data, incomeTotal, expenseTotal) {
  const total = {};
  data.periods.forEach(periodId => {
    total[periodId] = incomeTotal[periodId] + expenseTotal[periodId];
  });
  return total;
}

/**
 *
 * @param data
 * @param incomeTotal
 * @param expenseTotal
 */
function sumTotalBalances(data, incomeTotal, expenseTotal) {
  let sum = 0;
  data.periods.forEach(periodId => {
    sum += incomeTotal[periodId] + expenseTotal[periodId];
  });
  return sum;
}

/**
 *
 * @param data
 * @param incomeTotal
 * @param otherTotal
 * @param opening
 */
function totalIncomes(data, incomeTotal, otherTotal, opening) {
  const total = {};
  data.periods.forEach(periodId => {
    total[periodId] = incomeTotal[periodId] + otherTotal[periodId] + opening[periodId];
  });
  return total;
}

/**
 *
 * @param data
 * @param incomeTotal
 * @param transferTotal
 */
function totalIncomesPeriods(data, incomeTotal, transferTotal) {
  const total = {};
  data.periods.forEach(periodId => {
    total[periodId] = incomeTotal[periodId] + transferTotal[periodId];
  });
  return total;
}

/**
 *
 * @param data
 * @param incomeTotal
 * @param otherTotal
 * @param opening
 */
function sumTotalIncomes(data, incomeTotal, otherTotal, opening) {
  let sum = 0;
  data.periods.forEach(periodId => {
    sum += incomeTotal[periodId] + otherTotal[periodId] + opening[periodId];
  });
  return sum;
}

/**
 * @description
 * Groups a series of transactions by their transaction type label.
 * @param arr
 * @param tt
 */
function groupByTransactionType(arr, tt) {
  return Object.groupBy(arr.filter(r => r.transaction_type === tt), r => r.transaction_text);
}

exports.totalOpening = totalOpening;
exports.getOpeningBalanceData = getOpeningBalanceData;
exports.getCashboxesDetails = getCashboxesDetails;
exports.aggregateData = aggregateData;
exports.aggregateTotalByTextKeys = aggregateTotalByTextKeys;
exports.aggregateTotal = aggregateTotal;
exports.sumAggregateTotal = sumAggregateTotal;
exports.totalPeriods = totalPeriods;
exports.sumIncomesPeriods = sumIncomesPeriods;
exports.totalBalances = totalBalances;
exports.sumTotalBalances = sumTotalBalances;
exports.totalIncomes = totalIncomes;
exports.totalIncomesPeriods = totalIncomesPeriods;
exports.sumTotalIncomes = sumTotalIncomes;
exports.groupByTransactionType = groupByTransactionType;
