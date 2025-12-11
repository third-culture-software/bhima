/**
 * @overview AccountReference
 *
 * @description
 * Implements CRUD operations on the account_reference entity.
 *
 * This module implements the following routes:
 *  GET    /accounts/references
 *  GET    /accounts/references/:id
 *  POST   /accounts/references
 *  PUT    /accounts/references/:id
 *  DELETE /accounts/references/:id
 *
 * @requires db
 * @requires util
 * @requires FilterParser
 * @requires lodash
 */
const _ = require('lodash');
const util = require('../../../lib/util');
const db = require('../../../lib/db');
const FilterParser = require('../../../lib/filter');
const i18n = require('../../../lib/helpers/translate');

const compute = require('./references.compute');

/**
 * @method detail
 *
 * @description
 * Retrieves a single account reference item from the database
 *
 * GET /accounts/references/:id
 */
async function detail(req, res) {
  const row = await lookupAccountReference(req.params.id);
  res.status(200).json(row);
}

/**
 * @method list
 *
 * @description
 * Lists all recorded account reference entities.
 *
 * GET /accounts/references
 */
async function list(req, res) {
  const params = req.query;

  // i18n(options.lang)(Stock.fluxLabel[key]),

  const filters = new FilterParser(params, { tableAlias : 'ar' });

  const except = i18n(params.lang)('ACCOUNT.EXCEPT');

  const sql = `
    SELECT
      ar.id, ar.abbr, ar.description, ar.parent, ar.is_amo_dep, ar.reference_type_id,
      arp.abbr AS parent_abbr,
      GROUP_CONCAT(IF(ari.is_exception = 0, a.number, CONCAT('(${except} ', a.number, ')')) SEPARATOR ', ') AS accounts,
      art.label AS account_reference_type_label,
      cc.label AS cost_center
    FROM account_reference ar
      LEFT JOIN account_reference AS arp ON arp.id = ar.parent
      LEFT JOIN account_reference_item AS ari ON ari.account_reference_id = ar.id
      LEFT JOIN account AS a ON a.id = ari.account_id
      LEFT JOIN account_reference_type AS art ON art.id = ar.reference_type_id
      LEFT JOIN reference_cost_center AS rcc ON rcc.account_reference_id = ar.id
      LEFT JOIN cost_center AS cc ON cc.id = rcc.cost_center_id
  `;

  filters.fullText('description');
  filters.equals('abbr');
  filters.equals('reference_type_id');
  filters.equals('is_exception', 'is_exception', 'ari');
  filters.custom('number', `a.number LIKE '${params.number}%'`);

  filters.setGroup('GROUP BY ar.id');
  filters.setOrder('ORDER BY ar.abbr');

  // applies filters and limits to defined sql, get parameters in correct order
  const query = filters.applyQuery(sql);
  const parameters = filters.parameters();

  const rows = await db.exec(query, parameters);
  res.status(200).json(rows);
}

/**
 * @method create
 *
 * @description
 * Create a new account reference entity.
 *
 * POST /accounts/references
 */
async function create(req, res) {
  const record = req.body;
  const {
    accounts, accountsException,
  } = record;

  const transaction = db.transaction();
  const sql = 'INSERT INTO account_reference SET ?;';
  const sqlItems = 'INSERT INTO account_reference_item SET ?;';

  record.is_amo_dep = record.is_amo_dep ? 1 : 0;

  const params = _.omit(record, ['id', 'accounts', 'accountsException']);
  const result = await db.exec(sql, [params]);

  const accountReferenceId = result.insertId;

  accounts.forEach(accountId => {
    const parameters = {
      account_reference_id : accountReferenceId,
      account_id : accountId,
      is_exception : 0,
    };

    transaction.addQuery(sqlItems, [parameters]);
  });

  accountsException.forEach(accountId => {
    const parameters = {
      account_reference_id : accountReferenceId,
      account_id : accountId,
      is_exception : 1,
    };

    transaction.addQuery(sqlItems, [parameters]);
  });

  await transaction.execute();
  res.status(201).json({ id : accountReferenceId });
}

/**
 * @method update
 *
 * @description
 * Updates an account reference's properties.
 *
 * PUT /accounts/references/:id
 */
async function update(req, res) {
  const record = req.body;
  const {
    accounts, accountsException,
  } = record;
  const { id } = req.params;

  const transaction = db.transaction();
  const sql = 'UPDATE account_reference SET ? WHERE id = ?';
  const sqlItems = 'INSERT INTO account_reference_item SET ?;';

  record.is_amo_dep = record.is_amo_dep ? 1 : 0;

  delete record.id;
  delete record.accounts;
  delete record.accountsException;

  await lookupAccountReference(id);
  await db.exec(sql, [record, id]);

  transaction.addQuery('DELETE FROM account_reference_item WHERE account_reference_id = ?;', [id]);

  // accounts to use
  accounts.forEach(accountId => {
    const parameters = {
      account_reference_id : id,
      account_id : accountId,
      is_exception : 0,
    };

    transaction.addQuery(sqlItems, [parameters]);
  });

  // accounts to skip
  accountsException.forEach(accountId => {
    const parameters = { account_reference_id : id, account_id : accountId, is_exception : 1 };
    transaction.addQuery(sqlItems, [parameters]);
  });

  await transaction.execute();

  const accountReference = await lookupAccountReference(id);
  res.status(200).json(accountReference);
}

/**
 * @method remove
*
 * @description
 * Deletes an account reference from the database
 *
 * DELETE /accounts/references/:id
 */
async function remove(req, res) {
  const transaction = db.transaction();
  const { id } = req.params;
  const sql = 'DELETE FROM account_reference WHERE id = ?';
  const sqlItems = 'DELETE FROM account_reference_item WHERE account_reference_id = ?';

  await lookupAccountReference(id);

  transaction.addQuery(sqlItems, [id]);
  transaction.addQuery(sql, [id]);
  await transaction.execute();
  res.sendStatus(204);
}

/**
 * GET /accounts/references/values/:periodId
 *
 * @method getAllValues
 */
async function getAllValues(req, res) {
  const params = util.convertStringToNumber(req.params);
  const rows = await compute.computeAllAccountReference(params.periodId);
  res.status(200).json(rows);
}

/**
 * GET /accounts/references/values/:periodId/:abbr/:isAmoDep?
 *
 * @method getValue
 */
async function getValue(req, res) {
  const params = util.convertStringToNumber(req.params);
  const rows = await compute.computeSingleAccountReference(params.abbr, params.isAmoDep || 0, params.periodId);
  res.status(200).json(rows);
}

/**
 * @method lookupAccountReference
 *
 * @description
 * Retrieves an account reference by id.  If none matches, throws a NotFound error.
 *
 * @param {Number} id - the id of the account reference
 * @returns {Promise} - a promise resolving to the result of the database.
 */
async function lookupAccountReference(id) {
  const sql = `
    SELECT id, abbr, description, parent, is_amo_dep, reference_type_id
    FROM account_reference WHERE id = ?;
  `;

  const sqlItems = `
    SELECT account_id FROM account_reference_item WHERE account_reference_id = ? AND is_exception = 0;`;

  const sqlExceptItems = `
    SELECT account_id FROM account_reference_item WHERE account_reference_id = ? AND is_exception = 1;`;

  const reference = await db.one(sql, id);

  const [accounts, accountsException] = await Promise.all([
    db.exec(sqlItems, [id]),
    db.exec(sqlExceptItems, [id]),
  ]);

  Object.assign(reference, {
    accounts : _.flatMap(accounts, 'account_id'),
    accountsException : _.flatMap(accountsException, 'account_id'),
  });

  return reference;
}

/**
 * @function getAccountsForReferenceHTTP
 *
 * @description
 * HTTP interface to compute the accounts associated with a particular reference.
 */
async function getAccountsForReferenceHTTP(req, res) {
  const { id } = req.params;
  const accounts = await compute.getAccountsForReference(id);
  res.status(200).json(accounts);
}

exports.list = list;
exports.create = create;
exports.update = update;
exports.remove = remove;
exports.detail = detail;
exports.getAllValues = getAllValues;
exports.getValue = getValue;
exports.getAccountsForReferenceHTTP = getAccountsForReferenceHTTP;

// expose computations for values
exports.getAccountsForReference = compute.getAccountsForReference;
exports.computeSingleAccountReference = compute.computeSingleAccountReference;
exports.getValueForReference = compute.getValueForReference;
exports.computeAllAccountReference = compute.computeAllAccountReference;
