/**
 * The Enterprises Controller
 *
 * This controller is responsible for creating and updating Enterprises.
 * Each enterprise must necessarily have a name, an abbreviation, a geographical
 * location as well as a currency and it is not possible to remove an enterprise.
 */

const _ = require('lodash');

const db = require('../../lib/db');
const NotFound = require('../../lib/errors/NotFound');
const BadRequest = require('../../lib/errors/BadRequest');
const { loadSessionInformation } = require('../auth');

exports.lookupEnterprise = lookupEnterprise;
exports.lookupByProjectId = lookupByProjectId;

// GET /enterprises
exports.list = async function list(req, res, next) {
  let sql = 'SELECT id, name, abbr FROM enterprise';

  const settings = [
    'enable_price_lock',
    'enable_prepayments',
    'enable_password_validation',
    'enable_balance_on_invoice_receipt',
    'enable_barcodes',
    'enable_auto_email_report',
    'enable_index_payment_system',
    'percentage_fixed_bonus',
    'base_index_growth_rate',
    'posting_payroll_cost_center_mode',
    'enable_require_cost_center_for_posting',
    'enable_prf_details',
    'purchase_general_condition',
    'terms_of_delivery',
    'special_instructions',
    'enable_activate_pension_fund',
    'pension_transaction_type_id',
  ];

  if (req.query.detailed === '1') {
    sql = `
      SELECT id, name, abbr, email, po_box, helpdesk, phone, address,
        BUID(location_id) AS location_id, logo, currency_id, dhis2_uid,
        gain_account_id, loss_account_id, enable_price_lock, enable_prepayments,
        enable_password_validation, enable_balance_on_invoice_receipt, enable_barcodes,
        enable_auto_email_report, enable_index_payment_system, base_index_growth_rate,
        posting_payroll_cost_center_mode, enable_require_cost_center_for_posting,
        enable_prf_details, purchase_general_condition, terms_of_delivery, special_instructions,
        percentage_fixed_bonus, enable_activate_pension_fund, pension_transaction_type_id
      FROM enterprise LEFT JOIN enterprise_setting
        ON enterprise.id = enterprise_setting.enterprise_id
      ;`;
  }

  try {
    const rows = await db.exec(sql);

    const restructureSettingsFn = row => {
      row.settings = _.pick(row, settings);
      return _.omit(row, settings);
    };

    // FIXME(@jniles) - this is kinda hacky.  The idea is to keep settings
    // separate in a JSON file.  This will make more sense as we add enterprise
    // options.
    const data = (req.query.detailed === '1')
      ? rows.map(restructureSettingsFn)
      : rows;

    res.status(200).json(data);
  } catch (e) { next(e); }

};

// GET /enterprises/:id
exports.detail = function detail(req, res, next) {
  lookupEnterprise(req.params.id)
    .then(enterprise => {
      res.status(200).json(enterprise);
    })
    .catch(next);
};

async function lookupEnterprise(id) {
  const sql = `
    SELECT id, name, abbr, email, po_box, helpdesk, phone, address,
      BUID(location_id) AS location_id, logo, currency_id,
      gain_account_id, loss_account_id
    FROM enterprise WHERE id = ?;
  `;

  const settingsSQL = `
    SELECT * FROM enterprise_setting WHERE enterprise_id = ?;
  `;

  const enterprise = await db.one(sql, [id], id, 'enterprise');
  const settings = await db.exec(settingsSQL, id);
  enterprise.settings = settings[0] || {};
  return enterprise;
}

/**
 * @method lookupByProjectId
 *
 * @description
 * Finds an enterprise via a project id.  This method is useful since most
 * tables only store the project_id instead of the enterprise_id.
 *
 * @param {Number} id - the project id to lookup
 * @returns {Promise} - the result of the database query.
 */
async function lookupByProjectId(id) {
  const sql = `
    SELECT e.id, e.name, e.abbr, email, e.po_box, e.helpdesk, e.phone, e.address,
      BUID(e.location_id) AS location_id, e.logo, e.currency_id,
      e.gain_account_id, e.loss_account_id,
      CONCAT_WS(' ', village.name, sector.name, province.name) AS location
    FROM enterprise AS e JOIN project AS p ON e.id = p.enterprise_id
      JOIN village ON e.location_id = village.uuid
      JOIN sector ON village.sector_uuid = sector.uuid
      JOIN province ON sector.province_uuid = province.uuid
    WHERE p.id = ?
    LIMIT 1;
  `;

  const rows = await db.exec(sql, [id]);

  if (!rows.length) {
    throw new NotFound(`Could not find an enterprise with project id ${id}.`);
  }

  return rows[0];
}

// POST /enterprises
exports.create = function create(req, res, next) {
  const enterprise = db.convert(req.body.enterprise, ['location_id']);
  const sql = 'INSERT INTO enterprise SET ?;';

  db.exec(sql, [enterprise])
    .then(row => {
      res.status(201).json({ id : row.insertId });
    })
    .catch(next);

};

// PUT /enterprises/:id
exports.update = async function update(req, res, next) {
  const sql = 'UPDATE enterprise SET ? WHERE id = ?;';
  const data = db.convert(req.body, ['location_id']);

  const { settings } = data;
  delete data.settings;

  data.id = req.params.id;

  try {
    const row = await db.exec(sql, [data, data.id]);

    if (!row.affectedRows) {
      throw new NotFound(`Could not find an enterprise with id ${req.params.id}`);
    }

    await db.exec('UPDATE enterprise_setting SET ? WHERE enterprise_id = ?', [settings, req.params.id]);

    // refresh the session information on update
    await loadSessionInformation(req.session.user);
    const enterprise = await lookupEnterprise(req.params.id);
    res.status(200).json(enterprise);
  } catch (e) { next(e); }
};

// POST /enterprises/:id/logo
exports.uploadLogo = (req, res, next) => {
  if (req.files.length === 0) {
    next(BadRequest('Expected at least one file upload but did not receive any files.'));
    return;
  }

  const logo = req.files[0].link;
  const sql = 'UPDATE enterprise SET logo = ? WHERE id = ?';

  db.exec(sql, [logo, req.params.id])
    .then(() => {
      res.status(200).json({ logo });
    })
    .catch(next);
};
