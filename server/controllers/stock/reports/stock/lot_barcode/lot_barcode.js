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
async function lotBarcodeReceipt(req, res) {
  const data = {};
  const uuid = db.bid(req.params.uuid);
  const options = {
    filename : 'LOTS.BARCODE_FOR_LOT',
    pageSize : 'A6',
    orientation : 'landscape',
  };

  const optionReport = _.extend(req.query, options);

  const report = new ReportManager(LOT_BARCODE_TEMPLATE, req.session, optionReport);

  const sql = `
    SELECT BUID(l.uuid) AS uuid, l.label, i.code, i.text AS inventory_text
    FROM lot l
    JOIN inventory i ON i.uuid = l.inventory_uuid
    WHERE l.uuid = ?;
  `;

  const details = await db.one(sql, [db.bid(uuid)]);
  const { key } = identifiers.LOT;
  data.details = details;
  data.barcode = barcode.generate(key, details.uuid);
  const result = await report.render(data);
  res.set(result.headers).send(result.report);
}

module.exports = lotBarcodeReceipt;
