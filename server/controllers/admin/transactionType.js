/**
 * @overview Transaction Type Controller
 *
 * @description
 * This controller provides bindings for CRUD operations on the transaction type
 * database table.  Transaction types are tied to each transaction, providing
 * additional information about the purpose of the transaction (such as a cash
 * payment, reimbursement, reversal, etc).  Some transaction types are required
 * by the system and denoted by having "fixed" set to "true".
 */

const db = require('../../lib/db');
const BadRequest = require('../../lib/errors/BadRequest');

exports.list = list;
exports.detail = detail;
exports.create = create;
exports.update = update;
exports.remove = remove;

/**
 * @function list
 *
 * @description
 * List all transaction types
 */
function list(req, res, next) {
  getTransactionType()
    .then(rows => res.status(200).json(rows))
    .catch(next);

}

/**
 * @function detail
 *
 * @description
 * Find a single transaction type by its ID.
 */
function detail(req, res, next) {
  getTransactionType(req.params.id)
    .then(rows => res.status(200).json(rows[0]))
    .catch(next);

}

/**
 * @function create
 *
 * @description
 * Creates a new transaction type.
 */
function create(req, res, next) {
  const sql = `INSERT INTO transaction_type SET ?`;

  db.exec(sql, [req.body])
    .then(rows => {
      res.status(201).json({ id : rows.insertId });
    })
    .catch(next);

}

/**
 * @function update
 *
 * @description
 * Updates a transaction type.
 */
function update(req, res, next) {
  const sql = `UPDATE transaction_type SET ? WHERE id = ? AND fixed <> 1`;

  delete req.body.fixed;
  db.exec(sql, [req.body, req.params.id])
    .then(rows => {
      if (!rows.affectedRows) {
        throw new BadRequest('ERRORS.NOT_ALLOWED');
      }
      return getTransactionType(req.params.id);
    })
    .then(rows => res.status(200).json(rows))
    .catch(next);

}

/**
 * @function remove
 *
 * @description
 * Deletes a transaction type by id.  Note that "fixed" transaction types are
 * not considered.
 */
function remove(req, res, next) {
  const sql = `DELETE FROM transaction_type WHERE id = ? AND fixed <> 1`;

  db.exec(sql, [req.params.id])
    .then(() => res.sendStatus(204))
    .catch(next);

}

/**
 * @function getTransactionType
 *
 * @description
 * This function recuperates the list of transaction types, optionally
 * filtered by id.
 */
function getTransactionType(id) {
  const sql = `
    SELECT id, text, type, fixed
    FROM transaction_type ${id ? ' WHERE id = ?' : ''};
  `;

  return db.exec(sql, [id]);
}
