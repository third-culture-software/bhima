const _ = require('lodash');

const ReportManager = require('../../../../lib/ReportManager');
const db = require('../../../../lib/db');
const Budget = require('../../budget');
const Fiscal = require('../../fiscal');

const BUDGET_REPORT_TEMPLATE = './server/controllers/finance/reports/budget_analytical/report.handlebars';

// expose to the API
exports.report = report;

/**
 * @function report
 *
 * @description
 * Renders the analytical budget report.
 */
async function report(req, res, next) {
  const params = req.query;
  const fiscalYearId = parseInt(params.fiscal_id, 10);
  const setNumberYear = parseInt(params.set_number_year, 10) + 1;
  const colspanValue = parseInt(params.set_number_year, 10) + 6;
  const hideUnused = parseInt(params.hide_unused, 10);
  const { enterprise } = req.session;

  let totalBudgetIncome = 0;
  let totalRealisationIncome = 0;
  let totalVariationIncome = 0;

  let totalBudgetExpense = 0;
  let totalRealisationExpense = 0;
  let totalVariationExpense = 0;

  const optionReport = _.extend(params, {
    csvKey : 'rows',
    renameKeys : false,
    orientation : 'landscape',
  });

  try {
    const transaction = [];
    const reportColumn = [];
    const reportFootColumIncome = [];
    const reportFootColumExpense = [];

    const fiscalYear = await Fiscal.lookupFiscalYear(fiscalYearId);

    const sqlGetPreviousFiscalYear = `
      SELECT fy.id, fy.label, YEAR(fy.end_date) AS year
        FROM fiscal_year AS fy
        WHERE fy.id <= ? ORDER BY fy.id DESC
        LIMIT ?
    `;

    const fiscalsYear = await db.exec(sqlGetPreviousFiscalYear, [fiscalYearId, setNumberYear]);
    const reporting = new ReportManager(BUDGET_REPORT_TEMPLATE, req.session, optionReport);

    fiscalsYear.forEach((fisc, index) => {
      transaction.push(Budget.buildBudgetData(fisc.id));

      if (index > 0) {
        // Getting the fiscal years for the report header columns
        reportColumn.push({ number : fisc.year });
      }
    });

    const fiscalYearNumber = fiscalsYear[0].year || '';
    const lastFiscalYearNumber = fiscalsYear[1].year || '';

    const dataFiscalsYear = await Promise.all(transaction);
    let tabFiscalReport = [];
    const uniqueSet = new Set();

    dataFiscalsYear.flat().forEach(item => {
      const key = `${item.id}-${item.number}`;

      if (uniqueSet.has(key)) {
        return;
      }

      uniqueSet.add(key);
      const isTitle = (item.type_id === 6);

      tabFiscalReport.push({
        id : item.id,
        number : item.number,
        label : item.label,
        type_id : item.type_id,
        isTitle,
      });

    });

    dataFiscalsYear.forEach((fiscal, index) => {
      if (index === 0) {
        fiscal.forEach(fisc => {
          tabFiscalReport.forEach(rep => {
            if (fisc.number === rep.number) {
              rep.budget = fisc.budget;
              rep.realisation = fisc.actuals;

              rep.completion = fisc.budget ? fisc.deviationYTDPct / 100 : '';

              if (rep.type_id === 6 && fisc.budget) {
                rep.completion = fisc.actuals / fisc.budget;
              }

              rep.previousReport = [];
              rep.variation = 0;
              rep.isNull = (!fisc.budget && !fisc.actuals);
              rep.isIncomeTitle = fisc.isIncomeTitle || '';
              rep.isExpenseTitle = fisc.isExpenseTitle || '';

              if (rep.type_id === 4) {
                totalBudgetIncome += rep.budget;
                totalRealisationIncome += rep.realisation;
              }

              if (rep.type_id === 5) {
                totalBudgetExpense += rep.budget;
                totalRealisationExpense += rep.realisation;
              }
            }
          });
        });
      }

      if (index > 0) {
        let totalIncomeRealised = 0;
        let totalExpenseRealised = 0;

        fiscal.forEach(fisc => {
          if (fisc.type_id === 4) {
            totalIncomeRealised += fisc.actuals;
          }

          if (fisc.type_id === 5) {
            totalExpenseRealised += fisc.actuals;
          }
        });

        reportFootColumIncome.push({ realisation : totalIncomeRealised });
        reportFootColumExpense.push({ realisation : totalExpenseRealised });
      }
    });

    tabFiscalReport.forEach(rep => {
      dataFiscalsYear.forEach((fiscal, index) => {
        if (index > 0) {
          let realisationValue = 0;
          fiscal.forEach(fisc => {
            if (fisc.number === rep.number) {
              realisationValue = fisc.actuals;
              rep.isNull = (rep.isNull && !fisc.actuals);

              if (index === 1 && rep.realisation && fisc.actuals) {
                rep.variation = rep.realisation - fisc.actuals;

                if (rep.type_id === 4) {
                  totalVariationIncome += rep.variation;
                }

                if (rep.type_id === 5) {
                  totalVariationExpense += rep.variation;
                }
              }
            }
          });

          rep.previousReport.push({ realisation : realisationValue });
        }
      });
    });

    if (hideUnused) {
      tabFiscalReport = tabFiscalReport.filter(id => {
        return !id.isNull;
      });
    }

    if (params.filter === 'hide_title') {
      tabFiscalReport = tabFiscalReport.filter(id => {
        return !id.isTitle;
      });
    }

    if (params.filter === 'show_title') {
      tabFiscalReport = tabFiscalReport.filter(id => {
        return id.isTitle;
      });
    }

    const tabFiscalIncomeData = tabFiscalReport.filter(id => {
      return (id.type_id === 4 || id.isIncomeTitle);
    });

    const tabFiscalExpenseData = tabFiscalReport.filter(id => {
      return (id.type_id === 5 || id.isExpenseTitle);
    });

    const totalCompletionIncome = totalRealisationIncome / totalBudgetIncome;
    const totalCompletionExpense = totalRealisationExpense / totalBudgetExpense;

    const data = {
      colums : dataFiscalsYear,
      enterprise,
      rowsIncome : tabFiscalIncomeData,
      rowsExpense : tabFiscalExpenseData,
      fiscalYearLabel : fiscalYear.label,
      fiscalYearNumber,
      lastFiscalYearNumber,
      reportColumn,
      colspanValue,
      totalBudgetIncome,
      totalRealisationIncome,
      totalBudgetExpense,
      totalRealisationExpense,
      totalVariationIncome,
      totalVariationExpense,
      totalCompletionIncome,
      totalCompletionExpense,
      reportFootColumIncome,
      reportFootColumExpense,
      currencyId : Number(req.session.enterprise.currency_id),
    };

    const result = await reporting.render(data);
    res.set(result.headers).send(result.report);
  } catch (e) {
    next(e);
  }
}
