/**
 * @overview Cashboxes/Currencies
 *
 * @description
 * Provides an interface for interacting with currencied accounts attached to
 * the cashboxes.
 *
 * @requires db
 * @requires NotFound
 */

const db = require('../../../lib/db');
const NotFound = require('../../../lib/errors/NotFound');

exports.list = list;
exports.detail = detail;
exports.create = create;
exports.update = update;

/**
 * @method list
 *
 * @description
 * Lists the currencied accounts associated with a given cashbox.
 *
 * GET /cashboxes/:id/currencies
 */
async function list(req, res) {
  const sql = `SELECT id, currency_id, account_id, transfer_account_id
    FROM cash_box_account_currency WHERE cash_box_id = ?;`;

  const rows = await db.exec(sql, [req.params.id]);
  res.status(200).json(rows);
}

/**
 * @method detail
 *
 * @description
 * Get the details of a single currencied account associated with the cashbox.
 *
 * GET /cashboxes/:id/currencies/:currencyId
 */
async function detail(req, res) {
  const sql = `SELECT id, account_id, transfer_account_id
    FROM cash_box_account_currency
    WHERE cash_box_id = ? AND currency_id = ?;`;

  const rows = await db.exec(sql, [req.params.id, req.params.currencyId]);
  if (!rows.length) {
    throw new NotFound(`
          Could not find a cash box account currency with id ${req.params.currencyId}.
        `);
  }

  res.status(200).json(rows[0]);
}

// POST /cashboxes/:id/currencies
/**
 * @method create
 *
 * @description
 * This creates a new currency account in the database.
 */
async function create(req, res) {
  const data = req.body;
  data.cash_box_id = req.params.id;

  const sql = 'INSERT INTO cash_box_account_currency SET ?;';

  const row = await db.exec(sql, [data]);
  // currency account changes are still a cashbox update
  res.status(201).json({ id : row.insertId });
}

/**
 * @method update
 *
 * @description
 * This method updates the currencied accounts associated with a cashbox.
 *
 * PUT /cashboxes/:id/currencies/:currencyId
 */
async function update(req, res) {
  const data = req.body;

  let sql = `UPDATE cash_box_account_currency SET ?
    WHERE cash_box_id = ? AND currency_id = ?;`;

  try {
    await db.exec(sql, [data, req.params.id, req.params.currencyId]);
    // send the changed object to the client
    sql = `SELECT id, account_id, transfer_account_id
      FROM cash_box_account_currency
      WHERE cash_box_id = ? AND currency_id = ?;`;

    const rows = await db.exec(sql, [req.params.id, req.params.currencyId]);
    // in case an unknown id is sent to the server
    /** @todo - review this decision */
    if (!rows.length) {
      res.status(200).json({});
      return;
    }

    res.status(200).json(rows[0]);
  } catch (e) {
    if (e.code === 'ER_TRUNCATED_WRONG_VALUE') {
      res.status(200).json({});
    } else {
      throw e;
    }

  }
}
