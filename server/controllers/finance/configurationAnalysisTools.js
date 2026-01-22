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
async function list(req, res) {
  const sql = `
    SELECT at.id, at.label, at.account_reference_id,
    ar.abbr, at.analysis_tool_type_id, tp.label AS typeLabel
    FROM configuration_analysis_tools AS at
    JOIN account_reference AS ar ON ar.id = at.account_reference_id
    JOIN analysis_tool_type AS tp ON tp.id = at.analysis_tool_type_id
    ORDER BY at.label ASC;
  `;

  const rows = await db.exec(sql);
  res.status(200).json(rows);
}

// toolsType
async function toolsType(req, res) {
  const sql = `
    SELECT id, label
    FROM analysis_tool_type;
  `;

  const rows = await db.exec(sql);
  res.status(200).json(rows);
}

/**
* GET /configuration_analysis_tools/:ID
*
* Returns the detail of a single configuration_analysis_tools
*/
async function detail(req, res) {
  const { id } = req.params;

  const record = await configurationAnalysisTools(id);
  res.status(200).json(record);
}

// POST /configuration_analysis_tools
async function create(req, res) {
  const sql = `INSERT INTO configuration_analysis_tools SET ?`;
  const data = req.body;

  const row = await db.exec(sql, [data]);
  res.status(201).json({ id : row.insertId });
}

// PUT /configuration_analysis_tools /:id
async function update(req, res) {
  const sql = `UPDATE configuration_analysis_tools SET ? WHERE id = ?;`;

  await db.exec(sql, [req.body, req.params.id]);
  const record = await configurationAnalysisTools(req.params.id);
  // all updates completed successfull, return full object to client
  res.status(200).json(record);
}

// DELETE /configuration_analysis_tools/:id
async function remove(req, res) {
  const sql = `DELETE FROM configuration_analysis_tools WHERE id = ?;`;

  const row = await db.exec(sql, [req.params.id]);
  // if nothing happened, let the client know via a 404 error
  if (row.affectedRows === 0) {
    throw new NotFound(`Could not find a function with id ${req.params.id}`);
  }

  res.status(204).json();
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
