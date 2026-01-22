/**
 * The /invoicing_fee API module
 *
 * @module controllers/finance/invoicingFees
 *
 * @description This module is responsible for CRUD operations on the invoicing_fee
 * table.  A invoicing_fee increases a patient's invoice by a set percentage
 * of the total invoice amount.
 *
 * @requires lib/db
 * @requires lib/errors/BadRequest
 *
 */
const db = require('../../lib/db');
const BadRequest = require('../../lib/errors/BadRequest');

/**
 * Looks up an invoicing fee by id.
 *
 * @param {Number} id - the invoicing fee id
 * @returns {Promise} invoicingFee - a promise resolvinng to the billing
 * service entity.
 */
function lookupInvoicingFee(id) {
  const sql = `SELECT bs.id, bs.account_id, bs.label, bs.description, bs.value,
      bs.created_at, bs.updated_at, a.number
    FROM invoicing_fee AS bs JOIN account AS a ON bs.account_id = a.id
    WHERE bs.id = ?;`;

  return db.one(sql, [id]);
}

/**
 * GET /invoicing_fees/:id
 *
 * @description retrieve the details of a single invoicing fee.
 */
exports.detail = async function detail(req, res) {
  // looks up the invoicing fee by ID
  const invoicingFee = await lookupInvoicingFee(req.params.id);
  res.status(200).json(invoicingFee);
};

/**
 * GET /invoicing_fees
 *
 * @description lists all invoicing fees in the database, in configurable
 * levels of detail
 */
exports.list = async function list(req, res) {
  let sql = `SELECT bs.id, bs.label, bs.created_at
    FROM invoicing_fee AS bs
    ORDER BY bs.label;`;

  // provide as more information as necessary, if the client asks for it.
  if (req.query.detailed === '1') {
    sql = `SELECT
        bs.id, bs.label, bs.created_at, bs.updated_at, bs.account_id,
        bs.description, bs.value, a.number
      FROM invoicing_fee AS bs
      JOIN account AS a
        ON bs.account_id = a.id
      ORDER BY bs.id;`;
  }

  const rows = await db.exec(sql);
  res.status(200).json(rows);
};

/**
 * POST /invoicing_fees
 *
 * @desc creates a new invoicing fee
 */
exports.create = async function create(req, res) {
  // cache posted data for easy lookup
  const data = req.body.invoicingFee;

  // delete the id if it exists -- the db will create one via auto-increment
  delete data.id;

  // ensure that values inserted are positive
  if (data.value <= 0) {
    throw new BadRequest(`The value submitted to a invoicing fee must be positive.
         You provided the negative value ${data.value}.`);

  }

  const sql = `INSERT INTO invoicing_fee (account_id, label, description, value)
    VALUES (?, ?, ?, ?);`;

  const results = await db.exec(sql, [data.account_id, data.label, data.description, data.value]);
  res.status(201).json({ id : results.insertId });
};

/**
 * PUT /invoicing_fees/:id
 *
 * @desc updates an existing invoicing fee with new information
 */
exports.update = async function update(req, res) {
  const { id } = req.params;
  const data = req.body.invoicingFee;

  // remove the :id if it exists inside the invoicingFee object
  delete data.id;

  const sql = 'UPDATE invoicing_fee SET ? WHERE id = ?;';

  // ensure that the invoicing fee matching :id exists
  await lookupInvoicingFee(id);
  await db.exec(sql, [data, req.params.id]);
  const invoicingFee = await lookupInvoicingFee(id);
  res.status(200).json(invoicingFee);
};

/**
 * DELETE /invoicing_fees/:id
 *
 * @desc deletes a invoicing fee in the database
 */
exports.delete = async function del(req, res) {
  const sql = 'DELETE FROM invoicing_fee WHERE id = ?;';

  // first make sure that the invoicing fee exists
  await lookupInvoicingFee(req.params.id);
  await db.exec(sql, [req.params.id]);
  res.sendStatus(204);
};
