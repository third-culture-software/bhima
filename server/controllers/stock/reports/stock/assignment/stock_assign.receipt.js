const {
  _, ReportManager, db, identifiers, barcode, STOCK_ASSIGN_TEMPLATE,
} = require('../../common');

/**
 * @method stockAssignmentReceipt
 *
 * @description
 * This method builds the stock assign receipt file to be sent to the client.
 *
 * GET /receipts/stock/assign/:uuid
 */
function stockAssignmentReceipt(req, res, next) {
  let report;
  const data = {};
  const uuid = db.bid(req.params.uuid);
  const optionReport = _.extend(req.query, { filename : 'ASSIGN.STOCK_ASSIGN' });

  // set up the report with report manager
  try {
    report = new ReportManager(STOCK_ASSIGN_TEMPLATE, req.session, optionReport);
  } catch (e) {
    return next(e);
  }

  const sql = `
    SELECT
      BUID(sa.uuid) AS uuid, BUID(sa.lot_uuid) AS lot_uuid,
      BUID(sa.depot_uuid) AS depot_uuid, BUID(sa.entity_uuid) AS entity_uuid,
      sa.quantity, DATE_FORMAT(sa.created_at, "%d %m %Y"), sa.description, sa.is_active, d.text as depot_name,
      e.display_name AS assigned_to_name, u.display_name AS user_display_name,
      i.code, i.text AS inventory_text, l.label as lot_name
    FROM stock_assign sa
    JOIN depot d ON d.uuid = sa.depot_uuid
    JOIN lot l ON l.uuid = sa.lot_uuid
    JOIN inventory i ON i.uuid = l.inventory_uuid
    JOIN entity e ON e.uuid = sa.entity_uuid
    JOIN user u ON u.id = sa.user_id
    WHERE sa.uuid = ?;
  `;

  return db.one(sql, [db.bid(uuid)])
    .then((details) => {
      const { key } = identifiers.STOCK_ASSIGN;
      data.enterprise = req.session.enterprise;
      data.details = details;
      data.details.barcode = barcode.generate(key, details.uuid);
      return report.render(data);
    })
    .then((result) => {
      res.set(result.headers).send(result.report);
    })
    .catch(next)
    
}

module.exports = stockAssignmentReceipt;
