const {
  ReportManager,
  formatFilters,
  Shipment,
  SHIPMENTS_REPORT_TEMPLATE,
} = require('./common');

async function getReport(req, res) {
  let display = {};
  const params = structuredClone(req.query);
  const options = {
    ...params,
    filename : 'SHIPMENT.SHIPMENTS',
    csvKey : 'rows',
    renameKeys : false,
    orientation : 'landscape',
  };

  if (params.displayNames) {
    display = JSON.parse(params.displayNames);
    delete params.displayNames;
  }

  const report = new ReportManager(SHIPMENTS_REPORT_TEMPLATE, req.session, options);
  const rows = await Shipment.find(params);

  const data = {
    rows,
    display,
    filters : formatFilters(params),
  };

  const result = await report.render(data);
  res.set(result.headers).send(result.report);
}

exports.getReport = getReport;
