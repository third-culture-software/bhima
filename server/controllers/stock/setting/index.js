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
exports.list = function list(req, res, next) {
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
      enable_requisition_validation_step
    FROM stock_setting
    WHERE enterprise_id = ? LIMIT 1;
    `;

  db.exec(sql, [enterpriseId])
    .then(rows => {
      if (rows.length === 1) {
        res.status(200).json(rows);
      } else {
        throw new NotFound(`Could not find stock_setting data with enterprise id ${req.params.id} (get)`);
      }

    })
    .catch(next)
    
};

// PUT /stock/setting/:id
//
//  Update the settings in stock_settings for the settings
//  with enterprise_id given by the 'id' parameter
exports.update = function update(req, res, next) {
  const sql = 'UPDATE stock_setting SET ? WHERE enterprise_id = ?';
  const { settings } = req.body;

  db.exec(sql, [settings, req.params.id])
    .then((row) => {
      if (!row.affectedRows) {
        throw new NotFound(`Could not find stock_setting row with enterprise id ${req.params.id} (put)`);
      }
      // Get the updated values
      return db.exec('UPDATE stock_setting SET ? WHERE enterprise_id = ?',
        [settings, req.params.id]);
    })
    .then((updatedSettings) => {
      res.status(200).json(updatedSettings);
    })
    .catch(next)
    
};
