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
function detail(req, res, next) {
  lookupAccountCategory(req.params.id)
    .then((row) => {
      res.status(200).json(row);
    })
    .catch(next);

}

/**
 * @method list
 *
 * @description
 * Lists all recorded account category entities.
 *
 * GET /accounts/categories
 */
function list(req, res, next) {
  const sql = `
    SELECT id, category, translation_key
    FROM account_category;
  `;

  db.exec(sql)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next);

}

/**
 * @method create
 *
 * @description
 * Create a new account category entity.
 *
 * POST /accounts/categories
 */
function create(req, res, next) {
  const record = req.body;
  const sql = 'INSERT INTO account_category SET ?';

  delete record.id;

  /**
   * @todo
   * design/ update account categories to allow setting a translation_key
   * - the implications of this are system wide
   * */
  record.translation_key = '';

  db.exec(sql, [record])
    .then((result) => {
      res.status(201).json({ id : result.insertId });
    })
    .catch(next);

}

/**
 * @method update
 *
 * @description
 * Updates an account category's properties.
 *
 * PUT /accounts/categories/:id
 */
function update(req, res, next) {
  const data = req.body;
  const { id } = req.params;
  const sql = 'UPDATE account_category SET ? WHERE id = ?';

  delete data.id;

  lookupAccountCategory(id)
    .then(() => db.exec(sql, [data, id]))
    .then(() => lookupAccountCategory(id))
    .then((accountCategory) => {
      res.status(200).json(accountCategory);
    })
    .catch(next);

}

/**
 * @method remove
 *
 * @description
 * Deletes an account category from the database
 *
 * DELETE /accounts/categories/:id
 */
function remove(req, res, next) {
  const { id } = req.params;
  const sql = 'DELETE FROM account_category WHERE id = ?';

  lookupAccountCategory(id)
    .then(() => {
      return db.exec(sql, [id]);
    })
    .then(() => {
      res.sendStatus(204);
    })
    .catch(next);

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
