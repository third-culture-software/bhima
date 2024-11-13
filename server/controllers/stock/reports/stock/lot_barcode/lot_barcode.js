const {
  _, ReportManager, db, identifiers, barcode, LOT_BARCODE_TEMPLATE,
} = require('../../common');

/**
 * @method lotBarcodeReceipt
 *
 * @description
 * This method displays the lot barcode
 *
 * GET /receipts/stock/lots/:uuid/barcode
 */
function lotBarcodeReceipt(req, res, next) {
  let report;
  const data = {};
  const uuid = db.bid(req.params.uuid);
  const options = {
    filename : 'LOTS.BARCODE_FOR_LOT',
    pageSize : 'A6',
    orientation : 'landscape',
  };
  const optionReport = _.extend(req.query, options);

  try {
    report = new ReportManager(LOT_BARCODE_TEMPLATE, req.session, optionReport);
  } catch (e) {
    return next(e);
  }

  const sql = `
    SELECT BUID(l.uuid) AS uuid, l.label, i.code, i.text AS inventory_text
    FROM lot l
    JOIN inventory i ON i.uuid = l.inventory_uuid
    WHERE l.uuid = ?;
  `;

  return db.one(sql, [db.bid(uuid)])
    .then(details => {
      const { key } = identifiers.LOT;
      data.details = details;
      data.barcode = barcode.generate(key, details.uuid);
      return report.render(data);
    })
    .then((result) => {
      res.set(result.headers).send(result.report);
    })
    .catch(next)
    
}

module.exports = lotBarcodeReceipt;
