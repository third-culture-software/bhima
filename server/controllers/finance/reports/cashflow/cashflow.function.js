/**
 * Cashflow Funcion
 */
const _ = require('lodash');

const db = require('../../../../lib/db');
const AccountsExtra = require('../../accounts/extra');

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
 * @param {array} cashboxesIds
 * @param {array} periods
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
 * @param {array} cashboxesIds
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

function aggregateTotal(data, source = {}) {
  const totals = {};
  const dataset = _.values(source);
  data.periods.forEach(periodId => {
    totals[periodId] = _.sumBy(dataset, periodId);
  });
  return totals;
}

function sumAggregateTotal(data, source = {}) {
  let sum = 0;
  const dataset = _.values(source);
  data.periods.forEach(periodId => {
    sum += _.sumBy(dataset, periodId);
  });
  return sum;
}

function totalPeriods(data, incomeTotal, expenseTotal, transferTotal) {
  const total = {};
  data.periods.forEach(periodId => {
    total[periodId] = incomeTotal[periodId] + expenseTotal[periodId] + transferTotal[periodId];
  });
  return total;
}

function sumIncomesPeriods(data, incomeTotal, transferTotal) {
  let sum = 0;
  data.periods.forEach(periodId => {
    sum += incomeTotal[periodId] + transferTotal[periodId];
  });
  return sum;
}

function totalBalances(data, incomeTotal, expenseTotal) {
  const total = {};
  data.periods.forEach(periodId => {
    total[periodId] = incomeTotal[periodId] + expenseTotal[periodId];
  });
  return total;
}

function sumTotalBalances(data, incomeTotal, expenseTotal) {
  let sum = 0;
  data.periods.forEach(periodId => {
    sum += incomeTotal[periodId] + expenseTotal[periodId];
  });
  return sum;
}

function totalIncomes(data, incomeTotal, otherTotal, opening) {
  const total = {};
  data.periods.forEach(periodId => {
    total[periodId] = incomeTotal[periodId] + otherTotal[periodId] + opening[periodId];
  });
  return total;
}

function totalIncomesPeriods(data, incomeTotal, transferTotal) {
  const total = {};
  data.periods.forEach(periodId => {
    total[periodId] = incomeTotal[periodId] + transferTotal[periodId];
  });
  return total;
}

function sumTotalIncomes(data, incomeTotal, otherTotal, opening) {
  let sum = 0;
  data.periods.forEach(periodId => {
    sum += incomeTotal[periodId] + otherTotal[periodId] + opening[periodId];
  });
  return sum;
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
