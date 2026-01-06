/**
 * @module controllers/finance/fiscal
 *
 * @description
 * This module is responsible for implementing CRUD on the fiscal table, as
 * well as accompanying period tables.
 *
 * @requires lodash
 * @requires lib/db
 * @requires lib/errors/NotFound
 */

const _ = require('lodash');
const debug = require('debug')('bhima:FiscalYear');
const Tree = require('@ima-worldhealth/tree');

const db = require('../../lib/db');
const NotFound = require('../../lib/errors/NotFound');
const BadRequest = require('../../lib/errors/BadRequest');
const FilterParser = require('../../lib/filter');
const { formatDateString } = require('../../lib/util');

// Account Service
const AccountService = require('./accounts');

exports.list = list;
exports.getFiscalYearsByDate = getFiscalYearsByDate;
exports.setOpeningBalance = setOpeningBalance;
exports.getBalance = getBalance;
exports.closing = closing;
exports.create = create;
exports.detail = detail;
exports.update = update;
exports.remove = remove;
exports.getPeriods = getPeriods;
exports.getPeriodZero = getPeriodZero;

exports.lookupFiscalYear = lookupFiscalYear;

exports.getPeriodByFiscal = getPeriodByFiscal;
exports.lookupFiscalYearByDate = lookupFiscalYearByDate;
exports.getFirstDateOfFirstFiscalYear = getFirstDateOfFirstFiscalYear;
exports.getNumberOfFiscalYears = getNumberOfFiscalYears;
exports.getDateRangeFromPeriods = getDateRangeFromPeriods;
exports.getPeriodsFromDateRange = getPeriodsFromDateRange;
exports.getAccountBalancesByTypeId = getAccountBalancesByTypeId;

exports.getOpeningBalance = getOpeningBalance;
exports.getOpeningBalanceRoute = getOpeningBalanceRoute;
exports.getClosingBalance = getClosingBalance;
exports.getClosingBalanceRoute = getClosingBalanceRoute;

exports.getFiscalYearByPeriodId = getFiscalYearByPeriodId;
exports.getEnterpriseFiscalStart = getEnterpriseFiscalStart;

/**
 * @method lookupFiscalYear
 *
 * @description
 * This function returns a single record from the fiscal year table matching
 * the ID provided.  If no record is found, it throws a NotFound error.
 *
 * @param {Number} id - the id of the sought fiscal year
 * @returns {Promise} - a promise resolving to the fiscal record
 */
function lookupFiscalYear(id) {
  const sql = `
    SELECT id, enterprise_id, number_of_months, label, start_date, end_date,
    previous_fiscal_year_id, locked, note
    FROM fiscal_year
    WHERE id = ?;
  `;

  return db.one(sql, [id], id, 'fiscal year');
}

function getFiscalYearByPeriodId(periodId) {
  const sql = `
    SELECT id, enterprise_id, number_of_months, label, start_date, end_date,
    previous_fiscal_year_id, locked, note
    FROM fiscal_year
    WHERE id IN (
      SELECT fiscal_year_id FROM period WHERE id = ?
    );
  `;

  return db.one(sql, periodId);
}

/**
 * @method list
 *
 * @description
 * Returns a list of all fiscal years in the database.
 */
async function list(req, res) {
  const options = req.query;
  const { includePeriods } = options;
  const filters = new FilterParser(options, { tableAlias : 'f' });
  const sql = `
    SELECT f.id, f.enterprise_id, f.number_of_months, f.label, f.start_date, f.end_date,
    f.previous_fiscal_year_id, f.locked, f.created_at, f.updated_at, f.note,
    f.user_id, u.display_name
    FROM fiscal_year AS f
    JOIN user AS u ON u.id = f.user_id
  `;

  const periodsSql = `
    SELECT p.id, p.start_date, p.end_date, p.locked, p.number ,
    CONCAT('TABLE.COLUMNS.DATE_MONTH.',
    UPPER(DATE_FORMAT(p.start_date, "%M"))) AS translate_key,
    CONCAT('balance', number) AS 'balance'
    FROM period p
    WHERE p.fiscal_year_id = ?
    ORDER BY p.number ASC`;

  filters.equals('id');
  filters.equals('locked');
  filters.equals('previous_fiscal_year_id');

  // TODO(@jniles) - refactor this custom ordering logic.  Can it be done on the
  // client?
  let ordering;
  if (req.query.by && req.query.order) {
    const direction = (req.query.order === 'ASC') ? 'ASC' : 'DESC';
    ordering = `ORDER BY ${req.query.by} ${direction}`;
  } else {
    ordering = 'ORDER BY start_date DESC';
  }

  filters.setOrder(ordering);
  const query = filters.applyQuery(sql);
  const parameters = filters.parameters();

  const fiscals = await db.exec(query, parameters);

  if (includePeriods) {
    const periods = await Promise.all(fiscals.map(fiscal => db.exec(periodsSql, fiscal.id)));

    fiscals.forEach((fiscal, index) => {
      fiscal.periods = periods[index];
    });
  }

  res.status(200).json(fiscals);
}

/**
 * @method getFiscalYearByDate
 *
 * @description
 * Returns the fiscal year associated with a given date as well as useful
 * metadata, such as progress through the current fiscal year.
 */
async function getFiscalYearsByDate(req, res) {
  const date = new Date(req.query.date);

  // select the fiscal year, the previous year, and the progress through the given year
  const sql = `
    SELECT p.fiscal_year_id, f.previous_fiscal_year_id, f.start_date, f.end_date, f.label,
      DATEDIFF(DATE(?), f.start_date) / (f.number_of_months * 30.5) AS percentage
    FROM period AS p
    JOIN fiscal_year AS f ON f.id = p.fiscal_year_id
    WHERE p.start_date <= DATE(?) AND DATE(?) <= p.end_date;
  `;

  const rows = await db.exec(sql, [date, date, date]);
  res.status(200).json(rows);
}

// POST /fiscal
// creates a new fiscal year
async function create(req, res) {
  const record = req.body;

  record.user_id = req.session.user.id;
  record.enterprise_id = req.session.enterprise.id;
  record.start_date = formatDateString(record.start_date);
  record.end_date = formatDateString(record.end_date);

  const params = [
    record.enterprise_id, record.previous_fiscal_year_id, record.user_id,
    record.label, record.number_of_months,
    record.start_date, record.end_date, record.note,
  ];

  const transaction = db.transaction();

  const [,, results] = await transaction
    .addQuery('SET @fiscalYearId = 0;')
    .addQuery('CALL CreateFiscalYear(?, ?, ?, ?, ?, DATE(?), DATE(?), ?, @fiscalYearId);', params)
    .addQuery('SELECT @fiscalYearId AS fiscalYearId;')
    .execute();

  // results[2] : is an array from the query SELECT @fiscalYearId AS fiscalYearId;
  res.status(201).json({ id : results[0].fiscalYearId });
}

/**
 * GET /fiscal/:id
 *
 * @description
 * Returns the detail of a single Fiscal Year
 */
async function detail(req, res) {
  const { id } = req.params;

  debug(`#detail() looking up FY${id}.`);

  const record = await lookupFiscalYear(id);
  res.status(200).json(record);

}

/**
 * Updates a fiscal year details (particularly id)
 */
async function update(req, res) {
  const { id } = req.params;
  const sql = 'UPDATE fiscal_year SET ? WHERE id = ?';
  const queryData = req.body;

  if (queryData.start_date && queryData.end_date) {
    queryData.start_date = new Date(queryData.start_date);
    queryData.end_date = new Date(queryData.end_date);
  }

  // remove the id before updating (if the ID exists)
  delete queryData.id;

  debug(`#update() updating column ${Object.keys(queryData)} on FY${id}.`);

  await lookupFiscalYear(id);
  await db.exec(sql, [queryData, id]);
  const fiscalYear = await lookupFiscalYear(id);
  res.status(200).json(fiscalYear);
}

/**
 * Remove a fiscal year details (particularly id)
 */
async function remove(req, res) {
  const { id } = req.params;
  const sqlDelFiscalYear = 'DELETE FROM fiscal_year WHERE id = ?;';
  const sqlDelPeriods = 'DELETE FROM period WHERE fiscal_year_id = ?;';

  debug(`#remove() deleting FY${id}.`);

  const [, fiscalYear] = await db.transaction()
    .addQuery(sqlDelPeriods, [id])
    .addQuery(sqlDelFiscalYear, [id])
    .execute();

  // results[0] is the result for the first query
  // results[1] is the result for the second query
  if (!fiscalYear.affectedRows) {
    throw new NotFound(`Cannot find fiscal year with id: ${id}`);
  }
  res.sendStatus(204);
}

/**
 * Get /fiscal/:id/balance/:period_number
 * @param {number} id the fiscal year id
 * @param {number} period the period number [0,12]
 * The balance for a specified fiscal year and period with all accounts
 * the period must be given
 */
async function getBalance(req, res) {
  const { id } = req.params;
  const period = req.params.period_number || 12;
  debug(`#getBalance() looking up balance for FY${id} and period ${period}.`);

  const rows = await lookupBalance(id, period);
  const tree = new Tree(rows);
  tree.walk(Tree.common.sumOnProperty('debit'), false);
  tree.walk(Tree.common.sumOnProperty('credit'), false);
  const result = tree.toArray();
  res.status(200).json(result);

}

async function getOpeningBalanceRoute(req, res) {
  const { id } = req.params;
  const rows = await getOpeningBalance(id);
  res.status(200).json(rows);

}

async function getEnterpriseFiscalStart(req, res) {
  const { id } = req.params;
  const startDate = await getFirstDateOfFirstFiscalYear(id);
  res.status(200).json(startDate);
}

/**
 * @function lookupBalance
 * @param {number} fiscalYearId fiscal year id
 * @param {number} periodNumber the period number
 */
async function lookupBalance(fiscalYearId, periodNumber) {
  const glb = {};

  const sql = `
    SELECT t.period_id, a.id, a.label,
      SUM(t.debit) AS debit, SUM(t.credit) AS credit, SUM(t.debit - t.credit) AS balance
    FROM period_total AS t
    JOIN account a ON a.id = t.account_id
    JOIN period p ON p.id = t.period_id
    WHERE t.fiscal_year_id = ? AND p.number <= ?
    GROUP BY a.id HAVING balance <> 0;
  `;

  const periodSql = `
    SELECT id FROM period WHERE fiscal_year_id = ? AND number = ?;
  `;

  const periods = await db.exec(periodSql, [fiscalYearId, periodNumber]);
  if (!periods.length) {
    throw new NotFound(`Could not find the period ${periodNumber} for the fiscal year with id ${fiscalYearId}.`);
  }

  [glb.period] = periods;

  glb.existTotalAccount = await db.exec(sql, [fiscalYearId, periodNumber]);

  // for to have an updated data in any time
  const allAccounts = await AccountService.lookupAccount();
  let inlineAccount;

  glb.totalAccount = allAccounts.map((item) => {
    inlineAccount = _.find(glb.existTotalAccount, { id : item.id });

    if (inlineAccount) {
      item.period_id = inlineAccount.period_id;
      item.debit = inlineAccount.balance > 0 ? inlineAccount.balance : 0;
      item.credit = inlineAccount.balance < 0 ? Math.abs(inlineAccount.balance) : 0;
    } else {
      item.period_id = glb.period.id;
      item.debit = 0;
      item.credit = 0;
    }

    return item;
  });

  return glb.totalAccount;
}

/**
 * POST /fiscal/:id/opening_balance
 *
 * @description
 * Set the opening balance for a specified fiscal year
 */
async function setOpeningBalance(req, res) {
  const { id } = req.params;

  const { accounts } = req.body.params;
  const fiscalYear = req.body.params.fiscal;

  debug(`#setOpeningBalance() setting balance for fiscal year ${id}.`);

  // check for previous fiscal year
  const hasPrevious = await hasPreviousFiscalYear(id);
  if (hasPrevious) {
    const msg = `The fiscal year with id ${id} is not the first fiscal year`;
    throw new BadRequest(msg, 'ERRORS.NOT_BEGINING_FISCAL_YEAR');
  }

  // set the opening balance if the fiscal year doesn't have previous fy
  await insertOpeningBalance(fiscalYear, accounts);

  res.sendStatus(201);

}

/**
 * @function hasPreviousFiscalYear
 * @description check if the fiscal year given has a previous one or more
 * @param {number} id current fiscal year id
 * @returns {boolean} true if there is a previous fiscal year
 */
async function hasPreviousFiscalYear(id) {
  const fyID = parseInt(id, 10);

  let sql = 'SELECT previous_fiscal_year_id FROM fiscal_year WHERE id = ?;';
  const fy = await db.one(sql, [fyID], fyID, 'fiscal year');

  if (!fy.previous_fiscal_year_id) { return false; }

  sql = 'SELECT id FROM fiscal_year WHERE id = ?;';
  const previousFiscalYears = await db.exec(sql, [fy.previous_fiscal_year_id]);
  return previousFiscalYears.length > 0;
}

/**
 * @function loadBalanceByPeriodNumber
 *
 * @description
 * This function fetchs the balance for a given fiscal year and periodNumber.
 * Note that hidden accounts are hidden by default.
 */
async function loadBalanceByPeriodNumber(fiscalYearId, periodNumber) {
  const sql = `
    SELECT a.id, a.number, a.label, a.type_id, a.label, a.parent, a.locked, a.hidden,
      IFNULL(s.debit, 0) AS debit, IFNULL(s.credit, 0) AS credit, IFNULL(s.balance, 0) AS balance
    FROM account AS a LEFT JOIN (
      SELECT SUM(pt.debit) AS debit, SUM(pt.credit) AS credit, SUM(pt.debit - pt.credit) AS balance, pt.account_id
      FROM period_total AS pt
      JOIN period AS p ON p.id = pt.period_id
      WHERE pt.fiscal_year_id = ?
        AND p.number = ?
      GROUP BY pt.account_id
    )s ON a.id = s.account_id
    WHERE a.hidden = 0
    ORDER BY CONVERT(a.number, CHAR(8)) ASC;
  `;

  const accounts = await db.exec(sql, [fiscalYearId, periodNumber]);

  return accounts.map(row => {
    row.debit = row.balance > 0 ? row.balance : 0;
    row.credit = row.balance < 0 ? Math.abs(row.balance) : 0;
    return row;
  });
}

/**
 * @function getOpeningBalance
 *
 * @description
 * Load the opening balance of a fiscal year from period 0 of that fiscal year.
 */
function getOpeningBalance(fiscalYearId) {
  return loadBalanceByPeriodNumber(fiscalYearId, 0);
}

/**
 * @function insertOpeningBalance
 */
async function insertOpeningBalance(fiscalYear, accounts) {
  const rows = await lookupPeriod(fiscalYear.id, 0);

  if (!rows.length) {
    const msg = `Could not find the period with fiscal year id ${fiscalYear.id} and period number 0.`;
    throw new NotFound(msg);
  }

  const periodZeroId = rows[0].id;
  const periodTotalData = accounts
    .map(item => formatPeriodTotal(item, fiscalYear, periodZeroId));

  const sql = `
    INSERT INTO period_total
    (enterprise_id, fiscal_year_id, period_id, account_id, credit, debit)
    VALUES
    (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE credit = VALUES(credit), debit = VALUES(debit);
  `;

  return Promise.all(periodTotalData.map(item => db.exec(sql, [
    item.enterprise_id, item.fiscal_year_id, item.period_id,
    item.account_id, item.credit, item.debit,
  ])));
}

/**
 * @function lookupPeriod
 */
function lookupPeriod(fiscalYearId, periodNumber) {
  const sql = 'SELECT id FROM period WHERE fiscal_year_id = ? AND number = ?;';
  return db.exec(sql, [fiscalYearId, periodNumber]);
}

/**
 * @function formatPeriodTotal
 */
function formatPeriodTotal(account, fiscalYear, periodId) {
  return {
    enterprise_id  : fiscalYear.enterprise_id,
    fiscal_year_id : fiscalYear.id,
    period_id      : periodId,
    account_id     : account.id,
    credit         : account.credit,
    debit          : account.debit,
  };
}

/**
 * @method getClosingBalanceRoute
 *
 * @description
 * Returns the closing balance for a fiscal year (http interface)
 *
 * GET fiscal/:id/closing
 */
async function getClosingBalanceRoute(req, res) {
  const { id } = req.params;
  const accounts = await getClosingBalance(id);
  res.status(200).json(accounts);
}

/**
 * @function getClosingBalance
 *
 * @description
 * Returns the closing balance for the fiscal year.
 *
 */
async function getClosingBalance(id) {
  const sql = `
    SELECT id FROM fiscal_year WHERE previous_fiscal_year_id = ?;
  `;

  const year = db.one(sql, [id], id, 'fiscal year');
  return loadBalanceByPeriodNumber(year.id, 0);
}

/**
 * @function closing
 *
 * @description
 * Closes a fiscal year
 */
async function closing(req, res) {
  const { id } = req.params;
  const accountId = req.body.params.account_id;

  await db.transaction()
    .addQuery('CALL CloseFiscalYear(?, ?)', [id, accountId])
    .execute();

  res.status(200).json({ id : parseInt(id, 10) });
}

/**
 * @method getPeriodByFiscal
 *
 * @description
 * This function returns all Fiscal Year's periods for the Fiscal Year provided.
 * If no records are found, it will throw a NotFound error.
 *
 * @param {fiscalYearId}  - Makes it possible to select the different periods of the fiscal year
 * @returns {Promise} - a promise resolving to the periods record
 *
 */
function getPeriodByFiscal(fiscalYearId) {
  const sql = `
    SELECT period.number, period.id, period.start_date,
      period.end_date, period.translate_key, period.year, period.locked
    FROM period
    WHERE period.fiscal_year_id = ?
      AND period.start_date IS NOT NULL
    ORDER BY period.start_date;
  `;

  return db.exec(sql, [fiscalYearId]);
}

/**
 * @method lookupFiscalYearByDate
 *
 * @description
 * This function returns a single record from the fiscal year table matching the
 * date range provided.
 */
function lookupFiscalYearByDate(transDate) {
  const sql = `
    SELECT p.fiscal_year_id, p.id, f.locked, f.note, f.label
    FROM period AS p
    JOIN fiscal_year AS f ON f.id = p.fiscal_year_id
    WHERE DATE(p.start_date) <= DATE(?) AND DATE(p.end_date) >= DATE(?);
  `;

  return db.one(sql, [transDate, transDate], transDate, 'fiscal year');
}

/**
 * @function getFirstDateOfFirstFiscalYear
 *
 * @description
 * returns the start date of the very first fiscal year for the provided
 * enterprise.
 */
function getFirstDateOfFirstFiscalYear(enterpriseId) {
  const sql = `
    SELECT start_date FROM fiscal_year
    WHERE enterprise_id = ?
    ORDER BY DATE(start_date)
    LIMIT 1;
  `;

  return db.one(sql, enterpriseId);
}

/**
 * @method getNumberOfFiscalYears
 *
 * @description
 * This function returns the number of fiscal years between two dates.
 *
 * FIXME(@jniles) - should this not include the enterprise id?
 */
function getNumberOfFiscalYears(dateFrom, dateTo) {
  const sql = `
    SELECT COUNT(id) AS fiscalYearSpan FROM fiscal_year
    WHERE start_date >= DATE(?) AND end_date <= DATE(?)
  `;

  return db.one(sql, [dateFrom, dateTo]);
}

function getPeriodsFromDateRange(dateFrom, dateTo) {
  const query = `
    SELECT id, number, start_date, end_date
    FROM period WHERE (DATE(start_date) >= DATE(?) AND DATE(end_date) <= DATE(?))
      OR (DATE(?) BETWEEN DATE(start_date) AND DATE(end_date))
      OR (DATE(?) BETWEEN DATE(start_date) AND DATE(end_date));`;
  return db.exec(query, [dateFrom, dateTo, dateFrom, dateTo]);
}

function getDateRangeFromPeriods(periods) {
  const sql = `
    SELECT
      MIN(start_date) AS dateFrom, MAX(end_date) AS dateTo
    FROM
      period
    WHERE
      period.id IN (?, ?)`;

  return db.one(sql, [periods.periodFrom, periods.periodTo]);
}

/**
 * @function getPeriods
 *
 * @description
 * HTTP interface to getting periods by fiscal year id.
 */
async function getPeriods(req, res) {
  const periods = await getPeriodByFiscal(req.params.id);
  res.status(200).json(periods);
}

/**
 * Get the "zero" period for the fiscal year (where period.number = 0)
 */
async function getPeriodZero(req, res) {
  const fiscalYearId = req.params.id;
  const sql = 'SELECT id FROM period WHERE period.number = 0 AND period.fiscal_year_id = ?';
  const resPeriodZero = await db.one(sql, [fiscalYearId]);
  res.status(200).json(resPeriodZero);
}

/**
 * return a query for retrieving account'balance by type_id and periods
 * In general in accounting the balance is obtained by making debit - credit
 */
function getAccountBalancesByTypeId(rate = 1) {
  return `
    SELECT ac.id, ac.number, ac.label, ac.parent, (IFNULL(s.amount, 0)*${rate}) AS amount, s.type_id
    FROM account as ac
    LEFT JOIN (
      SELECT SUM(pt.debit - pt.credit) as amount, pt.account_id, act.id as type_id
      FROM period_total as pt
      JOIN account as a ON a.id = pt.account_id
      JOIN account_type as act ON act.id = a.type_id
      JOIN period as p ON  p.id = pt.period_id
      JOIN fiscal_year as fy ON fy.id = p.fiscal_year_id
      WHERE fy.id = ? AND
        pt.period_id IN (
          SELECT id FROM period WHERE start_date>= ? AND end_date<= ?
        )
        AND act.id = ?
      GROUP BY pt.account_id
    ) s ON ac.id = s.account_id
    WHERE ac.locked = 0
    ORDER BY ac.number
  `;
}
