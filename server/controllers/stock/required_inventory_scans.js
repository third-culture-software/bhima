/**
 * Stock Asset Controller
 */
const _ = require('lodash');
const moment = require('moment');
const db = require('../../lib/db');
const util = require('../../lib/util');

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
    'depot_uuid',
    'inv_group_uuid',
    'inventory_uuid',
  ]);
}

/**
 * @function getFilters
 *
 * @description
 * Groups all filtering functionality used in the different functions into
 * a single function.  The filterparser is returned so that any additional modifications
 * can be made in the function before execution.
 *
 * @param {Object} parameters - an object of filter params.
 */
function getFilters(parameters) {
  // clone the parameters
  const params = binarize({ ...parameters });

  // Construct the filters
  const filters = new FilterParser(params, { tableAlias : 'ais' });

  filters.equals('uuid');
  filters.equals('title');
  filters.equals('description');
  filters.equals('depot_uuid');
  filters.fullText('reference_number');
  filters.equals('is_asset');

  filters.period('period', 'end_date');
  filters.dateFrom('custom_period_start', 'end_date');
  filters.dateTo('custom_period_end', 'end_date');

  return filters;
}

/**
 * @function getRequiredInventoryScans
 *
 * GET /inventory/required/scans
 */
exports.getRequiredInventoryScans = async function getRequiredInventoryScans(req, res, next) {
  const params = req.query;
  try {
    const rows = await list(params);
    res.status(200).json(rows);
  } catch (error) {
    next(error);
  }
};

/**
 * @function getRequiredInventoryScan
 *
 * GET /inventory/required/scan/:uuid
 */
exports.getRequiredInventoryScan = async function getRequiredInventoryScan(req, res, next) {
  try {
    const rows = await list(req.params);
    res.status(200).json(rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * Get the list of required asset inventory scans
 * @param {object} params
 * @returns {promise} result of query (
 */
function list(params) {
  const filters = getFilters(params);

  const sql = `
    SELECT
      BUID(ais.uuid) AS uuid, ais.title, ais.description, ais.start_date, ais.end_date,
      ais.is_asset, ais.reference_number, ais.created_at, ais.updated_at,
      BUID(ais.depot_uuid) AS depot_uuid, dep.text AS depot_name
      FROM required_inventory_scan AS ais
      LEFT JOIN depot dep ON dep.uuid = ais.depot_uuid
   `;
  const query = filters.applyQuery(sql);
  const queryParameters = filters.parameters();
  return db.exec(query, queryParameters);
}

exports.requiredInventoryScans = list;

/**
 * @function createRequiredInventoryScan
 *
 * POST /inventory/required/scan'
 */
exports.createRequiredInventoryScan = async function createRequiredInventoryScan(req, res, next) {
  // Limit fields for creating new asset scan
  const allowedInCreate = [
    'depot_uuid', 'title', 'description', 'start_date', 'end_date', 'is_asset', 'reference_number',
  ];

  const params = _.pick(req.body, allowedInCreate);
  const newUuid = util.uuid();
  params.uuid = newUuid;

  // Format the due date
  params.start_date = moment(params.start_date).format('YYYY-MM-DD');
  params.end_date = moment(params.end_date).format('YYYY-MM-DD');

  const sql = 'INSERT INTO required_inventory_scan SET ?;';

  db.exec(sql, [binarize(params)])
    .then(() => res.status(201).json({ uuid : newUuid }))
    .catch(next)
    
};

/**
 * @function updateRequiredInventoryScan
 *
 * PUT /inventory/required/scan'
 */
exports.updateRequiredInventoryScan = async function updateRequiredInventoryScan(req, res, next) {
  const uuid = db.bid(req.params.uuid);

  // Limit which fields can be updated
  const allowedInUpdate = [
    'depot_uuid', 'title', 'description', 'start_date', 'end_date', 'is_asset', 'reference_number',
  ];

  const params = _.pick(binarize(req.body), allowedInUpdate);

  // Format the dates (if given)
  if (params.end_date) {
    params.end_date = moment(params.end_date).format('YYYY-MM-DD');
  }
  if (params.start_date) {
    params.start_date = moment(params.start_date).format('YYYY-MM-DD');
  }

  // Force an update to 'updated_at'.  Using SQL 'ON UPDATE TIMESTAMP' does not seem to work
  params.updated_at = new Date();

  const sql = 'UPDATE required_inventory_scan SET ? WHERE uuid = ?;';
  db.exec(sql, [params, uuid])
    .then(() => res.sendStatus(200))
    .catch(next)
    
};

/**
 * @function deleteRequiredInventoryScan
 *
 * DELETE /inventory/required/scan'
 */
exports.deleteRequiredInventoryScan = async function deleteRequiredInventoryScan(req, res, next) {
  const uuid = db.bid(req.params.uuid);
  const sql = 'DELETE FROM required_inventory_scan WHERE uuid = ?;';
  db.one(sql, [uuid])
    .then(() => res.sendStatus(200))
    .catch(next)
    
};
