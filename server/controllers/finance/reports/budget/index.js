const _ = require('lodash');
const moment = require('moment');

const Budget = require('../../budget');
const Fiscal = require('../../fiscal');
const constants = require('../../../../config/constants');

const ReportManager = require('../../../../lib/ReportManager');
const { formatFilters } = require('../shared');

const { TITLE, EXPENSE, INCOME } = constants.accounts;

const BUDGET_REPORT_TEMPLATE = './server/controllers/finance/reports/budget/budget.handlebars';

function typeName(id) {
  let name = null;
  switch (id) {
  case TITLE:
    name = 'title';
    break;
  case EXPENSE:
    name = 'expense';
    break;
  case INCOME:
    name = 'income';
    break;
  default:
  }
  return name;
}

async function getReport(req, res) {
  const params = req.query;
  const { renderer } = params;
  const fiscalYearId = params.fiscal_year_id;

  const optionReport = _.extend(params, {
    csvKey : 'rows',
    renameKeys : false,
    orientation : 'landscape',
  });

  let data;

  const fiscalYear = await Fiscal.lookupFiscalYear(fiscalYearId);

  const report = new ReportManager(BUDGET_REPORT_TEMPLATE, req.session, optionReport);

  const rows = await Budget.buildBudgetData(fiscalYearId);

  if (renderer === 'pdf') {
    rows.forEach(row => {
      row.isTitle = row.type_id === TITLE;
      row.isIncome = row.type_id === INCOME;
      row.isExpense = row.type_id === EXPENSE;
    });

    // Split the income and expense related rows
    const incomeRows = [];
    const expenseRows = [];
    let income = true;
    rows.forEach(row => {
      if (row.acctType === 'total-income') {
        income = false;
      }
      if ((row.label === '')
          || (row.acctType === 'total-income')
          || (row.acctType === 'total-expenses')
          || (row.acctType === 'total-summary')) {
        // skip blank row and summary rows
      } else if (income) {
        incomeRows.push(row);
      } else {
        expenseRows.push(row);
      }
    });

    const incomeSummaryRow = rows.find(elt => elt.acctType === 'total-income');
    const expensesSummaryRow = rows.find(elt => elt.acctType === 'total-expenses');
    const totalSummaryRow = rows.find(acct => acct.acctType === 'total-summary');

    data = {
      incomeRows,
      expenseRows,
      incomeSummaryRow,
      expensesSummaryRow,
      totalSummaryRow,
      fiscalYear,
      title : 'BUDGET.EXPORT.REPORT_TITLE',
      dateTo : moment().format('YYYY-MM-DD'),
      filters : formatFilters(params),
      currencyId : Number(req.session.enterprise.currency_id),
    };

  } else {
    // For CSV and Excel, construct a simplied array of data with correct column header names
    const csvData = [];
    rows.forEach(row => {
      if ((row.label === '')
          || (row.acctType === 'total-income')
          || (row.acctType === 'total-expenses')
          || (row.acctType === 'total-summary')) {
        // skip blank row and summary rows
      } else {
        csvData.push({
          AcctNum : row.number,
          Label : row.label,
          Type : typeName(row.type_id),
          Budget : row.budget || 0,
          Actuals : row.actuals || 0,
        });
      }

    });

    data = {
      rows : csvData,
    };
  }

  const result = await report.render(data);
  res.set(result.headers).send(result.report);
}

exports.getReport = getReport;
