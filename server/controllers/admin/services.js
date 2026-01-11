/**
 * @overview Services
 *
 * @description
 * The /services HTTP API endpoint
 *
 * @description
 * This controller is responsible for implementing all crud and others custom request
 * on the services table through the `/services` endpoint.
 *
 * @requires lib/util
 * @requires db
 * @requires NotFound
 */

const db = require('../../lib/db');
const { uuid } = require('../../lib/util');
const NotFound = require('../../lib/errors/NotFound');
const FilterParser = require('../../lib/filter');

/**
 * @method list
 *
 * @description
 * Returns an array of services from the database.
 */
async function list(req, res) {
  let sql = `
    SELECT
      s.name, BUID(s.uuid) AS uuid, s.hidden,
      p.id AS project_id, p.name AS project_name
    FROM service AS s
    LEFT JOIN project AS p ON s.project_id = p.id`;

  if (req.query.full === '1') {
    sql = `
      SELECT s.name, s.enterprise_id, BUID(s.uuid) AS uuid, s.hidden,
      e.name AS enterprise_name, e.abbr, p.id AS project_id, p.name AS project_name,
      cc.id AS cost_center_id, cc.label AS cost_center_name
      FROM service AS s
      JOIN enterprise AS e ON s.enterprise_id = e.id
      LEFT JOIN project AS p ON s.project_id = p.id
      LEFT JOIN service_cost_center AS scc ON scc.service_uuid = s.uuid
      LEFT JOIN cost_center AS cc ON cc.id = scc.cost_center_id
      `;
  }

  const params = db.convert(req.query, ['uuid']);
  const filters = new FilterParser({ ...params, tableAlias : 's' });

  filters.equals('uuid');
  filters.equals('name');
  filters.equals('hidden');
  filters.setOrder('ORDER BY s.name');

  const query = filters.applyQuery(sql);
  const queryParameters = filters.parameters();

  const rows = await db.exec(query, queryParameters);
  res.status(200).json(rows);

}

async function countServiceByProject(req, res) {
  const sql = `
  SELECT p.name AS project_name, p.abbr AS project_abbr, COUNT(*) AS total
  FROM service AS s
    LEFT JOIN project AS p ON s.project_id = p.id
  GROUP BY p.id ORDER BY s.name;`;

  const rows = await db.exec(sql);
  res.status(200).json(rows);
}

/**
 * @method create
 *
 * @description
 * Create a service in the database
 */
async function create(req, res) {
  const record = req.body;
  const costCenterId = record.cost_center_id;
  delete record.cost_center_id;
  delete record.cost_center_name;

  const sql = `INSERT INTO service SET ?`;

  // add contextual information
  record.enterprise_id = req.session.enterprise.id;

  // service unique uuid as entity uuid
  const uid = uuid();
  record.uuid = db.bid(uid);

  await db.exec(sql, [record]);
  if (costCenterId) {
    await setServiceCostCenter(record.uuid, costCenterId);
  }
  res.status(201).json({ uuid : uid });
}

/**
* Update a service in the database
*
* @param {object} req The express request object
* @param {object} res The express response object
*
* @example
* // PUT /services : update a service
* let services = require('admin/services');
* services.update(req, res);
*/
async function update(req, res) {
  const queryData = req.body;
  delete queryData.uuid;
  const serviceUuid = db.bid(req.params.uuid);

  const costCenterId = queryData.cost_center_id;
  delete queryData.cost_center_id;

  const sql = `UPDATE service SET ? WHERE uuid = ?;`;
  const result = await db.exec(sql, [queryData, serviceUuid]);

  if (!result.affectedRows) {
    throw new NotFound(`Could not find a service with uuid ${req.params.uuid}.`);
  }

  if (costCenterId) {
    await setServiceCostCenter(serviceUuid, costCenterId);
  }
  const service = await lookupService(req.params.uuid);
  res.status(200).json(service);
}

/**
 * @method remove
 *
 * @description
 * Remove a service in the database.
 */
function remove(req, res, next) {
  db.delete('service', 'uuid', db.bid(req.params.uuid), res, next,
    `Could not find a service with uuid ${req.params.uuid}`);
}

/**
 * @method detail
 *
 * @description
 * Return a service details from the database
 */
async function detail(req, res) {
  const row = await lookupService(req.params.uuid);
  res.status(200).json(row);

}

/**
 * @function lookupCostCenterByServiceUuid
 *
 * @description
 * Looks up the cost center associated with a service by the service's uuid.
 */
async function lookupCostCenterByServiceUuid(uid) {
  const { cc } = await db.one('SELECT GetCostCenterByServiceUuid(?) AS cc;', [uid]);
  return cc;
}

/**
 * @function lookupCostCenters
 *
 * @description
 * An HTTP interface to the lookupCostCentersByServiceUuid function.
 */
async function lookupCostCenter(req, res) {
  const id = await lookupCostCenterByServiceUuid(db.bid(req.params.uuid));
  res.status(200).json({ id });
}

/**
 * @method lookupService
 *
 * @description
 * Return a service instance from the database
 *
 * @param {String} uid - the uuid of a service
 * @returns {Promise} - returns the result of teh database query
 */
function lookupService(uid) {
  const sql = `
    SELECT
      BUID(s.uuid) AS uuid, s.name, s.enterprise_id, s.hidden,
      p.id AS project_id, p.name AS project_name
    FROM
      service AS s LEFT JOIN project p ON p.id = s.project_id
    WHERE
      s.uuid = ?;
  `;

  return db.one(sql, db.bid(uid), uid, 'service');
}

/**
 * @method setServiceCostCenter
 *
 * @description
 * Set the cost center for a service.
 * Assumes both parameters exist!
 *
 * @param {String} service_uuid - the uuid of a service
 * @param {number} cost_center_id - the id of the cost center
 * @returns {Promise} - returns the result of the database query
 */
function setServiceCostCenter(serviceUuid, costCenterId) {
  const delOld = 'DELETE FROM service_cost_center WHERE service_uuid = ?';
  const addNew = 'INSERT INTO service_cost_center (service_uuid, cost_center_id) VALUES (?, ?)';

  return db.transaction()
    .addQuery(delOld, [serviceUuid]) // Always delete any old version
    .addQuery(addNew, [serviceUuid, costCenterId])
    .execute();
}

exports.list = list;
exports.create = create;
exports.update = update;
exports.remove = remove;
exports.detail = detail;
exports.countServiceByProject = countServiceByProject;
exports.lookupService = lookupService;
exports.lookupCostCenterByServiceUuid = lookupCostCenterByServiceUuid;
exports.lookupCostCenter = lookupCostCenter;
exports.setServiceCostCenter = setServiceCostCenter;
