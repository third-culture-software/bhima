/**
 * @module Accounts
 *
 * @description
 * Implements CRUD operations on the Account entity.
 *
 * This module implements the following routes:
 *  GET    /accounts
 *  GET    /accounts/:id
 *  GET    /accounts/:id/balance/
 *  POST   /accounts
 *  PUT    /accounts/:id
 *  DELETE /accounts/:id
 *
 * @todo - move away from calling lookup() before action.  This is an
 * unnecessary database request.
 *
 * @requires lib/db
 * @requires lib/errors/NotFound
 * @requires lib/errors/BadRequest
 * @requires accounts/types
 * @requires accounts/categories
 * @requires lib/periods
 * @requires accounts
 */

const debug = require('debug')('accounts');
const db = require('../../../lib/db');
const { NotFound, BadRequest } = require('../../../lib/errors');
const types = require('./types');
const categories = require('./categories');
const references = require('./references');
const importing = require('./import');
const Periods = require('../../../lib/period');
const AccountExtras = require('./extra');
const Fiscal = require('../fiscal');
const FilterParser = require('../../../lib/filter');
const utility = require('./utility');

/**
 * @method create
 *
 * @description
 * Create a new account entity in the database.
 *
 * POST /accounts
 */
function create(req, res, next) {
  const data = req.body;
  const sql = 'INSERT INTO account SET ?';

  delete data.id;
  delete data.type;

  data.enterprise_id = req.session.enterprise.id;

  db.exec(sql, [data])
    .then(result => {
      res.status(201).json({ id : result.insertId });
    })
    .catch(next);

}

/**
 * @function lookupCostCenterByAccountId
 *
 * @description
 * Retrieves a cost center by account id.
 */
async function lookupCostCenterByAccountId(id) {
  const { cc } = await db.one('SELECT GetCostCenterByAccountId(?) AS cc;', [id]);
  return cc;
}

async function lookupCostCenter(req, res, next) {
  try {
    const id = await lookupCostCenterByAccountId(req.params.id);
    res.status(200).json({ id });
  } catch (e) {
    next(e);
  }
}

/**
 * @method update
 *
 * @description
 * Updates an account in the database.
 *
 * PUT /accounts/:id
 */
function update(req, res, next) {
  const { id } = req.params;
  const data = req.body;
  const sql = 'UPDATE account SET ? WHERE id = ?';

  delete data.id;

  utility.lookupAccount(id)
    .then(() => db.exec(sql, [data, id]))
    .then(() => utility.lookupAccount(id))
    .then((account) => {
      res.status(200).json(account);
    })
    .catch(next);

}

/**
 * @method remove
 *
 * @description
 * Removes an account in the database.
 *
 * DELETE /accounts/:id
 */
function remove(req, res, next) {
  const sql = `SELECT COUNT(id) AS children FROM account WHERE parent = ?;`;
  db.exec(sql, [req.params.id])
    .then((rows) => {
      if (rows[0].children > 0) {
        throw new BadRequest(`
          Could not delete account with id: ${req.params.id}. This account contains child accounts.
        `);
      }

      const sqlDelete = 'DELETE FROM account WHERE id = ?;';
      return db.exec(sqlDelete, [req.params.id]);
    })
    .then(result => {
      if (!result.affectedRows) {
        throw new NotFound(`Could not find an account with id ${req.params.id}.`);
      }

      res.sendStatus(204);
    })
    .catch(next);

}

/**
 * @method list
 *
 * @description
 * Lists all accounts in the database.
 *
 * GET /accounts
 */
function list(req, res, next) {
  const filters = new FilterParser(req.query, { tableAlias : 'a' });

  let sql = `
    SELECT a.id, a.number, a.label, a.locked, a.type_id, a.parent, a.locked, a.hidden FROM account AS a
  `;

  if (req.query.detailed === '1') {
    sql = `
      SELECT a.id, a.enterprise_id, a.locked, a.created, a.reference_id, a.number,
        a.label, a.parent, a.type_id, at.type, at.translation_key, a.hidden,
        a.cost_center_id, cc.label AS cost_center_label
      FROM account AS a
      JOIN account_type AS at ON a.type_id = at.id
      LEFT JOIN cost_center AS cc ON a.cost_center_id = cc.id
    `;
  }

  filters.equals('type_id', 'type_id', 'a', true);
  filters.equals('locked');
  filters.equals('hidden');
  filters.equals('number');

  filters.setOrder('ORDER BY a.number');

  // applies filters and limits to defined sql, get parameters in correct order
  const query = filters.applyQuery(sql);
  const parameters = filters.parameters();

  db.exec(query, parameters)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next);

}

/**
 * @method detail
 *
 * @description
 * Retrieves the details of a single account from the database by its id.
 *
 * GET /accounts/:id
 */
function detail(req, res, next) {
  utility.lookupAccount(req.params.id)
    .then((account) => {
      res.status(200).json(account);
    })
    .catch(next);

}

/**
 * @method getBalance
 *
 * @description
 * Returns the current balance of an account by query the entire freakin'
 * posting journal.
 *
 * @todo - use period totals
 *
 * GET /accounts/:id/balance
 */
function getBalance(req, res, next) {
  const { id } = req.params;
  let optional = '';
  const params = [id];

  // include the posting journal with a switch
  if (req.query.journal === '1') {
    optional = `
      UNION ALL
        SELECT pj.account_id, IFNULL(SUM(pj.debit), 0) AS debit,
        IFNULL(SUM(pj.credit), 0) AS credit, IFNULL((pj.debit - pj.credit), 0) AS balance
      FROM posting_journal AS pj
      WHERE pj.account_id = ? GROUP BY pj.account_id
    `;
    params.push(id);
  }

  const sql = `
    SELECT t.account_id, IFNULL(SUM(t.debit), 0) AS debit, IFNULL(SUM(t.credit), 0) AS credit,
      IFNULL(t.balance, 0) AS balance
    FROM (
      SELECT gl.account_id, IFNULL(SUM(gl.debit), 0) AS debit,
        IFNULL(SUM(gl.credit), 0) AS credit,
        IFNULL((gl.debit - gl.credit), 0) AS balance
      FROM general_ledger AS gl
      WHERE gl.account_id = ? GROUP BY gl.account_id ${optional}
    ) AS t GROUP BY t.account_id;
  `;

  utility.lookupAccount(id)
    .then(() => db.exec(sql, params))
    .then((rows) => {
      const response = (rows.length === 0)
        ? {
          account_id : id, debit : 0, credit : 0, balance : 0,
        }
        : rows[0];

      res.status(200).json(response);
    })
    .catch(next);

}

/**
 * @method getAnnualBalance
 *
 * GET /accounts/:id/balance/:fiscalYearId
 */
function getAnnualBalance(req, res, next) {
  const { id, fiscalYearId } = req.params;

  const query = `
    SELECT
      pt.account_id,
      IFNULL(SUM(pt.debit), 0) AS debit,
      IFNULL(SUM(pt.credit), 0) AS credit,
      IFNULL(SUM(pt.debit - pt.credit), 0) AS balance
    FROM period_total pt
    WHERE pt.account_id = ? AND pt.fiscal_year_id = ?
    GROUP BY pt.account_id;
  `;
  utility.lookupAccount(id)
    .then(() => db.exec(query, [id, fiscalYearId]))
    .then((rows) => {
      const response = (rows.length === 0)
        ? {
          account_id : id, debit : 0, credit : 0, balance : 0,
        }
        : rows[0];

      res.status(200).json(response);
    })
    .catch(next);

}

/**
 * Get the account balances of all accounts for a fiscal year
 *
 * GET /accounts/:fiscalYearId/all_balances
 *
 * WARNING: This API uses the period_total table.  It is necessary
 * to update the period_total table before calling this function by
 * using the zRecalculatePeriodTotals() SQL procedure.
 *
 * @param {object} req - the request object
 * @param {object} res - the response object
 * @param {object} next - next middleware object to pass control to
 * @returns {Array} an array of the account balances for all accounts
 */
function getAllAnnualBalances(req, res, next) {
  const { fiscalYearId } = req.params;

  const query = `
    SELECT
      pt.account_id, a.number, a.label, a.type_id, at.type,
      IFNULL(SUM(pt.debit), 0) AS debit,
      IFNULL(SUM(pt.credit), 0) AS credit,
      IFNULL(SUM(pt.debit - pt.credit), 0) AS balance
    FROM period_total pt
    JOIN account AS a ON a.id = pt.account_id
    JOIN account_type AS at ON at.id = a.type_id
    WHERE pt.fiscal_year_id = ?
    GROUP BY pt.account_id
    ORDER BY pt.account_id;
  `;
  return db.exec(query, [fiscalYearId])
    .then(rows => {
      res.status(200).json(rows);
    })
    .catch(next);

}

/**
 * @function getOpeningBalanceForPeriod
 *
 * @description
 * Computes the opening balance for an account based on the default period range
 * provided by default filters.  This is useful for registries.  If you know
 * what the date key is, it is better to call getOpeningBalanceForDate() from
 * the AccountExtras directly with the account id and date.
 */
function getOpeningBalanceForPeriod(req, res, next) {
  const period = new Periods(req.query.client_timestamp);
  const targetPeriod = period.lookupPeriod(req.query.period);
  const accountId = req.params.id;

  debug(
    '#getOpeningBalanceForPeriod() finding opening balance for account %s on  period %s',
    accountId,
    req.query.period,
  );

  let promise = Promise.resolve();

  switch (targetPeriod) {
  case period.periods.allTime:
    debug('#getOpeningBalanceForPeriod() all time period detected.  Using first fiscal year start date.');
    promise = promise
      .then(() => Fiscal.getFirstDateOfFirstFiscalYear(req.session.enterprise.id))
      .then(fiscal => fiscal.start_date);
    break;

  case period.periods.custom:
    debug('#getOpeningBalanceForPeriod() custom period detected.  Using custom_period_start key.');
    promise = promise
      .then(() => new Date(req.query.custom_period_start));
    break;

  default:
    debug('#getOpeningBalanceForPeriod() %s period detected.  Using computed start date.', req.query.period);
    promise = promise
      .then(() => targetPeriod.limit.start());
    break;
  }

  promise
    .then(date => {
      debug(`#getOpeningBalanceForPeriod() computed ${date} for start date.`);
      return AccountExtras.getOpeningBalanceForDate(accountId, new Date(date));
    })
    .then(balances => {
      debug('#getOpeningBalanceForPeriod() computed %j balances for account id %s.', balances, accountId);
      res.status(200).json(balances);
    })
    .catch(next);

}

/**
 * @method processAccountDepth
 * @description get the depth of an account
 * @param {array} accounts list of accounts
 * @return {array} accounts the updated list of accounts with depths
 */
function processAccountDepth(accounts) {
  // root node
  const ROOT_NODE = 0;

  // build the account tree
  const tree = getChildren(accounts, ROOT_NODE);

  // return a flattened tree (in order)
  const processedAccounts = flatten(tree);

  // remove the children property after flattening to avoid recursive references
  processedAccounts.forEach(account => delete account.children);

  return processedAccounts;
}

/**
 * @function getChildren
 * @description return the children accounts of an account given
 * @param {array} accounts list of accounts
 * @param {number} parentId The parent id
 */
function getChildren(accounts, parentId) {
  if (accounts.length === 0) { return null; }

  const children = accounts.filter(account => account.parent === parentId);

  children.forEach(account => {
    account.children = getChildren(accounts, account.id);
  });

  return children;
}

/**
 * @function flatten
 * @description return a flatten array
 * @param {array} tree list of accounts as tree
 * @param {number} depth A depth
 */
function flatten(tree, depth) {
  let currentDepth = Number.isNaN(depth) ? -1 : depth;
  currentDepth += 1;

  return tree.reduce((array, node) => {
    node.depth = currentDepth;
    const items = [node].concat(node.children ? flatten(node.children, currentDepth) : []);
    return array.concat(items);
  }, []);
}

exports.list = list;
exports.create = create;
exports.update = update;
exports.detail = detail;
exports.getBalance = getBalance;
exports.types = types;
exports.lookupAccount = utility.lookupAccount;
exports.processAccountDepth = processAccountDepth;
exports.list = list;
exports.remove = remove;
exports.getOpeningBalanceForPeriod = getOpeningBalanceForPeriod;
exports.categories = categories;
exports.references = references;
exports.processAccountDepth = processAccountDepth;
exports.importing = importing;
exports.lookupCostCenter = lookupCostCenter;
exports.getAnnualBalance = getAnnualBalance;
exports.getAllAnnualBalances = getAllAnnualBalances;
