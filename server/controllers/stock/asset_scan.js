/**
 * Stock Asset Controller
 */
const _ = require('lodash');
const db = require('../../lib/db');
const util = require('../../lib/util');
const shared = require('../finance/reports/shared');
const ReportManager = require('../../lib/ReportManager');

const REPORT_TEMPLATE = './server/controllers/stock/reports/report.handlebars';

const FilterParser = require('../../lib/filter');

/**
  * @function binarize
  *
  * @description
  * returns binary version of given identifiers (uuids)
  *
  * @param {object} params an object which contains identifiers in string format
  * @returns {object} params with binary identifiers
  */
function binarize(params) {
  return db.convert(params, [
    'uuid',
    'asset_uuid',
    'depot_uuid',
    'group_uuid',
    'inventory_uuid',
    'assigned_to_uuid',
    'location_uuid',
  ]);
}

/**
 * @function getAssetScanFilters
 *
 * @description
 * Groups all filtering functionality used in the different getLots* functions into
 * a single function.  The filterparser is returned so that any additional modifications
 * can be made in the function before execution.
 *
 * @param {Object} parameters - an object of filter params.
 */
function getAssetScanFilters(parameters) {
  // clone the parameters
  const params = binarize({ ...parameters });

  // Construct the filters
  const filters = new FilterParser(params, { tableAlias : 's' });

  filters.equals('uuid');
  filters.equals('asset_uuid', 'uuid', 'l');
  filters.equals('asset_label', 'label', 'l');
  filters.equals('location_uuid');
  filters.equals('depot_uuid');
  filters.equals('group_uuid', 'group_uuid', 'i');
  filters.equals('inventory_uuid', 'inventory_uuid', 'l');
  filters.equals('assigned_to_uuid', 'entity_uuid', 'sa');
  filters.equals('scanned_by');
  filters.fullText('reference_number', 'reference_number', 'l');
  filters.equals('condition_id', 'id', 'ac');
  filters.period('period', 'created_at');
  filters.dateFrom('custom_period_start', 'created_at');
  filters.dateTo('custom_period_end', 'created_at');

  filters.custom('show_only_last_scans', '(s2.uuid IS NULL)');

  return filters;
}

/**
 * @function getAssetScan
 *
 * GET /asset/scan
 */
exports.getAssetScan = async function getAssetScan(req, res, next) {
  try {
    const rows = await listAssetScans(req.params);
    res.status(200).json(rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * @function getAssetScans
 *
 * GET /asset/scans
 */
exports.getAssetScans = async function getAssetScans(req, res, next) {
  const params = req.query;

  try {
    const rows = await listAssetScans(params);
    res.status(200).json(rows);
  } catch (error) {
    next(error);
  }
};

// Get the asset scans
function listAssetScans(params) {
  const filters = getAssetScanFilters(params);
  let lastScanJoin = '';
  if ('show_only_last_scans' in params) {
    // See 'Outer Join Method' in https://thoughtbot.com/blog/ordering-within-a-sql-group-by-clause
    // This join with the 'show_only_last_scans' filter (defined above) ensures that we
    // are selecting only the latest⁄last asset scan for each asset.
    lastScanJoin = `
    LEFT OUTER JOIN asset_scan AS s2
      ON s2.asset_uuid = s.asset_uuid AND
      s.created_at < s2.created_at`;
  }

  const sql = `
    SELECT
      BUID(s.uuid) AS uuid, BUID(s.asset_uuid) AS asset_uuid,
      BUID(s.location_uuid) AS location_uuid, BUID(s.depot_uuid) AS depot_uuid,
      s.scanned_by, s.condition_id, s.notes, s.created_at, s.updated_at,
      l.label AS asset_label, l.unit_cost, l.serial_number, l.reference_number,
      d.text AS depot_text, i.uuid AS inventory_uuid,
      i.code AS inventory_code, i.text AS inventory_text,
      i.manufacturer_brand, i.manufacturer_model,
      BUID(ig.uuid) AS group_uuid, ig.name AS group_name,
      u.display_name AS scanned_by_name, e.display_name AS assigned_to_name
    FROM asset_scan AS s
    JOIN lot l ON l.uuid = s.asset_uuid
    JOIN inventory i ON i.uuid = l.inventory_uuid AND i.is_asset = 1
    JOIN inventory_group ig ON ig.uuid = i.group_uuid
    JOIN depot d ON d.uuid = s.depot_uuid
    JOIN user AS u ON u.id = s.scanned_by ${lastScanJoin}
    LEFT JOIN stock_assign sa ON sa.lot_uuid = l.uuid AND sa.is_active = 1
    LEFT JOIN entity e ON e.uuid = sa.entity_uuid
  `;

  filters.setOrder('ORDER BY s.depot_uuid, l.label, s.created_at');

  const query = filters.applyQuery(sql);
  const queryParameters = filters.parameters();

  return db.exec(query, queryParameters);
}

/**
 * @function createAssetScan
 *
 * POST /asset/scan'
 */
exports.createAssetScan = async function createAssetScan(req, res, next) {

  // Limit fields for creating new asset scan
  const allowedInCreate = ['depot_uuid', 'asset_uuid', 'location_uuid', 'scanned_by', 'condition_id', 'notes'];
  const params = _.pick(req.body, allowedInCreate);
  const newUuid = util.uuid();
  params.uuid = newUuid;
  params.scanned_by = params.scanned_by || req.session.user.id;

  const sql = 'INSERT INTO asset_scan SET ?;';

  db.exec(sql, [binarize(params)])
    .then(() => res.status(201).json({ uuid : newUuid }))
    .catch(next)
    
};

/**
 * @function updateAssetScan
 *
 * PUT /asset/scan'
 */
exports.updateAssetScan = async function updateAssetScan(req, res, next) {
  const uuid = db.bid(req.params.uuid);

  // Limit which fields can be updated
  const allowedInUpdate = ['depot_uuid', 'location_uuid', 'scanned_by', 'condition_id', 'notes'];
  const params = _.pick(binarize(req.body), allowedInUpdate);

  // Force an update to 'updated_at'.  Using SQL 'ON UPDATE TIMESTAMP' does not seem to work
  params.updated_at = new Date();

  const sql = 'UPDATE asset_scan SET ? WHERE uuid = ?;';
  db.exec(sql, [params, uuid])
    .then(() => res.sendStatus(200))
    .catch(next)
    
};

/**
 * @function deleteAssetScan
 *
 * DELETE /asset/scan'
 */
exports.deleteAssetScan = async function deleteAssetScan(req, res, next) {
  const uuid = db.bid(req.params.uuid);
  const sql = 'DELETE FROM asset_scan WHERE uuid = ?;';
  db.one(sql, [uuid])
    .then(() => res.sendStatus(200))
    .catch(next)
    
};

/**
 * @function getLastScan
 *
 * GET /asset/last_scan/:uuid
 */
exports.getLastAssetScan = async function getLastAssetScan(req, res, next) {
  try {
    const { params } = req;
    params.show_only_last_scans = 1;
    const rows = await listAssetScans(params);
    res.status(200).json(rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * @function report
 *
 * @description report as either a PDF, CSV or XLSX
 *
 * GET /asset/scans/reports
 */
async function report(req, res, next) {
  const query = _.clone(req.query);
  const filters = shared.formatFilters(req.query);

  _.extend(query, {
    filename : 'REPORT.ASSET_SCANS.TITLE',
    csvKey : 'rows',
    orientation : 'landscape',
  });

  try {
    const reportInstance = new ReportManager(REPORT_TEMPLATE, req.session, query);
    const data = { filters };

    data.rows = await listAssetScans(req.query);

    const result = await reportInstance.render(data);
    res.set(result.headers).send(result.report);
  } catch (error) {
    next(error);
  }
}

exports.report = report;
