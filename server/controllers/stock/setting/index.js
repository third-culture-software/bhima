/**
 * The Stock Settings Controller
 *
 * This controller is responsible for creating and updating stock-related settings.
 */

const db = require('../../../lib/db');
const NotFound = require('../../../lib/errors/NotFound');

// GET /stock/setting
//
// Get the current stock settings for the Enterprise
//    If req.query.enterprise_id is set, it will use that,
//    otherwise it will look up the entry for Enterprise.id=1
exports.list = async function list(req, res) {
  let enterpriseId = req.session.enterprise.id;
  if (req.params.id) {
    // If the enterprise was passed in as a parameter, use it
    enterpriseId = req.params.id;
  }

  const sql = `
    SELECT month_average_consumption, default_min_months_security_stock,
      enable_auto_purchase_order_confirmation, enable_auto_stock_accounting,
      enable_strict_depot_permission, enable_supplier_credit,
      enable_strict_depot_distribution, average_consumption_algo,
      min_delay, default_purchase_interval, enable_expired_stock_out,
      default_cost_center_for_loss, enable_packaging_pharmaceutical_products,
      enable_requisition_validation_step, enable_funding_source
    FROM stock_setting
    WHERE enterprise_id = ? LIMIT 1;
    `;

  const rows = await db.exec(sql, [enterpriseId]);
  if (rows.length === 1) {
    res.status(200).json(rows);
  } else {
    throw new NotFound(`Could not find stock_setting data with enterprise id ${req.params.id} (get)`);
  }
};

// PUT /stock/setting/:id
//
//  Update the settings in stock_settings for the settings
//  with enterprise_id given by the 'id' parameter
exports.update = async function update(req, res) {
  const sql = 'UPDATE stock_setting SET ? WHERE enterprise_id = ?';
  const { settings } = req.body;

  const row = await db.exec(sql, [settings, req.params.id]);
  if (!row.affectedRows) {
    throw new NotFound(`Could not find stock_setting row with enterprise id ${req.params.id} (put)`);
  }
  // Get the updated values
  const updatedSettings = await db.exec('UPDATE stock_setting SET ? WHERE enterprise_id = ?',
    [settings, req.params.id]);
  res.status(200).json(updatedSettings);
};
