const _ = require('lodash');

const {
  db,
  ReportManager,
  identifiers,
  barcode,
  SHIPMENT_BARCODE_TEMPLATE,
} = require('./common');

exports.getBarcode = getBarcode;

function getBarcode(req, res, next) {
  let report;
  const data = {};
  const { uuid } = req.params;
  const options = {
    filename : 'SHIPMENT.BARCODE',
    pageSize : 'A6',
    orientation : 'landscape',
  };
  const optionReport = _.extend(req.query, options);

  try {
    report = new ReportManager(SHIPMENT_BARCODE_TEMPLATE, req.session, optionReport);
  } catch (e) {
    return next(e);
  }

  const sql = `
    SELECT
      BUID(s.uuid) AS uuid, s.name, dm.text AS reference
    FROM shipment s 
    JOIN document_map dm ON dm.uuid = s.uuid
    WHERE s.uuid = ?;
  `;

  return db.one(sql, [db.bid(uuid)])
    .then(details => {
      const { key } = identifiers.SHIPMENT;
      data.details = details;
      data.barcode = barcode.generate(key, details.uuid);
      return report.render(data);
    })
    .then((result) => {
      res.set(result.headers).send(result.report);
    })
    .catch(next);

}
