const _ = require('lodash');
const core = require('../../../stock/core');
const util = require('../../../../lib/util');
const reqInvScans = require('../../../stock/required_inventory_scans');
const ReportManager = require('../../../../lib/ReportManager');

const BASE_URL = './server/controllers/asset_management/assets';
const NEEDED_INVENTORY_SCAN_REPORT_TEMPLATE = `${BASE_URL}/reports/needed_inventory_scans.handlebars`;

const {
  assetCondition,
} = require('../../../../config/constants');

async function neededInventoryScansReport(req, res) {
  const options = req.query;

  // @TODO: put these into combined bhConstants and eventually share across client and server
  const tableTitles = {
    all : 'REPORT.INVENTORY_SCANS_NEEDED.SCANS_ALL',
    scanned : 'REPORT.INVENTORY_SCANS_NEEDED.SCANS_SCANNED',
    unscanned : 'REPORT.INVENTORY_SCANS_NEEDED.SCANS_UNSCANNED',
  };

  const tableType = (options.scan_status && options.scan_status in tableTitles) ? options.scan_status : 'all';

  _.defaults(options, {
    filename : 'ASSET.REQUIRED_INVENTORY_SCANS',
    csvKey : 'assets',
    orientation : 'landscape',
  });

  const report = new ReportManager(NEEDED_INVENTORY_SCAN_REPORT_TEMPLATE, req.session, options);

  const [scan] = await reqInvScans.requiredInventoryScans({ uuid : options.uuid });

  const params = {
    depot_uuid : scan.depot_uuid,
    is_asset : scan.is_asset,
    scan_start_date : new Date(scan.start_date),
    scan_end_date : new Date(scan.end_date),
    // Do not pass in scan_status, filter after the query
  };

  const allAssets = await core.getAssets(params);

  // Fill in the asset condition names
  allAssets.forEach(asset => {
    if (asset.scan_condition_id) {
      const condition = assetCondition.find(ac => ac.id === asset.scan_condition_id);
      asset.scan_condition = condition ? condition.label : '';
    }
  });

  const countScanned = allAssets.reduce((num, asset) => (asset.scan_uuid ? num + 1 : num), 0);
  const countTotal = allAssets.length;
  const percentScanned = util.roundDecimal(100.0 * (countScanned / countTotal), 1);

  // filter for scan status (if needed)
  let assets = allAssets;
  if (options.scan_status === 'scanned') {
    assets = allAssets.filter(a => a.scan_uuid);
  } else if (options.scan_status === 'unscanned') {
    assets = allAssets.filter(a => !a.scan_uuid);
  }

  const data = {
    scan,
    assets,
    countScanned,
    countTotal,
    percentScanned,
    tableTitle : tableTitles[tableType],
    date : new Date(),
  };

  const result = await report.render(data);
  res.set(result.headers).send(result.report);
}

exports.neededInventoryScansReport = neededInventoryScansReport;
