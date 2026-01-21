/**
* Data Collector Management Controller
*
* This controller exposes an API to the client for reading and writing Data Collector Management
*/

const db = require('../../lib/db');
const NotFound = require('../../lib/errors/NotFound');
const FilterParser = require('../../lib/filter');

// GET /data_collector_management
function lookupDataCollectorManagement(id) {
  const sql = `
    SELECT id, label, description, version_number, color, is_related_patient, include_patient_data
    FROM data_collector_management
    WHERE data_collector_management.id = ?
  `;

  return db.one(sql, [id]);
}

// List
async function list(req, res) {
  const filters = new FilterParser(req.query);

  const sql = `
    SELECT id, label, description, version_number, color, is_related_patient, include_patient_data
    FROM data_collector_management
  `;

  filters.equals('label');
  filters.equals('description');
  filters.equals('version_number');
  filters.equals('is_related_patient');
  filters.equals('include_patient_data');
  filters.setOrder('ORDER BY label, version_number');

  const query = filters.applyQuery(sql);
  const parameters = filters.parameters();

  const dataCollector = await db.exec(query, parameters);

  const getSubmission = `
    SELECT dcm.id, COUNT(dcm.id) AS number_submissions
    FROM data_collector_management AS dcm
    JOIN survey_data AS sd ON sd.data_collector_management_id = dcm.id
    WHERE sd.is_deleted = 0
    GROUP BY dcm.id`;

  const submission = await db.exec(getSubmission);
  dataCollector.forEach(collector => {
    collector.number_submissions = 0;
    submission.forEach(sub => {
      if (collector.id === sub.id) {
        collector.number_submissions = sub.number_submissions;
      }
    });
  });

  res.status(200).json(dataCollector);
}

/**
* GET /data_collector_management/:ID
*
* Returns the detail of a single data_collector_management
*/
async function detail(req, res) {
  const { id } = req.params;

  const record = await lookupDataCollectorManagement(id);
  res.status(200).json(record);

}

// POST /data_collector_management
async function create(req, res) {
  const sql = `INSERT INTO data_collector_management SET ?`;
  const data = req.body;

  const row = await db.exec(sql, [data]);
  res.status(201).json({ id : row.insertId });
}

// PUT /data_collector_management /:id
async function update(req, res) {
  const sql = `UPDATE data_collector_management SET ? WHERE id = ?;`;

  await db.exec(sql, [req.body, req.params.id]);
  const record = await lookupDataCollectorManagement(req.params.id);
  // all updates completed successfull, return full object to client
  res.status(200).json(record);
}

// DELETE /data_collector_management/:id
async function remove(req, res) {
  const sql = `DELETE FROM data_collector_management WHERE id = ?;`;

  const row = await db.exec(sql, [req.params.id]);
  // if nothing happened, let the client know via a 404 error
  if (row.affectedRows === 0) {
    throw new NotFound(`Could not find a function with id ${req.params.id}`);
  }

  res.sentStatus(204);
}

// get list of dataCollectorManagement
exports.list = list;

// get details of a dataCollectorManagement
exports.detail = detail;

// create a new dataCollectorManagement
exports.create = create;

// update dataCollectorManagement informations
exports.update = update;

// Delete a dataCollectorManagement
exports.delete = remove;

// lookup Data Collector Management
exports.lookupDataCollectorManagement = lookupDataCollectorManagement;
