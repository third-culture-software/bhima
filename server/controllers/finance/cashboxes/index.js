/**
 * @overview Cashboxes
 *
 * @description
 * This controller is responsible for creating and updating cashboxes.  Every
 * cashbox must have a name, and as many accounts as there are currencies
 * supported by the application.
 *
 * @requires db
 * @requires Cashboxes/Currencies
 * @requires FilterParser
 */

const db = require('../../../lib/db');
const FilterParser = require('../../../lib/filter');
const currencies = require('./currencies');

exports.list = list;
exports.detail = detail;
exports.create = create;
exports.update = update;
exports.delete = remove;
exports.currencies = currencies;
exports.users = users;

exports.privileges = privileges;
exports.getCashboxesDetails = getCashboxesDetails;

/**
 * @method list
 *
 * @description
 * GET /cashboxes
 * Lists available cashboxes, defaulting to all in the database.  Pass in the
 * optional parameters:
 */
async function list(req, res) {
  const filters = new FilterParser(req.query);

  let sql = 'SELECT id, label, is_auxiliary, project_id FROM cash_box ';

  // @TODO(sfount) this isn't a detailed query for cashboxes because it returns
  //               individual supported cashbox accounts, this is essentially a seperate query
  //               and should be moved
  if (req.query.detailed === '1') {
    sql = `
      SELECT cash_box_account_currency.id, label, account_id, is_auxiliary, transfer_account_id, symbol, cash_box_id,
      cash_box_account_currency.currency_id
      FROM cash_box JOIN cash_box_account_currency ON
      cash_box.id = cash_box_account_currency.cash_box_id JOIN currency ON
      currency.id = cash_box_account_currency.currency_id
    `;
  }

  // @TODO(sfount) this should be renamed `detailed` if it can be confirmed the current
  //               `detailed` parameter has been fully migrated
  if (req.query.includeUsers) {
    // numberOfUsers sub query is ineficient but this should only be used on low volume management pages
    sql = `
      SELECT
        cash_box.id, cash_box.label, cash_box.is_auxiliary, cash_box.project_id,
        project.name as project_name, project.abbr as project_abbr, (SELECT COUNT(id) from cashbox_permission
      WHERE cashbox_id = cash_box.id) as number_of_users
      FROM cash_box
      LEFT JOIN project ON cash_box.project_id = project.id
    `;

  }

  filters.equals('project_id');
  filters.equals('is_auxiliary');

  filters.custom(
    'user_id',
    `cash_box.id IN (
      SELECT cashbox_permission.cashbox_id FROM cashbox_permission WHERE cashbox_permission.user_id = ?
    )`,
  );

  filters.setOrder('ORDER BY label');

  const query = filters.applyQuery(sql);
  const parameters = filters.parameters();

  const rows = await db.exec(query, parameters);
  res.status(200).json(rows);

}

/**
 * @method helperGetCashbox
 *
 * @description
 * This method fetches a cashbox from the database.
 *
 * @param {Number} id - the id of the cashbox to be retrieved
 * @returns {Promise} - the response from the database
 */
async function helperGetCashbox(id) {

  let sql = `
    SELECT id, label, project_id, is_auxiliary FROM cash_box
    WHERE id = ?;
  `;

  const cashbox = await db.one(sql, [id], id, 'Cashbox');

  // query the currencies supported by this cashbox
  sql = `
        SELECT currency_id, account_id, transfer_account_id
        FROM cash_box_account_currency
        WHERE cash_box_id = ?;
      `;

  // assign the currencies to the cashbox
  cashbox.currencies = await db.exec(sql, [cashbox.id]);
  return cashbox;
}

/**
 * @method detail
 *
 * @description
 * GET /cashboxes/:id
 *
 * Returns the details of a specific cashbox, including the supported currencies
 * and their accounts.
 */
async function detail(req, res) {
  const cashbox = await helperGetCashbox(req.params.id);
  res.status(200).json(cashbox);
}

/**
 * @method create
 *
 * @description
 * This method creates a new cashbox in the database.
 *
 * POST /cashboxes
 */
async function create(req, res) {
  const box = req.body.cashbox;
  const sql = 'INSERT INTO cash_box SET ?;';

  const row = await db.exec(sql, [box]);
  res.status(201).json({ id : row.insertId });
}

/**
 * @method update
 *
 * @description
 * This method updates the cashbox details for a cashbox matching the provided
 * id.
 *
 * PUT /cashboxes/:id
 */
async function update(req, res) {
  const sql = 'UPDATE cash_box SET ? WHERE id = ?;';

  await db.exec(sql, [req.body, req.params.id]);
  const cashbox = await helperGetCashbox(req.params.id);
  res.status(200).json(cashbox);
}

/**
 * @method remove
 *
 * @description
 * This method removes the cashbox from the system.
 */
async function remove(req, res) {
  await db.delete(
    'cash_box', 'id', req.params.id, res, `Could not find a cash box with id ${req.params.id}`,
  );
}

/**
 * @method users
 *
 * @description
 * GET /cashboxes/:id/users
 *
 * Fetch limited user information on all users with permissions to use a
 * specified cashbox
 */
async function users(req, res) {
  const cashboxId = req.params.id;

  const sql = `
    SELECT user_id as id, username, display_name, deactivated, last_login
    FROM cashbox_permission
    LEFT JOIN user ON cashbox_permission.user_id = user.id
    WHERE cashbox_id = ?
  `;

  const cashboxUsers = await db.exec(sql, [cashboxId]);
  res.status(200).json(cashboxUsers);
}

/**
 * @method privileges
 *
 * @description
 * GET /cashboxes/privileges
 *
 * List each user's privileges for each cashbox
 */
async function privileges(req, res) {
  const userId = req.session.user.id;
  const isAuxiliary = 1;

  const sql = `
    SELECT userCashBox.id, userCashBox.label, userCashBox.project_id, userCashBox.is_auxiliary, userCashBox.user_id
      FROM(
        (
          SELECT cash_box.id, cash_box.label, cash_box.project_id, cash_box.is_auxiliary, cashbox_permission.user_id
          FROM cash_box
          JOIN cashbox_permission ON cashbox_permission.cashbox_id = cash_box.id
          WHERE cashbox_permission.user_id = ? AND cash_box.is_auxiliary = ?
        )
      UNION
        (
          SELECT cash_box.id, cash_box.label, cash_box.project_id, cash_box.is_auxiliary, NULL AS user_id
          FROM cash_box
          WHERE cash_box.id NOT IN (
            SELECT cashbox_permission.cashbox_id FROM cashbox_permission WHERE cashbox_permission.user_id = ?
          ) AND cash_box.is_auxiliary = ?
        )
      ) AS userCashBox
      ORDER BY userCashBox.label
  `;

  const rows = await db.exec(sql, [userId, isAuxiliary, userId, isAuxiliary]);
  res.status(200).json(rows);
}

/**
 * getCashboxesDetails
 *
 * this function returns details of cashboxe ids given
 * @param {array} cashboxesIds
 */
function getCashboxesDetails(cashboxesIds) {
  const query = `
    SELECT
      cac.currency_id, cac.account_id, c.id, c.label, cur.symbol,
      a.number AS account_number, a.label AS account_label
    FROM cash_box c
    JOIN cash_box_account_currency cac ON cac.cash_box_id = c.id
    JOIN currency cur ON cur.id = cac.currency_id
    JOIN account a ON a.id = cac.account_id
    WHERE c.id IN ? ORDER BY c.id;
  `;
  return db.exec(query, [[cashboxesIds]]);
}
