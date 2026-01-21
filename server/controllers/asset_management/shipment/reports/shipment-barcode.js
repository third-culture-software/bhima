const {
  db,
  ReportManager,
  identifiers,
  barcode,
  SHIPMENT_BARCODE_TEMPLATE,
} = require('./common');

exports.getBarcode = getBarcode;

async function getBarcode(req, res) {
  const { uuid } = req.params;
  const options = {
    ...req.query,
    filename : 'SHIPMENT.BARCODE',
    pageSize : 'A6',
    orientation : 'landscape',
  };

  const report = new ReportManager(SHIPMENT_BARCODE_TEMPLATE, req.session, options);

  const sql = `
    SELECT
      BUID(s.uuid) AS uuid, s.name, dm.text AS reference
    FROM shipment s 
    JOIN document_map dm ON dm.uuid = s.uuid
    WHERE s.uuid = ?;
  `;

  const details = await db.one(sql, [db.bid(uuid)]);
  const { key } = identifiers.SHIPMENT;
  const data = { details, barcode : barcode.generate(key, details.uuid) };
  const result = await report.render(data);
  res.set(result.headers).send(result.report);
}
