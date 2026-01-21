/**
 * @overview AccountType
 *
 * @description
 * Implements CRUD operations on the account_type entity.
 *
 * This module implements the following routes:
 *  GET    /accounts/types
 *  GET    /accounts/types/:id
 *  POST   /accounts/types
 *  PUT    /accounts/types/:id
 *  DELETE /accounts/types/:id
 *
 * @requires db
 * @requires NotFound
 */

const db = require('../../../lib/db');

/**
 * @method detail
 *
 * @description
 * Retrieves a single account type item from the database
 *
 * GET /accounts/types/:id
 */
async function detail(req, res) {
  const row = await lookupAccountType(req.params.id);
  res.status(200).json(row);
}

/**
 * @method list
 *
 * @description
 * Lists all recorded account type entities.
 *
 * GET /accounts/types
 */
async function list(req, res) {
  const sql = 'SELECT `id`, `type`, `translation_key` FROM account_type;';

  const rows = await db.exec(sql);
  res.status(200).json(rows);
}

/**
 * @method create
 *
 * @description
 * Create a new account type entity.
 *
 * POST /accounts/types
 */
async function create(req, res) {
  const record = req.body;
  const sql = 'INSERT INTO account_type SET ?';

  delete record.id;

  /**
   * @todo
   * design/ update account types to allow setting a translation_key
   * - the implications of this are system wide
   */
  record.translation_key = '';

  const result = await db.exec(sql, [record]);
  res.status(201).json({ id : result.insertId });
}

/**
 * @method update
 *
 * @description
 * Updates an account type's properties.
 *
 * PUT /accounts/types/:id
 */
async function update(req, res) {
  const data = req.body;
  const { id } = req.params;
  const sql = 'UPDATE account_type SET ? WHERE id = ?';

  delete data.id;

  await lookupAccountType(id);
  await db.exec(sql, [data, id]);
  const accountType = await lookupAccountType(id);
  res.status(200).json(accountType);
}

/**
 * @method remove
 *
 * @description
 * Deletes an account type from the database
 *
 * DELETE /accounts/types/:id
 */
async function remove(req, res) {
  const { id } = req.params;
  const sql = 'DELETE FROM account_type WHERE id = ?';

  await lookupAccountType(id);
  await db.exec(sql, [id]);
  res.sendStatus(204);
}

/**
 * @method lookupAccountType
 *
 * @description
 * Retrieves an account type by id.  If none matches, throws a NotFound error.
 *
 * @param {Number} id - the id of the account type
 * @returns {Promise} - a promise resolving to the result of the database.
 */
function lookupAccountType(id) {
  const sql = 'SELECT at.id, at.type FROM account_type AS at WHERE at.id = ?;';

  return db.one(sql, id);
}

exports.list = list;
exports.create = create;
exports.update = update;
exports.remove = remove;
exports.detail = detail;
