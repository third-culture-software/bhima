/**
 * @overview AccountCategory
 *
 * @description
 * Implements CRUD operations on the account_category entity.
 *
 * This module implements the following routes:
 *  GET    /accounts/categories
 *  GET    /accounts/categories/:id
 *  POST   /accounts/categories
 *  PUT    /accounts/categories/:id
 *  DELETE /accounts/categories/:id
 *
 * @requires db
 * @requires NotFound
 */

const db = require('../../../lib/db');

/**
 * @method detail
 *
 * @description
 * Retrieves a single account category item from the database
 *
 * GET /accounts/categories/:id
 */
async function detail(req, res) {
  const row = await lookupAccountCategory(req.params.id);
  res.status(200).json(row);
}

/**
 * @method list
 *
 * @description
 * Lists all recorded account category entities.
 *
 * GET /accounts/categories
 */
async function list(req, res) {
  const sql = `
    SELECT id, category, translation_key
    FROM account_category;
  `;

  const rows = await db.exec(sql);
  res.status(200).json(rows);
}

/**
 * @method create
 *
 * @description
 * Create a new account category entity.
 *
 * POST /accounts/categories
 */
async function create(req, res) {
  const record = req.body;
  const sql = 'INSERT INTO account_category SET ?';

  delete record.id;

  /**
   * @todo
   * design/ update account categories to allow setting a translation_key
   * - the implications of this are system wide
   * */
  record.translation_key = '';

  const result = await db.exec(sql, [record]);
  res.status(201).json({ id : result.insertId });
}

/**
 * @method update
 *
 * @description
 * Updates an account category's properties.
 *
 * PUT /accounts/categories/:id
 */
async function update(req, res) {
  const data = req.body;
  const { id } = req.params;
  const sql = 'UPDATE account_category SET ? WHERE id = ?';

  delete data.id;

  await lookupAccountCategory(id);
  await db.exec(sql, [data, id]);
  const accountCategory = await lookupAccountCategory(id);
  res.status(200).json(accountCategory);
}

/**
 * @method remove
 *
 * @description
 * Deletes an account category from the database
 *
 * DELETE /accounts/categories/:id
 */
async function remove(req, res) {
  const { id } = req.params;
  const sql = 'DELETE FROM account_category WHERE id = ?';

  await lookupAccountCategory(id);
  await db.exec(sql, [id]);
  res.sendStatus(204);
}

/**
 * @method lookupAccountCategory
 *
 * @description
 * Retrieves an account category by id.  If none matches, throws a NotFound error.
 *
 * @param {Number} id - the id of the account category
 * @returns {Promise} - a promise resolving to the result of the database.
 */
function lookupAccountCategory(id) {
  const sql = 'SELECT ac.id, ac.category FROM account_category AS ac WHERE ac.id = ?;';
  return db.one(sql, id);
}

exports.list = list;
exports.create = create;
exports.update = update;
exports.remove = remove;
exports.detail = detail;
