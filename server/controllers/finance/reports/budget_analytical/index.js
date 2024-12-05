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
  const includeSummarySection = parseInt(params.include_summary_section, 10);

  const ACCOUNT_TYPES_INCOME = 4;
  const ACCOUNT_TYPES_EXPENSE = 5;

  let totalBudgetIncome = 0;
  let totalRealisationIncome = 0;
  let totalVariationIncome = 0;

  let totalBudgetExpense = 0;
  let totalRealisationExpense = 0;
  let totalVariationExpense = 0;
  let totalFinancement = 0;
  let cashLabelDetails;

  let firstIncomeDescription;
  let secondIncomeDescription;

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
    let configurationReferences = [];

    const fiscalYear = await Fiscal.lookupFiscalYear(fiscalYearId);

    if (includeSummarySection) {
      const cashboxesIds = _.values(params.cashboxesIds);

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

      const cashboxes = await db.exec(query, [[cashboxesIds]]);
      const cashAccountIds = cashboxes.map(cashbox => cashbox.account_id);
      cashLabelDetails = cashboxes.map(
        cashbox => `${cashbox.account_number} - ${cashbox.account_label}`);

      const sqlTotalIncomeCash = `
        SELECT gl.trans_id, gl.trans_date, a.number, a.label, gl.debit_equiv, gl.credit_equiv, tt.text, tt.type,
          SUM(gl.debit_equiv - gl.credit_equiv) AS balance
        FROM general_ledger AS gl
        JOIN account AS a ON a.id = gl.account_id
        JOIN transaction_type AS tt ON tt.id = gl.transaction_type_id
        WHERE gl.account_id IN ? AND gl.fiscal_year_id = ? AND tt.type = 'income'
        AND gl.record_uuid NOT IN (
          SELECT DISTINCT gl.record_uuid
          FROM general_ledger AS gl
          WHERE gl.record_uuid IN (
            SELECT rev.uuid
            FROM (
              SELECT v.uuid FROM voucher v WHERE v.reversed = 1
              AND DATE(v.date) >= DATE(?) AND DATE(v.date) <= DATE(?) UNION
              SELECT c.uuid FROM cash c WHERE c.reversed = 1
              AND DATE(c.date) >= DATE(?) AND DATE(c.date) <= DATE(?) UNION
              SELECT i.uuid FROM invoice i WHERE i.reversed = 1
              AND DATE(i.date) >= DATE(?) AND DATE(i.date) <= DATE(?)
            ) AS rev
          )
        );`;

      const paramsFilter = [
        [cashAccountIds],
        fiscalYearId,
        fiscalYear.start_date,
        fiscalYear.end_date,
        fiscalYear.start_date,
        fiscalYear.end_date,
        fiscalYear.start_date,
        fiscalYear.end_date,
      ];

      const totalIncomeCash = await db.one(sqlTotalIncomeCash, paramsFilter);
      totalFinancement = totalIncomeCash.balance;

      const BUDGET_ANALYSIS_REFERENCE_TYPE_ID = 8;

      const sqlReferences = `
        SELECT ar.id, ar.abbr, ar.description, art.account_id, GROUP_CONCAT(a.number, ' ') AS accounts_number,
        a.label
        FROM account_reference AS ar
        JOIN account_reference_item AS art ON art.account_reference_id = ar.id
        JOIN account AS a ON a.id = art.account_id
        WHERE ar.reference_type_id = ?
        GROUP BY ar.id;
      `;

      configurationReferences = await db.exec(sqlReferences, [BUDGET_ANALYSIS_REFERENCE_TYPE_ID]);

      configurationReferences = configurationReferences.map(item => ({
        ...item,
        accounts_number_formated : item.accounts_number
          .split(',')
          .map(num => parseInt(num.trim(), 10))
          .filter(num => Number.isInteger(num)),
      }));
    }

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
      return (id.type_id === ACCOUNT_TYPES_INCOME || id.isIncomeTitle);
    });

    const tabFiscalExpenseData = tabFiscalReport.filter(id => {
      return (id.type_id === ACCOUNT_TYPES_EXPENSE || id.isExpenseTitle);
    });

    const totalCompletionIncome = totalRealisationIncome / totalBudgetIncome;
    const totalCompletionExpense = totalRealisationExpense / totalBudgetExpense;
    const realisationIncomeExpense = totalRealisationIncome - totalRealisationExpense;

    configurationReferences.forEach(item => {
      item.value_account_number = item.accounts_number_formated.reduce((total, accountNumber) => {
        const matchingIncome = tabFiscalIncomeData.find(income => income.number === accountNumber);
        return total + (matchingIncome ? matchingIncome.realisation : 0);
      }, 0);
    });

    let firstIncomeConfigurationReferences = 0;
    let secondIncomeConfigurationReferences = 0;

    if (includeSummarySection) {
      firstIncomeConfigurationReferences = configurationReferences[0].value_account_number;
      firstIncomeDescription = configurationReferences[0].description;

      secondIncomeConfigurationReferences = configurationReferences[1].value_account_number;
      secondIncomeDescription = configurationReferences[1].description;
    }

    const realisationIncomeExpenseFirst = realisationIncomeExpense - firstIncomeConfigurationReferences;
    const realisationIncomeExpenseSecond = realisationIncomeExpense - secondIncomeConfigurationReferences;
    const localCashRevenues = totalFinancement - secondIncomeConfigurationReferences;
    const soldeTotalFinancement = totalFinancement - totalRealisationExpense;

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
      includeSummarySection,
      totalFinancement,
      realisationIncomeExpense,
      realisationIncomeExpenseFirst,
      realisationIncomeExpenseSecond,
      secondIncomeConfigurationReferences,
      localCashRevenues,
      soldeTotalFinancement,
      cashLabelDetails,
      firstIncomeDescription,
      secondIncomeDescription,
    };

    const result = await reporting.render(data);
    res.set(result.headers).send(result.report);
  } catch (e) {
    next(e);
  }
}
