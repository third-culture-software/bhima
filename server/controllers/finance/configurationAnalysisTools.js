/**
* Configuration Analysis Tools Controller
*
* This controller exposes an API to the client for reading and writing Break Even Reference
*/

const db = require('../../lib/db');
const NotFound = require('../../lib/errors/NotFound');

// GET /configuration_analysis_tools
function configurationAnalysisTools(id) {
  const sql = `
    SELECT id, label, account_reference_id, analysis_tool_type_id
    FROM configuration_analysis_tools
    WHERE configuration_analysis_tools.id = ?`;

  return db.one(sql, [id]);
}

// List
function list(req, res, next) {
  const sql = `
    SELECT at.id, at.label, at.account_reference_id,
    ar.abbr, at.analysis_tool_type_id, tp.label AS typeLabel
    FROM configuration_analysis_tools AS at
    JOIN account_reference AS ar ON ar.id = at.account_reference_id
    JOIN analysis_tool_type AS tp ON tp.id = at.analysis_tool_type_id
    ORDER BY at.label ASC;
  `;

  db.exec(sql)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next);

}

// toolsType
function toolsType(req, res, next) {
  const sql = `
    SELECT id, label
    FROM analysis_tool_type;
  `;

  db.exec(sql)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next);

}

/**
* GET /configuration_analysis_tools/:ID
*
* Returns the detail of a single configuration_analysis_tools
*/
function detail(req, res, next) {
  const { id } = req.params;

  configurationAnalysisTools(id)
    .then((record) => {
      res.status(200).json(record);
    })
    .catch(next);

}

// POST /configuration_analysis_tools
function create(req, res, next) {
  const sql = `INSERT INTO configuration_analysis_tools SET ?`;
  const data = req.body;

  db.exec(sql, [data])
    .then((row) => {
      res.status(201).json({ id : row.insertId });
    })
    .catch(next);

}

// PUT /configuration_analysis_tools /:id
function update(req, res, next) {
  const sql = `UPDATE configuration_analysis_tools SET ? WHERE id = ?;`;

  db.exec(sql, [req.body, req.params.id])
    .then(() => {
      return configurationAnalysisTools(req.params.id);
    })
    .then((record) => {
    // all updates completed successfull, return full object to client
      res.status(200).json(record);
    })
    .catch(next);

}

// DELETE /configuration_analysis_tools/:id
function remove(req, res, next) {
  const sql = `DELETE FROM configuration_analysis_tools WHERE id = ?;`;

  db.exec(sql, [req.params.id])
    .then((row) => {
    // if nothing happened, let the client know via a 404 error
      if (row.affectedRows === 0) {
        throw new NotFound(`Could not find a function with id ${req.params.id}`);
      }

      res.status(204).json();
    })
    .catch(next);

}

// get list of configurationAnalysisTools
exports.list = list;

// get details of a configurationAnalysisTools
exports.detail = detail;

// create a new configurationAnalysisTools
exports.create = create;

// update configurationAnalysisTools informations
exports.update = update;

// Delete a configurationAnalysisTools
exports.delete = remove;

// get list of analysis tool type
exports.toolsType = toolsType;
