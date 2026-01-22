const _ = require('lodash');
const Tree = require('@ima-worldhealth/tree');

const Exchange = require('../../exchange');
const db = require('../../../../lib/db');
const util = require('../../../../lib/util');
const ReportManager = require('../../../../lib/ReportManager');
const fiscal = require('../../fiscal');

const TEMPLATE = './server/controllers/finance/reports/operating/report.handlebars';

exports.document = document;
exports.formatData = formatData;
exports.reporting = reporting;

const EXPENSE_ACCOUNT_TYPE = 5;
const INCOME_ACCOUNT_TYPE = 4;
const DECIMAL_PRECISION = 2; // ex: 12.4567 => 12.46

/**
 * @function reporting
 *
 * @description
 * Renders the Compte d'Exploitation
 *
 * @param {*} options the report options
 * @param {*} session the session
 */
async function reporting(params, session) {
  const options = _.extend(params, {
    filename : 'TREE.OPERATING_ACCOUNT',
    csvKey : 'rows',
    user : session.user,
  });

  const report = new ReportManager(TEMPLATE, session, options);
  const enterpriseId = session.enterprise.id;
  const enterpriseCurrencyId = session.enterprise.currency_id;
  const getQueryIncome = fiscal.getAccountBalancesByTypeId;

  const periods = {
    periodFrom : params.periodFrom,
    periodTo : params.periodTo,
  };

  const range = await fiscal.getDateRangeFromPeriods(periods);
  const exchangeRate = await Exchange.getExchangeRate(enterpriseId, params.currency_id, range.dateTo);

  let lastRateUsed;
  let firstCurrency;
  let secondCurrency;

  firstCurrency = enterpriseCurrencyId;
  secondCurrency = params.currency_id;
  lastRateUsed = exchangeRate.rate;

  if (lastRateUsed && lastRateUsed < 1) {
    lastRateUsed = (1 / lastRateUsed);
    firstCurrency = params.currency_id;
    secondCurrency = enterpriseCurrencyId;
  }

  const rate = exchangeRate.rate || 1;

  const totalIncomeQuery = `SELECT SUM(r.amount) as total FROM (${getQueryIncome(rate)}) as r`;
  const totalExpenseQuery = `SELECT SUM(r.amount) as total FROM (${fiscal.getAccountBalancesByTypeId(rate)}) as r`;

  const expenseParams = [
    params.fiscal,
    range.dateFrom,
    range.dateTo,
    EXPENSE_ACCOUNT_TYPE,
  ];

  const incomeParams = [
    params.fiscal,
    range.dateFrom,
    range.dateTo,
    INCOME_ACCOUNT_TYPE,
  ];

  const queries = [
    db.exec(fiscal.getAccountBalancesByTypeId(rate), expenseParams),
    db.exec(getQueryIncome(rate), incomeParams),
    db.one(totalExpenseQuery, expenseParams),
    db.one(totalIncomeQuery, incomeParams),
  ];

  const [expense, revenue, totalExpense, totalIncome] = await Promise.all(queries);

  // Income accounts usually have a negative balance,
  // which is why to display these values you will need to multiply it by (-1)
  revenue.forEach(item => {
    item.amount *= (-1);
  });

  // The Total Income is also multiplied by -1 for not having to display a negative value
  totalIncome.total *= (-1);

  const context = {
    expense : prepareTree(expense, 'type_id', EXPENSE_ACCOUNT_TYPE, 'amount'),
    revenue : prepareTree(revenue, 'type_id', INCOME_ACCOUNT_TYPE, 'amount'),
    totalExpense : totalExpense.total,
    totalIncome : totalIncome.total,
    dateFrom : range.dateFrom,
    dateTo : range.dateTo,
    currencyId : params.currency_id,
    firstCurrency,
    secondCurrency,
    rate : lastRateUsed,
  };

  formatData(context.expense, context.totalExpense, DECIMAL_PRECISION);
  formatData(context.revenue, context.totalIncome, DECIMAL_PRECISION);
  const diff = util.roundDecimal((context.totalIncome - context.totalExpense), DECIMAL_PRECISION);
  context.totalIncome = util.roundDecimal(context.totalIncome, DECIMAL_PRECISION);
  context.totalExpense = util.roundDecimal(context.totalExpense, DECIMAL_PRECISION);
  context.total = diff;

  return report.render(context);
}

// create the tree structure, filter by property and sum nodes' summableProp
function prepareTree(data, prop, value, summableProp) {
  const tree = new Tree(data);
  try {
    tree.filterByLeaf(prop, value);
    tree.walk(Tree.common.sumOnProperty(summableProp), false);
    tree.walk(Tree.common.computeNodeDepth);
    return tree.toArray();
  } catch (error) {
    return [];
  }
}

// set the percentage of each amoun's row,
// round amounts
function formatData(result, total, decimalPrecision) {
  const _total = (total === 0) ? 1 : total;
  return result.forEach(row => {
    row.isParent = row.children.length > 0;

    if (row.isParent) {
      row.percent = util.roundDecimal(Math.abs((row.amount / _total) * 100), decimalPrecision);
    }

    row.amount = util.roundDecimal(row.amount, decimalPrecision);
  });
}

async function document(req, res) {
  const result = await reporting(req.query, req.session);
  res.set(result.headers).send(result.report);
}
