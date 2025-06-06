const _ = require('lodash');

const ReportManager = require('../../../../lib/ReportManager');
const db = require('../../../../lib/db');
const util = require('../../../../lib/util');
const Budget = require('../../budget');
const Fiscal = require('../../fiscal');
const ReferencesCompute = require('../../accounts/references.compute');

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

  let totalCash = 0;

  let totalBudgetIncome = 0;
  let totalRealisationIncome = 0;
  let totalVariationIncome = 0;

  let totalBudgetExpense = 0;
  let totalRealisationExpense = 0;
  let totalVariationExpense = 0;
  let localCashRevenues = 0;
  let realisationOperatingRevenue;
  let realisationOperatingFinancialRevenue;

  let cashLabelDetails;
  let operatingRevenueDescription;
  let operatingFinancialRevenueDescription;

  let balanceOtherIncome = 0;

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
    let configurationReferencesException = [];

    const ACCOUNT_REFERENCE_NUMBERS = 2;
    const ACCOUNT_REFERENCE_EXCLUSIONS = 3;

    const CONFIG_REF_OPERATING_REVENUE = 0;
    const CONFIG_REF_OPERATING_FINANCIAL_REVENUE = 1;
    const CONFIG_REF_OPERATING_SUBSIDIES = 2;
    const CONFIG_REF_REVENUE_OTHER_SOURCES = 4;
    const CONFIG_REF_LOCAL_REVENUES = 3;

    const fiscalYear = await Fiscal.lookupFiscalYear(fiscalYearId);

    if (includeSummarySection) {
      let cashboxesIds = [];
      let transactionTypes = [];
      let transactionTypesSubsidies = [];

      if (params.cashboxesIds) {
        // Selecting the cashbox to enable local revenue analysis
        cashboxesIds = util.convertToNumericArray(params.cashboxesIds);
      }

      if (params.transactionTypes) {
        /**
         * Determination of transaction types to exclude for fund inflows
         * that are not considered as revenue
         */
        transactionTypes = util.convertToNumericArray(params.transactionTypes);

      }

      if (params.transactionTypesSubsidies) {
        /**
         * Determination of transactions for operating subsidies,
         * subsidies are included in the calculation of overall revenue
         * but excluded when determining local revenue
         */
        transactionTypesSubsidies = util.convertToNumericArray(params.transactionTypesSubsidies);
      }

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

      /**
       * Retrieving accounts linked to the selected cashbox or cashboxes
       */
      const cashboxes = await db.exec(query, [[cashboxesIds]]);

      const cashAccountIds = cashboxes.map(cashbox => cashbox.account_id);
      cashLabelDetails = cashboxes.map(
        cashbox => `${cashbox.account_number} - ${cashbox.account_label}`);

      const BUDGET_ANALYSIS_REFERENCE_TYPE_ID = 8;

      const sqlReferences = `
        SELECT ar.id, ar.abbr, ar.description, art.account_id, GROUP_CONCAT(a.number, ' ') AS accounts_number,
        GROUP_CONCAT(a.id, ' ') AS accounts_id, a.label
        FROM account_reference AS ar
        JOIN account_reference_item AS art ON art.account_reference_id = ar.id
        JOIN account AS a ON a.id = art.account_id
        WHERE ar.reference_type_id = ? AND art.is_exception = 0
        GROUP BY ar.id;
      `;

      /**
       * accountsReferenceType: A large array of objects containing
       * 0: Elements of the account reference type
       * 1: Account references corresponding to the budget analysis
       * 2: All account numbers by their account references
       * 3: All accounts to exclude, respectively by account reference
       */
      const accountsReferenceType = await ReferencesCompute.getAccountsConfigurationReferences(
        [BUDGET_ANALYSIS_REFERENCE_TYPE_ID],
      );

      const accountNumbersByReference = accountsReferenceType[ACCOUNT_REFERENCE_NUMBERS];
      const excludedAccounts = accountsReferenceType[ACCOUNT_REFERENCE_EXCLUSIONS];

      configurationReferences = await db.exec(sqlReferences, [BUDGET_ANALYSIS_REFERENCE_TYPE_ID]);

      /**
       * Here, the account references corresponding to the budget analysis are formatted
       * and placed into the arrays accounts_number_formated and accounts_id_formated
       */
      configurationReferences = configurationReferences.map(item => ({
        ...item,
        accounts_number_formated : item.accounts_number
          .split(',')
          .map(num => parseInt(num.trim(), 10))
          .filter(num => Number.isInteger(num)),
        accounts_id_formated : item.accounts_id
          .split(',')
          .map(num => parseInt(num.trim(), 10))
          .filter(num => Number.isInteger(num)),
      }));

      const localRevenues = configurationReferences[CONFIG_REF_LOCAL_REVENUES];

      let referencesTypeAccounts = accountNumbersByReference.filter(
        item => item.account_reference_id === localRevenues.id,
      );

      referencesTypeAccounts.forEach(item => {
        item.exception = false;
        excludedAccounts.forEach(elt => {
          if (item.acc_id === elt.acc_id) {
            item.exception = true;
          }
        });
      });

      referencesTypeAccounts = referencesTypeAccounts.filter(item => item.exception === false);

      const sqlReferencesException = `
        SELECT ar.id, ar.abbr, ar.description, art.account_id, GROUP_CONCAT(a.number, ' ') AS accounts_number,
        GROUP_CONCAT(a.id, ' ') AS accounts_id, a.label
        FROM account_reference AS ar
        JOIN account_reference_item AS art ON art.account_reference_id = ar.id
        JOIN account AS a ON a.id = art.account_id
        WHERE ar.reference_type_id = ? AND art.is_exception = 1
        GROUP BY ar.id;
      `;

      /**
       * Here, all accounts belonging to the excluded account references are listed.
       * The account numbers as well as the account IDs are placed into the arrays
       * accounts_number_formated and accounts_id_formated
       */
      configurationReferencesException = await db.exec(sqlReferencesException, [BUDGET_ANALYSIS_REFERENCE_TYPE_ID]);

      configurationReferencesException = configurationReferencesException.map(item => ({
        ...item,
        accounts_number_formated : item.accounts_number
          .split(',')
          .map(num => parseInt(num.trim(), 10))
          .filter(num => Number.isInteger(num)),
        accounts_id_formated : item.accounts_id
          .split(',')
          .map(num => parseInt(num.trim(), 10))
          .filter(num => Number.isInteger(num)),
      }));

      let filterTransactionType = ``;
      let filterExcludeTransactionType = ``;

      /**
       * Here, clauses are formatted to be injected into SQL queries
       * in order to account for the transaction types to exclude
       */
      if (transactionTypes.length) {
        filterTransactionType = ` AND aggr.transaction_type_id NOT IN (${transactionTypes})`;
        filterExcludeTransactionType = ` AND gl.transaction_type_id NOT IN (${transactionTypes})`;
      }

      let filterTransactionTypesSubsidies = ``;

      /**
       * Here, clauses are formatted to be injected into SQL queries
       * to exclude transaction types corresponding to operating subsidies
       */
      if (transactionTypesSubsidies.length) {
        filterTransactionTypesSubsidies = ` AND gl.transaction_type_id NOT IN (${transactionTypesSubsidies})`;
      }

      const sqlCashflowIncome = `
        SELECT aggr.trans_id, a.number, a.label, aggr.account_id, SUM(aggr.debit_equiv) AS debit_equiv,
          SUM(aggr.credit_equiv) AS credit_equiv, SUM(aggr.credit_equiv - aggr.debit_equiv) AS balance,
          aggr.trans_date, aggr.record_uuid, aggr.transaction_type_id, tt.text
        FROM general_ledger AS aggr
        JOIN account AS a ON a.id = aggr.account_id
        JOIN transaction_type AS tt ON tt.id = aggr.transaction_type_id
        WHERE aggr.record_uuid IN (
            SELECT gl.record_uuid
            FROM general_ledger AS gl
            WHERE gl.fiscal_year_id = ?
            AND gl.account_id IN ? AND gl.trans_id <> 10
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
            )
        ) AND aggr.debit_equiv = 0 AND (tt.type = 'income' OR tt.type = 'other') AND aggr.transaction_type_id <> 10
        ${filterTransactionType}
        GROUP BY aggr.account_id
        ORDER BY a.number ASC;
      `;

      const paramsLocalIncomeFilter = [
        fiscalYearId,
        [cashAccountIds],
        fiscalYear.start_date,
        fiscalYear.end_date,
        fiscalYear.start_date,
        fiscalYear.end_date,
        fiscalYear.start_date,
        fiscalYear.end_date,
      ];

      /**
       * Retrieving the revenue obtained with the selected cashbox
       */
      const cashflowIncome = await db.exec(sqlCashflowIncome, paramsLocalIncomeFilter);

      cashflowIncome.forEach(income => {
        referencesTypeAccounts.forEach(ref => {
          if (income.account_id === ref.acc_id) {
            localCashRevenues += income.balance;
          }
        });
      });

      /**
       * Configuration with index 4 corresponds to the fifth account reference configuration
       * to capture revenue from other sources such as bank accounts
       */
      if (configurationReferences[CONFIG_REF_REVENUE_OTHER_SOURCES]) {
        const otherIncome = configurationReferences[CONFIG_REF_REVENUE_OTHER_SOURCES];

        const sqlOtherIncome = `
          SELECT map.text AS referenceVoucher, gl.trans_id, gl.trans_date, a.id AS account_id,
          a.number AS account_number, a.label AS account_label, gl.transaction_type_id,
          gl.description, SUM(gl.debit_equiv) AS debit_equiv,
          tt.text, tt.type, v.reversed
          FROM general_ledger AS gl
          JOIN voucher AS v ON v.uuid = gl.record_uuid
          JOIN document_map AS map ON map.uuid = v.uuid
          JOIN account AS a ON a.id = gl.account_id
          JOIN transaction_type AS tt ON tt.id = gl.transaction_type_id
          WHERE
          gl.fiscal_year_id = ?
          AND gl.account_id IN ? AND gl.debit > 0 AND v.reversed = 0
          AND gl.transaction_type_id <> 10 ${filterTransactionTypesSubsidies}
          ${filterExcludeTransactionType}
          ORDER BY gl.trans_date ASC;
        `;

        const referencesOtherIncome = await db.exec(sqlOtherIncome, [fiscalYearId, [otherIncome.accounts_id_formated]]);

        /**
         * This is the value corresponding to the sum of other revenues. To obtain this value,
         * it is essential to exclude operating subsidies, corrections
         * of entries, and miscellaneous operations
         */
        balanceOtherIncome = referencesOtherIncome[0].debit_equiv;
      }
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

    // This is the difference between the profits made on expenses during the fiscal year
    const realisationIncomeExpense = totalRealisationIncome - totalRealisationExpense;

    configurationReferences.forEach((item, index) => {
      /**
       * Here, we search for how to calculate the values corresponding to each of the account references.
       * These values are obtained from tabFiscalIncomeData and they only concern the first 4
       * configurations of the budget analysis, which is why we limit ourselves to index 4
       */
      if (index < 4) {
        item.value_account_number = item.accounts_number_formated.reduce((total, accountNumber) => {
          const matchingIncome = tabFiscalIncomeData.find(income => income.number === accountNumber);
          return total + (matchingIncome ? matchingIncome.realisation : 0);
        }, 0);
      }
    });

    /** Here, we perform exactly the same operation but for the excluded accounts */
    configurationReferencesException.forEach((item, index) => {
      if (index < 4) {
        item.value_account_number = item.accounts_number_formated.reduce((total, accountNumber) => {
          const matchingIncome = tabFiscalIncomeData.find(income => income.number === accountNumber);
          return total + (matchingIncome ? matchingIncome.realisation : 0);
        }, 0);
      }
    });

    /**
     * Here, we iterate through both arrays configurationReferences and configurationReferencesException
     * in order to subtract the corresponding value from the exceptions array:
     */
    configurationReferences.forEach(item => {
      const getException = configurationReferencesException.find(elt => elt.abbr === item.abbr);
      if (getException) {
        item.value_account_number -= getException.value_account_number;
      }
    });

    const operatingRevenue = configurationReferences[CONFIG_REF_OPERATING_REVENUE];
    const operatingFinancialRevenue = configurationReferences[CONFIG_REF_OPERATING_FINANCIAL_REVENUE];

    let operatingSubsidiesReferences = 0;

    if (includeSummarySection) {
      // Corresponds to operating revenue
      operatingRevenueDescription = operatingRevenue.description;

      // Corresponds to actual revenue generated without operating subsidies
      operatingFinancialRevenueDescription = operatingFinancialRevenue.description;

      // Corresponds to the value of operating subsidies received
      operatingSubsidiesReferences = configurationReferences[CONFIG_REF_OPERATING_SUBSIDIES].value_account_number;

      /**
       * Here, we calculate the result without the accounts, which would represent the result
       * without subsidies and Financial revenues
       */
      realisationOperatingRevenue = (operatingRevenue.value_account_number || 0) - totalRealisationExpense;

      /** Here, we evaluate the result without operating subsidies */
      realisationOperatingFinancialRevenue = (operatingFinancialRevenue.value_account_number || 0)
        - totalRealisationExpense;
    }

    /** localCash corresponds to the revenue generated without operating subsidies */
    localCashRevenues += balanceOtherIncome;

    /**
     * Total Cash is the sum of local revenue + operating subsidies
     */
    totalCash = localCashRevenues + operatingSubsidiesReferences;
    const soldeTotalFinancement = totalCash - totalRealisationExpense;

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
      totalCash,
      realisationIncomeExpense,
      realisationOperatingRevenue,
      realisationOperatingFinancialRevenue,
      operatingSubsidiesReferences,
      localCashRevenues,
      soldeTotalFinancement,
      cashLabelDetails,
      operatingRevenueDescription,
      operatingFinancialRevenueDescription,
    };

    const result = await reporting.render(data);
    res.set(result.headers).send(result.report);
  } catch (e) {
    next(e);
  }
}
