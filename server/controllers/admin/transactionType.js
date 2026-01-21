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
async function list(req, res) {
  const rows = await getTransactionType();
  res.status(200).json(rows);
}

/**
 * @function detail
 *
 * @description
 * Find a single transaction type by its ID.
 */
async function detail(req, res) {
  const rows = await getTransactionType(req.params.id);
  res.status(200).json(rows[0]);
}

/**
 * @function create
 *
 * @description
 * Creates a new transaction type.
 */
async function create(req, res) {
  const sql = `INSERT INTO transaction_type SET ?`;

  const rows = await db.exec(sql, [req.body]);
  res.status(201).json({ id : rows.insertId });
}

/**
 * @function update
 *
 * @description
 * Updates a transaction type.
 */
async function update(req, res) {
  const sql = `UPDATE transaction_type SET ? WHERE id = ? AND fixed <> 1`;

  delete req.body.fixed;
  const rows = await db.exec(sql, [req.body, req.params.id]);
  if (!rows.affectedRows) {
    throw new BadRequest('ERRORS.NOT_ALLOWED');
  }
  const results = await getTransactionType(req.params.id);
  res.status(200).json(results);
}

/**
 * @function remove
 *
 * @description
 * Deletes a transaction type by id.  Note that "fixed" transaction types are
 * not considered.
 */
async function remove(req, res) {
  const sql = `DELETE FROM transaction_type WHERE id = ? AND fixed <> 1`;

  await db.exec(sql, [req.params.id]);
  res.sendStatus(204);
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
