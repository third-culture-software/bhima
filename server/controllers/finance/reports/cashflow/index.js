/**
 * Cashflow Controller
 *
 *
 * This controller is responsible for processing cashflow report.
 *
 * @module finance/cashflow
 *
 * @requires lodash
 * @requires lib/db
 * @requires lib/ReportManager
 * @requires config/identifiers
 * @requires lib/errors/BadRequest
 */
const _ = require('lodash');

const db = require('../../../../lib/db');
const Fiscal = require('../../fiscal');
const ReportManager = require('../../../../lib/ReportManager');
const BadRequest = require('../../../../lib/errors/BadRequest');
const ReferencesCompute = require('../../accounts/references.compute');
const cashflowFunction = require('./cashflow.function');

const TEMPLATE = './server/controllers/finance/reports/cashflow/report.handlebars';
const TEMPLATE_BY_SERVICE = './server/controllers/finance/reports/cashflow/reportByService.handlebars';
const TEMPLATE_TRANSACTION_TYPES = './server/controllers/finance/reports/cashflow/reportTransactionTypes.handlebars';
const TEMPLATE_GLOBAL = './server/controllers/finance/reports/cashflow/reportGlobal.handlebars';
const TEMPLATE_SYNTHETIC = './server/controllers/finance/reports/cashflow/reportSynthetic.handlebars';

// expose to the API
exports.report = report;
exports.byService = reportByService;
exports.reporting = reporting;

/**
 * @function reportByService
 *
 * @description
 * Called "Journal de Ventilation" in French.  Creates a pivot table of cash receipts
 * divided out by the services that received in the income.  Rows are payments, columns
 * are hospital service departments.
 */
async function reportByService(req, res, next) {
  const dateFrom = new Date(req.query.dateFrom);
  const dateTo = new Date(req.query.dateTo);
  const cashboxAccountId = req.query.cashboxId;

  let serviceReport;

  const options = _.clone(req.query);

  _.extend(options, {
    filename : 'REPORT.CASHFLOW_BY_SERVICE.TITLE',
    csvKey : 'matrix',
    orientation : 'landscape',
  });

  try {
    serviceReport = new ReportManager(TEMPLATE_BY_SERVICE, req.session, options);
  } catch (e) {
    next(e);
    return;
  }

  const tableQuery = `
    cash JOIN cash_item ON cash.uuid = cash_item.cash_uuid
      JOIN invoice ON cash_item.invoice_uuid = invoice.uuid
      JOIN service ON service.uuid = invoice.service_uuid
  `;

  const whereQuery = `
    WHERE cash.is_caution = 0 AND cash.reversed = 0
      AND DATE(cash.date) >= DATE(?) AND DATE(cash.date) <= DATE(?)
      AND cash.cashbox_id = ? AND cash.currency_id = ?
  `;

  const pivotQuery = `
    CALL Pivot('${tableQuery}', 'cash.uuid', 'service.name', 'cash_item.amount', "${whereQuery}", '');
  `;

  const cashboxDetailsSql = `
    SELECT cb.id, cb.label, cba.currency_id FROM cash_box cb JOIN cash_box_account_currency cba
      ON cb.id = cba.cash_box_id
    WHERE cba.id = ?;
  `;

  try {

    // pick up the cashbox's details
    const cashbox = await db.one(cashboxDetailsSql, cashboxAccountId);

    /*
     * This query returns a table like:
     * +--------------+-------------+-------------------+---------------+-----------------+-------+
     * | uuid    | Dentisterie | Pavillion Medical | Poly-Clinique | Salle D'Urgence | Total      |
     * +--------------+-------------+-------------------+---------------+-----------------+-------+
     * | binary  |  35000.0000 |            0.0000 |        0.0000 |          0.0000 | 35000.0000 |
     * | binary  |      0.0000 |         9500.0000 |        0.0000 |          0.0000 |  9500.0000 |
     * | binary  |      0.0000 |            0.0000 |        0.0000 |      20000.0000 | 20000.0000 |
     * | binary  |      0.0000 |            0.0000 |     5000.0000 |          0.0000 |  5000.0000 |
     * | NULL    |  35000.0000 |         9500.0000 |     5000.0000 |      20000.0000 | 69500.0000 |
     * +--------------+-------------+-------------------+---------------+-----------------+-------+
     */
    const [rows] = await db.exec(pivotQuery, [dateFrom, dateTo, cashbox.id, cashbox.currency_id]);
    const totals = rows.pop();
    delete totals.uuid;

    // early exit if no information got returned from our query
    if (!rows || !rows.length) {
      const rendered = await serviceReport.render({
        cashbox, dateTo, dateFrom,
      });
      res.set(rendered.headers).send(rendered.report);
      return;
    }

    // we need to supplement the pivot table with the following information -
    // patient's name, the patient's identifier
    const cashUuids = rows.map(row => row.uuid);
    const payments = await db.exec(`
      SELECT c.uuid, c.amount, dm.text as reference, em.text as patientReference, d.text as patientName
      FROM cash c JOIN  document_map dm ON c.uuid = dm.uuid
        JOIN entity_map em ON c.debtor_uuid = em.uuid
        JOIN debtor d ON c.debtor_uuid = d.uuid
      WHERE c.uuid IN (?);
    `, [cashUuids]);

    // map of uuid -> payment record
    const dictionary = _.groupBy(payments, 'uuid');

    // the sum of all cash_items does NOT have to be equal to the cash.amount,
    // since we handle gain/loss on exchange by manipulating the cash.amount.
    // In this case, the cash.amount represents the amount of money that came into
    // the cashbox, but sum of the cash_items represents that amount of money
    // attributed to each invoice (and therfore, service)
    let cumsum = 0;
    let amount = 0;

    const services = Object.keys(totals || {});

    // loop through all cash records, merging in relevant information to display on
    // pivot table
    const matrix = rows.map(row => {
      // grab the payment from the eictionary
      const [payment] = dictionary[row.uuid];

      // calculate the cumulative sum of allocated monies
      cumsum += row.Total;

      // calculate the sum of total amount (which might be
      // different from cumsum)
      amount += payment.amount;

      // grab matrix values
      const values = services.map(key => row[key]);
      const patient = `${payment.patientReference} - ${payment.patientName}`;
      return [payment.reference, patient, ...values, cumsum];
    });

    // if the total amount received is not the same as total amount allocated
    // to each service, we have had gain/loss on exchange. We will add a final line
    // that represents the gain/loss on exchange to our table.
    const gainOrLossOnExchange = (amount - cumsum);
    Object.assign(totals, { cumsum : cumsum + gainOrLossOnExchange });

    const rendered = await serviceReport.render({
      matrix, totals, cashbox, dateTo, dateFrom, services, gainOrLossOnExchange,
    });

    res.set(rendered.headers).send(rendered.report);
  } catch (e) {
    next(e);
  }
}

/**
 * This function get periodic balances by transaction type
 * reporting transaction type balance detailled by accounts
 * with their balance for each transaction type
 */
function report(req, res, next) {
  let serviceReport;
  const dateFrom = new Date(req.query.dateFrom);
  const dateTo = new Date(req.query.dateTo);
  const options = _.clone(req.query);
  const data = {};
  const reversalVoucherType = 10;

  let referenceAccountsRevenues = [];
  let referenceAccountsOperating = [];
  let referenceAccountsPersonnel = [];

  let localCashReferenceAccounts = [];
  let operatingReferenceAccounts = [];
  let personnelReferenceAccounts = [];

  /**
   * In this section, we retrieve the account references that are part of
   * the Select account references related to local cash revenues
   */
  if (options.referenceAccountsRevenues) {
    referenceAccountsRevenues = cashflowFunction.convertToNumericArray(options.referenceAccountsRevenues);
  }

  /**
   * In this section, we retrieve the account references that are part of
   * the Select account references related to local cash revenues
   */
  if (options.referenceAccountsOperating) {
    referenceAccountsOperating = cashflowFunction.convertToNumericArray(options.referenceAccountsOperating);
  }

  /**
   * In this section, we retrieve the account references that are part of
   * the Select account references related to personnel expenses
   */
  if (options.referenceAccountsPersonnel) {
    referenceAccountsPersonnel = cashflowFunction.convertToNumericArray(options.referenceAccountsPersonnel);
  }

  /**
   * This section deals with the case where transaction types classified as "other" are considered
   * as revenues, typically for internal transfers using transfer accounts
   *
   */
  const isTransferAsRevenue = parseInt(options.is_transfer_as_revenue, 10);

  const checkDetailledOption = ((options.modeReport === 'associated_account')
    || (options.modeReport === 'global_analysis')
    || (options.modeReport === 'synthetic_analysis')
  );

  data.detailledReport = checkDetailledOption ? 1 : 0;

  // convert cashboxesIds parameters in array format ['', '', ...]
  // this parameter can be sent as a string or an array we force the conversion into an array
  const cashboxesIds = _.values(req.query.cashboxesIds);

  _.extend(options, {
    filename : 'REPORT.CASHFLOW.TITLE',
    orientation : 'landscape',
  });

  // catch missing required parameters
  if (!dateFrom || !dateTo || !cashboxesIds.length) {
    throw new BadRequest(
      'ERRORS.BAD_REQUEST',
      'There are some missing information among dateFrom, dateTo or cashboxesId',
    );
  }

  let TEMPLATE_REPORT = TEMPLATE;

  if (options.modeReport === 'transaction_type') {
    TEMPLATE_REPORT = TEMPLATE_TRANSACTION_TYPES;
  } else if (options.modeReport === 'global_analysis') {
    TEMPLATE_REPORT = TEMPLATE_GLOBAL;
  } else if (options.modeReport === 'synthetic_analysis') {
    TEMPLATE_REPORT = TEMPLATE_SYNTHETIC;
  }

  try {
    serviceReport = new ReportManager(TEMPLATE_REPORT, req.session, options);
  } catch (e) {
    next(e);
    return;
  }

  data.dateFrom = dateFrom;
  data.dateTo = dateTo;

  cashflowFunction.getCashboxesDetails(cashboxesIds)
    .then(rows => {
      data.cashboxes = rows;
      data.cashAccountIds = data.cashboxes.map(cashbox => cashbox.account_id);
      data.cashLabels = _.chain(data.cashboxes)
        .map(cashbox => `${cashbox.label}`).uniq().join(' | ')
        .value();

      data.cashLabelSymbol = _.chain(data.cashboxes)
        .map(cashbox => cashbox.symbol).uniq().join(' + ');

      data.cashLabelDetails = data.cashboxes.map(cashbox => `${cashbox.account_number} - ${cashbox.account_label}`);

      // build periods columns from calculated period
      return Fiscal.getPeriodsFromDateRange(data.dateFrom, data.dateTo);
    })
    .then(periods => {
      data.periodDates = periods.map(p => p.start_date);

      data.periods = periods.map(p => p.id);

      data.colspan = data.periods.length + 1;

      // build periods columns from calculated period
      return cashflowFunction.getOpeningBalanceData(data.cashAccountIds, periods);
    })
    .then(openingBalanceData => {
      data.openingBalanceData = openingBalanceData;
      const INCOME_CASH_FLOW = 6;
      const EXPENSE_CASH_FLOW = 7;
      const types = [INCOME_CASH_FLOW, EXPENSE_CASH_FLOW];
      // Obtain the accounts from the configuration of accounting references
      /**
       * With this query, we search for all the accounts belonging to the account references linked
       * to Income Cashflow and Expense Cashflow
       */
      return ReferencesCompute.getAccountsConfigurationReferences(types);
    })
    .then(configurationData => {
      /**
       * configurationData: A large array of objects containing
       * 0: Elements of the account reference type
       * 1: Account references corresponding to the budget analysis
       * 2: All account numbers by their account references
       * 3: All accounts to exclude, respectively by account reference
       */

      const configReferenceCashflow = configurationData[1];
      const configAccountsCashflow = configurationData[2];
      const configAccountsExcludeCashflow = configurationData[3];

      if (referenceAccountsRevenues.length) {
        localCashReferenceAccounts = configReferenceCashflow.filter(
          reference => referenceAccountsRevenues.includes(reference.id));
      }

      if (referenceAccountsOperating.length) {
        operatingReferenceAccounts = configReferenceCashflow.filter(
          reference => referenceAccountsOperating.includes(reference.id));
      }

      if (referenceAccountsRevenues.length) {
        personnelReferenceAccounts = configReferenceCashflow.filter(
          reference => referenceAccountsPersonnel.includes(reference.id));
      }

      data.configurationData = configurationData;
      data.accountConfigsfiltered = [];

      configAccountsCashflow.forEach(conf => {
        let isExclude = 0;
        configAccountsExcludeCashflow.forEach(exclu => {
          if (exclu.account_reference_id === conf.account_reference_id && exclu.acc_id === conf.acc_id) {
            isExclude++;
          }
        });

        if (isExclude === 0) {
          data.accountConfigsfiltered.push(conf);
        }
      });

      // build periods string for query
      const periodParams = [];
      const periodString = data.periods.length ? data.periods.map(periodId => {
        periodParams.push(periodId, periodId);
        return `SUM(IF(source.period_id = ?, source.balance, 0)) AS "?"`;
      }).join(',') : '"NO_PERIOD" AS period';

      const query = `
        SELECT
          UPPER(source.transaction_text) AS transaction_text, UPPER(source.account_label) AS account_label,
          ${periodString}, source.transaction_type, source.transaction_type_id, source.account_id
        FROM (
          SELECT
          a.number AS account_number, a.label AS account_label,
          SUM(gl.debit_equiv - gl.credit_equiv) AS balance,
          gl.transaction_type_id, tt.type AS transaction_type, tt.text AS transaction_text,
          gl.account_id, gl.period_id
          FROM general_ledger AS gl
          JOIN account AS a ON a.id = gl.account_id
          JOIN transaction_type AS tt ON tt.id = gl.transaction_type_id
          WHERE gl.account_id IN ? AND ((DATE(gl.trans_date) >= DATE(?)) AND (DATE(gl.trans_date) <= DATE(?)))
          AND gl.transaction_type_id <> ${reversalVoucherType} AND gl.record_uuid NOT IN (
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
          ) GROUP BY gl.transaction_type_id, gl.account_id, gl.period_id
        ) AS source
        GROUP BY transaction_type_id, account_id;
      `;

      // To obtain the detailed cashflow report, the SQL query searches all the transactions
      // concerned by the cash accounts in a sub-request, from the data coming
      // from the sub-requests excluded the transaction lines of the accounts
      // linked to the cash accounts.

      const queryDetailed = `
        SELECT
          source.transaction_text, UPPER(source.account_label) AS account_label, ${periodString},
          source.transaction_type, source.transaction_type_id, source.account_id
        FROM (
          SELECT
          a.number AS account_number, a.label AS account_label,
          SUM(gl.credit_equiv - gl.debit_equiv) AS balance,
          gl.transaction_type_id, tt.type AS transaction_type, IF(tt.type = 5, 'income', tt.text) AS transaction_text,
          gl.account_id, gl.period_id
          FROM general_ledger AS gl
          JOIN account AS a ON a.id = gl.account_id
          JOIN transaction_type AS tt ON tt.id = gl.transaction_type_id
          WHERE gl.record_uuid IN (
            SELECT record_uuid FROM general_ledger WHERE
            account_id IN ? AND ((DATE(gl.trans_date) >= DATE(?)) AND (DATE(gl.trans_date) <= DATE(?)))
          ) AND account_id NOT IN ? AND gl.transaction_type_id <> ${reversalVoucherType}
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
          ) GROUP BY gl.transaction_type_id, gl.account_id, gl.period_id
        ) AS source
        GROUP BY transaction_type_id, account_id
        ORDER BY source.account_label ASC;
      `;

      const params = [...periodParams,
        [data.cashAccountIds],
        data.dateFrom,
        data.dateTo,
        data.dateFrom,
        data.dateTo,
        data.dateFrom,
        data.dateTo,
        data.dateFrom,
        data.dateTo];

      const paramsDetailed = [...periodParams,
        [data.cashAccountIds],
        data.dateFrom,
        data.dateTo,
        [data.cashAccountIds],
        data.dateFrom,
        data.dateTo,
        data.dateFrom,
        data.dateTo,
        data.dateFrom,
        data.dateTo];

      const queryRun = data.detailledReport ? queryDetailed : query;
      const paramsRun = data.detailledReport ? paramsDetailed : params;

      return db.exec(queryRun, paramsRun);
    })
    .then(rows => {
      // FIXME: @lomamech
      // that this is an IMCK-specific hack
      // When the isTransferAsRevenue option is enabled,
      // all transfers (transactions with transaction_type_id === 5)
      // are treated as income by updating their transaction_type to 'income'.
      if (isTransferAsRevenue) {
        // eslint-disable-next-line no-param-reassign
        rows = rows.map(item => {
          if (item.transaction_type_id === 5) {
            return {
              ...item,
              transaction_type : 'income',
            };
          }
          return item;
        });
      }

      if ((options.modeReport !== 'global_analysis') && (options.modeReport !== 'synthetic_analysis')) {
        const incomes = _.chain(rows).filter({ transaction_type : 'income' }).groupBy('transaction_text').value();
        const expenses = _.chain(rows).filter({ transaction_type : 'expense' }).groupBy('transaction_text').value();
        const others = _.chain(rows).filter({ transaction_type : 'other' }).groupBy('transaction_text').value();

        const incomeTextKeys = _.keys(incomes);
        const expenseTextKeys = _.keys(expenses);
        const otherTextKeys = _.keys(others);

        const incomeTotalByTextKeys = cashflowFunction.aggregateTotalByTextKeys(data, incomes);
        const expenseTotalByTextKeys = cashflowFunction.aggregateTotalByTextKeys(data, expenses);
        const otherTotalByTextKeys = cashflowFunction.aggregateTotalByTextKeys(data, others);

        const incomeTotal = cashflowFunction.aggregateTotal(data, incomeTotalByTextKeys);
        const expenseTotal = cashflowFunction.aggregateTotal(data, expenseTotalByTextKeys);
        const otherTotal = cashflowFunction.aggregateTotal(data, otherTotalByTextKeys);

        const totalIncomePeriodColumn = cashflowFunction.totalIncomesPeriods(data, incomeTotal, otherTotal);

        const dataOpeningBalance = cashflowFunction.totalOpening(data.cashboxes, data.openingBalanceData, data.periods);
        const totalOpeningBalanceColumn = dataOpeningBalance.tabFormated;
        const dataOpeningBalanceByAccount = dataOpeningBalance.tabAccountsFormated;

        const totalIncomeGeneral = cashflowFunction.totalIncomes(
          data, incomeTotal, otherTotal, totalOpeningBalanceColumn);

        const totalPeriodColumn = cashflowFunction.totalPeriods(data, incomeTotal, expenseTotal, otherTotal);
        const totalBalancesGeneral = cashflowFunction.totalBalances(data, totalIncomeGeneral, expenseTotal);

        _.extend(data, {
          incomes,
          expenses,
          others,
          incomeTextKeys,
          expenseTextKeys,
          incomeTotalByTextKeys,
          expenseTotalByTextKeys,
          otherTotalByTextKeys,
          incomeTotal,
          expenseTotal,
          otherTextKeys,
          otherTotal,
          totalIncomePeriodColumn,
          totalPeriodColumn,
          totalOpeningBalanceColumn,
          totalIncomeGeneral,
          totalBalancesGeneral,
          dataOpeningBalanceByAccount,
        });

      } else if ((options.modeReport === 'global_analysis') || (options.modeReport === 'synthetic_analysis')) {
        /**
         * In this section, we view the detailed Cashflow report by grouping the accounts
         * using the account reference module. Certain account references are selected
         * for further sub-groupings to enable Cashflow analysis with additional information
         *
        */

        rows.forEach(item => {
          /**
           * Here, each cash flow account is assigned to the corresponding account reference,
           * and references that are not linked to any reference are considered as Not Referenced
           */

          item.found = false;
          item.description_reference = 'REPORT.CASHFLOW.NOT_REFERENCED';

          data.accountConfigsfiltered.forEach(config => {
            if (item.account_id === config.acc_id) {
              item.found = true;
              item.reference_type_id = config.reference_type_id;
              item.description_reference = config.description;
              item.acc_number = config.acc_number;
              item.account_reference_id = config.account_reference_id;
            }
          });
        });

        /**
         * Here, we add a new property: sumAggregate to calculate the total obtained
         * for each account reference in order to display the total value
         */
        rows.forEach(item => {
          item.sumAggregate = 0;
          data.periods.forEach(per => {
            item.sumAggregate += item[per];
          });
        });

        /** Here, we group the data that will constitute the Incomes */
        const incomesGlobals = _.chain(rows).filter({ transaction_type : 'income' })
          .groupBy('description_reference').value();

        /** Here, we group the data that will constitute the Expenses */
        const expensesGlobals = _.chain(rows).filter({ transaction_type : 'expense' })
          .groupBy('description_reference').value();

        /** Here, we group the data that falls under the Others category */
        const othersGlobals = _.chain(rows).filter({ transaction_type : 'other' })
          .groupBy('description_reference').value();

        /** In this section, we get the display key for each section of the report */
        const incomeGlobalsTextKeys = _.keys(incomesGlobals);
        const expenseGlobalsTextKeys = _.keys(expensesGlobals);
        const otherGlobalsTextKeys = _.keys(othersGlobals);

        /** Here, we obtain the details of each account reference with the sum of values for each period */
        const incomeGlobalsTotalByTextKeys = cashflowFunction.aggregateTotalByTextKeys(data, incomesGlobals);
        const expenseGlobalsTotalByTextKeys = cashflowFunction.aggregateTotalByTextKeys(data, expensesGlobals);
        const otherGlobalsTotalByTextKeys = cashflowFunction.aggregateTotalByTextKeys(data, othersGlobals);

        /** Here, we obtain the summation of values corresponding to each account reference */
        const incomeGlobalsTotal = cashflowFunction.aggregateTotal(data, incomeGlobalsTotalByTextKeys);
        const expenseGlobalsTotal = cashflowFunction.aggregateTotal(data, expenseGlobalsTotalByTextKeys);
        const otherGlobalsTotal = cashflowFunction.aggregateTotal(data, otherGlobalsTotalByTextKeys);

        /** Here, it's for obtaining the overall sum of each section: Income, Expense, and Other */
        const sumIncomeGlobalsTotal = cashflowFunction.sumAggregateTotal(data, incomeGlobalsTotalByTextKeys);
        const sumExpenseGlobalsTotal = cashflowFunction.sumAggregateTotal(data, expenseGlobalsTotalByTextKeys);
        const sumOtherGlobalsTotal = cashflowFunction.sumAggregateTotal(data, otherGlobalsTotalByTextKeys);

        const totalIncomePeriodColumn = cashflowFunction.totalIncomesPeriods(
          data, incomeGlobalsTotal, otherGlobalsTotal);
        const sumIncomePeriodColumn = cashflowFunction.sumIncomesPeriods(data, incomeGlobalsTotal, otherGlobalsTotal);

        /** Here, it's to obtain the opening balances of the selected cashboxes for the report */
        const dataOpeningBalance = cashflowFunction.totalOpening(data.cashboxes, data.openingBalanceData, data.periods);

        // Total opening balances per period
        const totalOpeningBalanceColumn = dataOpeningBalance.tabFormated;
        // Total sum of all opening balances
        const sumOpeningBalanceColumn = dataOpeningBalance.sumOpening;
        // Opening balance per period for each selected cashbox
        const dataOpeningBalanceByAccount = dataOpeningBalance.tabAccountsFormated;

        // Total general Incomes per period
        const totalIncomeGeneral = cashflowFunction.totalIncomes(
          data, incomeGlobalsTotal, otherGlobalsTotal, totalOpeningBalanceColumn);

        // Sum of general incomes per period
        const sumTotalIncomeGeneral = cashflowFunction.sumTotalIncomes(
          data,
          incomeGlobalsTotal,
          otherGlobalsTotal,
          totalOpeningBalanceColumn,
        );

        const totalPeriodColumn = cashflowFunction.totalPeriods(
          data, incomeGlobalsTotal, expenseGlobalsTotal, otherGlobalsTotal);
        const totalBalancesGeneral = cashflowFunction.totalBalances(data, totalIncomeGeneral, expenseGlobalsTotal);
        const sumBalancesGeneral = cashflowFunction.sumTotalBalances(data, totalIncomeGeneral, expenseGlobalsTotal);

        // colspan defines the number of columns to be displayed in the report table
        data.colspan += 1;
        // emptyRow: defines the number of columns for an empty table
        data.emptyRow = data.periods.length;

        let localCashGlobalsTextKeys;
        let localCashGlobalsTotalByTextKeys;
        let localCashGlobals;
        let totalLocalCashIncome;
        let sumLocalCashIncome = 0;
        let otherIncomeGlobalsTextKeys;

        if (referenceAccountsRevenues.length) {
          /**
           * Getting the total revenues corresponding to each period's revenues
           * plus the cash of each month
           */
          const localReferenceGroups = localCashReferenceAccounts.map(item => item.referenceGroup);

          localCashGlobalsTextKeys = localReferenceGroups;

          /**
           * Retrieving the key for the grouping of account references related to
           * Local Cash Revenue
           */
          otherIncomeGlobalsTextKeys = incomeGlobalsTextKeys.filter(item => !localReferenceGroups.includes(item));

          /**
           * Here we search for all references related to local revenues and store them in a main object
           * local revenues: Total Local Cash Revenues
           */
          localCashGlobalsTotalByTextKeys = Object.fromEntries(
            localReferenceGroups.map(
              key => [key, incomeGlobalsTotalByTextKeys[key]]).filter(([value]) => value !== undefined,
            ),
          );

          /**
           * Filtering the obtained data by excluding Undefined values
           */
          localCashGlobalsTotalByTextKeys = Object.fromEntries(
            Object.entries(localCashGlobalsTotalByTextKeys).filter((entry) => {
              return entry[1] !== undefined;
            }),
          );

          localCashGlobalsTextKeys = localCashGlobalsTextKeys.filter(
            item => Object.keys(localCashGlobalsTotalByTextKeys).includes(item));

          /**
           * This is the calculation of the sum of local revenues for each period
           */
          totalLocalCashIncome = cashflowFunction.aggregateData(localCashGlobalsTotalByTextKeys);

          /**
           * This is the total sum of local revenues
           */
          sumLocalCashIncome = totalLocalCashIncome.sumAggregate;

          localCashGlobals = incomesGlobals;
        }

        let operatingGlobalsTextKeys;
        let operatingGlobalsTotalByTextKeys;
        let operatingGlobals;
        let totalOperatingExpense;
        let sumOperatingExpense = 0;

        if (referenceAccountsOperating.length) {
          /**
           * Getting the total expenses that correspond to local expenses for each period
           */
          const opReferenceGroups = operatingReferenceAccounts.map(item => item.referenceGroup);
          /**
           * Getting the key for operating expenses
           */
          operatingGlobalsTextKeys = opReferenceGroups;

          /** Filtering the items that make up operating expenses from the total expenses */
          operatingGlobalsTotalByTextKeys = Object.fromEntries(
            opReferenceGroups.map(
              key => [key, expenseGlobalsTotalByTextKeys[key]]).filter(([value]) => value !== undefined,
            ),
          );

          // Data filtering
          operatingGlobalsTotalByTextKeys = Object.fromEntries(
            Object.entries(operatingGlobalsTotalByTextKeys).filter((entry) => {
              return entry[1] !== undefined;
            }),
          );

          operatingGlobalsTextKeys = operatingGlobalsTextKeys.filter(
            item => Object.keys(operatingGlobalsTotalByTextKeys).includes(item));

          /**
           * This is the calculation of the sum of operating expenses for each period
           */
          totalOperatingExpense = cashflowFunction.aggregateData(operatingGlobalsTotalByTextKeys);

          /**
           * This is the sum of local revenues
           */
          sumOperatingExpense = totalOperatingExpense.sumAggregate;

          operatingGlobals = expensesGlobals;
        }

        let personnelGlobalsTextKeys;
        let personnelGlobalsTotalByTextKeys;
        let personnelGlobals;
        let totalPersonnelExpense;
        let sumPersonnelExpense = 0;

        if (referenceAccountsPersonnel.length) {
          /**
           * Getting the total expenses related to Personnel expense for each period
           */

          const personnelReferenceGroups = personnelReferenceAccounts.map(item => item.referenceGroup);
          personnelGlobalsTextKeys = personnelReferenceGroups;

          /**
           * Extraction of references related to personnel expenses and data filtering
           */
          personnelGlobalsTotalByTextKeys = Object.fromEntries(
            personnelReferenceGroups.map(
              key => [key, expenseGlobalsTotalByTextKeys[key]]).filter(([value]) => value !== undefined,
            ),
          );

          personnelGlobalsTotalByTextKeys = Object.fromEntries(
            Object.entries(personnelGlobalsTotalByTextKeys).filter((entry) => {
              return entry[1] !== undefined;
            }),
          );

          personnelGlobalsTextKeys = personnelGlobalsTextKeys.filter(
            item => Object.keys(personnelGlobalsTotalByTextKeys).includes(item));

          totalPersonnelExpense = cashflowFunction.aggregateData(personnelGlobalsTotalByTextKeys);

          // Calculation of the total sum of personnel expenses
          sumPersonnelExpense = totalPersonnelExpense.sumAggregate;

          personnelGlobals = expensesGlobals;
        }

        const otherExpenseReference = _.union(operatingGlobalsTextKeys, personnelGlobalsTextKeys);

        const otherExpenseGlobalsTextKeys = expenseGlobalsTextKeys.filter(
          item => !otherExpenseReference.includes(item));

        const totalPersonnelExpenseOperating = {};

        Object.keys(totalOperatingExpense).forEach(key => {
          totalPersonnelExpenseOperating[key] = (totalOperatingExpense[key] || 0) + (totalPersonnelExpense[key] || 0);
        });

        const sumPersonnelExpenseOperating = totalPersonnelExpenseOperating.sumAggregate;

        const percentageOperantingPersonnelOnRevenue = {};

        Object.keys(totalPersonnelExpenseOperating).forEach(key => {
          percentageOperantingPersonnelOnRevenue[key] = totalPersonnelExpenseOperating[key]
            / (totalIncomeGeneral[key]);
        });

        /**
         * This is simply a way to get an overview of 55% and 45% of local revenues
         */
        const totalLocalCashIncome55 = {};
        const totalLocalCashIncome45 = {};

        Object.keys(totalLocalCashIncome).forEach(key => {
          totalLocalCashIncome55[key] = totalLocalCashIncome[key] * 0.55;
          totalLocalCashIncome45[key] = totalLocalCashIncome[key] * 0.45;
        });

        _.extend(data, {
          incomesGlobals,
          expensesGlobals,
          othersGlobals,
          incomeGlobalsTextKeys,
          expenseGlobalsTextKeys,
          incomeGlobalsTotalByTextKeys,
          expenseGlobalsTotalByTextKeys,
          otherGlobalsTotalByTextKeys,
          incomeGlobalsTotal,
          expenseGlobalsTotal,
          otherGlobalsTextKeys,
          otherGlobalsTotal,
          totalIncomePeriodColumn,
          totalPeriodColumn,
          totalOpeningBalanceColumn,
          totalIncomeGeneral,
          totalBalancesGeneral,
          dataOpeningBalanceByAccount,
          sumTotalIncomeGeneral,
          sumOpeningBalanceColumn,
          sumIncomePeriodColumn,
          sumIncomeGlobalsTotal,
          sumExpenseGlobalsTotal,
          sumOtherGlobalsTotal,
          sumBalancesGeneral,
          localCashGlobalsTextKeys,
          localCashGlobalsTotalByTextKeys,
          localCashGlobals,
          totalLocalCashIncome,
          sumLocalCashIncome,
          otherIncomeGlobalsTextKeys,
          operatingGlobalsTextKeys,
          operatingGlobalsTotalByTextKeys,
          sumOperatingExpense,
          operatingGlobals,
          totalOperatingExpense,
          personnelGlobalsTextKeys,
          personnelGlobalsTotalByTextKeys,
          sumPersonnelExpense,
          personnelGlobals,
          totalPersonnelExpense,
          otherExpenseGlobalsTextKeys,
          totalPersonnelExpenseOperating,
          sumPersonnelExpenseOperating,
          percentageOperantingPersonnelOnRevenue,
          totalLocalCashIncome55,
          totalLocalCashIncome45,
        });
      }

      return serviceReport.render(data);
    })
    .then((result) => {
      res.set(result.headers).send(result.report);
    })
    .catch(next);

}

async function reporting(options, session) {
  const dateFrom = new Date(options.dateFrom);
  const dateTo = new Date(options.dateTo);
  const data = {};
  const reversalVoucherType = 10;

  // convert cashboxesIds parameters in array format ['', '', ...]
  // this parameter can be sent as a string or an array we force the conversion into an array
  const cashboxesIds = _.values(options.cashboxesIds);

  _.extend(options, { orientation : 'landscape' });

  // catch missing required parameters
  if (!dateFrom || !dateTo || !cashboxesIds.length) {
    throw new BadRequest(
      'ERRORS.BAD_REQUEST',
      'There are some missing information among dateFrom, dateTo or cashboxesId',
    );
  }

  const serviceReport = new ReportManager(TEMPLATE, session, options);

  data.dateFrom = dateFrom;
  data.dateTo = dateTo;

  data.cashboxes = await cashflowFunction.getCashboxesDetails(cashboxesIds);
  data.cashAccountIds = data.cashboxes.map(cashbox => cashbox.account_id);

  data.cashLabels = _.chain(data.cashboxes)
    .map(cashbox => `${cashbox.label}`).uniq().join(' | ')
    .value();

  data.cashLabelSymbol = _.chain(data.cashboxes)
    .map(cashbox => cashbox.symbol).uniq().join(' + ');

  data.cashLabelDetails = data.cashboxes.map(cashbox => `${cashbox.account_number} - ${cashbox.account_label}`);

  // build periods columns from calculated period
  const periods = await Fiscal.getPeriodsFromDateRange(data.dateFrom, data.dateTo);
  data.periodDates = periods.map(p => p.start_date);
  data.periods = periods.map(p => p.id);
  data.colspan = data.periods.length + 1;
  // build periods string for query
  const periodParams = [];
  const periodString = data.periods.length ? data.periods.map(periodId => {
    periodParams.push(periodId, periodId);
    return `SUM(IF(source.period_id = ?, source.balance, 0)) AS "?"`;
  }).join(',') : '"NO_PERIOD" AS period';

  const query = `
        SELECT
          UPPER(source.transaction_text) AS transaction_text, source.account_label, ${periodString},
          source.transaction_type, source.transaction_type_id, source.account_id
        FROM (
          SELECT
          a.number AS account_number, a.label AS account_label,
          SUM(gl.debit_equiv - gl.credit_equiv) AS balance,
          gl.transaction_type_id, tt.type AS transaction_type, tt.text AS transaction_text,
          gl.account_id, gl.period_id
          FROM general_ledger AS gl
          JOIN account AS a ON a.id = gl.account_id
          JOIN transaction_type AS tt ON tt.id = gl.transaction_type_id
          WHERE gl.account_id IN ? AND ((DATE(gl.trans_date) >= DATE(?)) AND (DATE(gl.trans_date) <= DATE(?)))
          AND gl.transaction_type_id <> ${reversalVoucherType} AND gl.record_uuid NOT IN (
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
          ) GROUP BY gl.transaction_type_id, gl.account_id, gl.period_id
        ) AS source
        GROUP BY transaction_type_id, account_id;
      `;

  const params = [...periodParams,
    [data.cashAccountIds],
    data.dateFrom,
    data.dateTo,
    data.dateFrom,
    data.dateTo,
    data.dateFrom,
    data.dateTo,
    data.dateFrom,
    data.dateTo];
  const rows = await db.exec(query, params);

  // split incomes from expenses
  const incomes = _.chain(rows).filter({ transaction_type : 'income' }).groupBy('transaction_text').value();
  const expenses = _.chain(rows).filter({ transaction_type : 'expense' }).groupBy('transaction_text').value();
  const others = _.chain(rows).filter({ transaction_type : 'other' }).groupBy('transaction_text').value();

  const incomeTextKeys = _.keys(incomes);
  const expenseTextKeys = _.keys(expenses);
  const otherTextKeys = _.keys(others);

  const incomeTotalByTextKeys = cashflowFunction.aggregateTotalByTextKeys(data, incomes);
  const expenseTotalByTextKeys = cashflowFunction.aggregateTotalByTextKeys(data, expenses);
  const otherTotalByTextKeys = cashflowFunction.aggregateTotalByTextKeys(data, others);

  const incomeTotal = cashflowFunction.aggregateTotal(data, incomeTotalByTextKeys);
  const expenseTotal = cashflowFunction.aggregateTotal(data, expenseTotalByTextKeys);
  const otherTotal = cashflowFunction.aggregateTotal(data, otherTotalByTextKeys);
  const totalPeriodColumn = cashflowFunction.totalPeriods(data, incomeTotal, expenseTotal, otherTotal);

  _.extend(data, {
    incomes,
    expenses,
    others,
    incomeTextKeys,
    expenseTextKeys,
    incomeTotalByTextKeys,
    expenseTotalByTextKeys,
    otherTotalByTextKeys,
    incomeTotal,
    expenseTotal,
    otherTextKeys,
    otherTotal,
    totalPeriodColumn,
  });

  return serviceReport.render(data);
}
