/**
* CHOICES LIST MANAGEMENT Controller
*
* This controller exposes an API to the client for reading and writing CHOICES LIST MANAGEMENT
*/

const db = require('../../lib/db');
const NotFound = require('../../lib/errors/NotFound');
const FilterParser = require('../../lib/filter');

// GET /choices_list_management
function lookupchoicesListManagement(id) {
  const sql = `
    SELECT id, name, label, fixed, group_label, parent, is_title, is_group
    FROM choices_list_management
    WHERE choices_list_management.id = ?`;

  return db.one(sql, [id]);
}

async function list(req, res) {
  const filters = new FilterParser(req.query);

  const sql = `
    SELECT id, name, label, fixed, group_label, parent, is_title, is_group
    FROM choices_list_management
  `;

  filters.equals('is_title');
  filters.equals('is_group');
  filters.equals('parent');
  filters.equals('group_label');
  filters.setOrder('ORDER BY label');

  const query = filters.applyQuery(sql);
  const parameters = filters.parameters();

  const rows = await db.exec(query, parameters);
  res.status(200).json(rows);
}

/**
* GET /choices_list_management/:ID
*
* Returns the detail of a single choices_list_management
*/
async function detail(req, res) {
  const { id } = req.params;

  const record = await lookupchoicesListManagement(id);
  res.status(200).json(record);
}

// POST /choices_list_management
async function create(req, res) {
  const sql = `INSERT INTO choices_list_management SET ?`;
  const data = req.body;
  // Set 0 (root) like default parent
  data.parent = data.parent || 0;

  const row = await db.exec(sql, [data]);
  res.status(201).json({ id : row.insertId });
}

// PUT /choices_list_management /:id
async function update(req, res) {
  const sql = `UPDATE choices_list_management SET ? WHERE id = ?;`;

  await db.exec(sql, [req.body, req.params.id]);
  const record = await lookupchoicesListManagement(req.params.id);
  // all updates completed successfull, return full object to client
  res.status(200).json(record);
}

// DELETE /choices_list_management/:id
async function remove(req, res) {
  const sql = `DELETE FROM choices_list_management WHERE id = ?;`;

  const row = await db.exec(sql, [req.params.id]);
  // if nothing happened, let the client know via a 404 error
  if (row.affectedRows === 0) {
    throw new NotFound(`Could not find a choices list with id ${req.params.id}`);
  }

  res.sendStatus(204);
}

// get list of choicesListManagement
exports.list = list;

// get details of a choicesListManagement
exports.detail = detail;

// create a new choicesListManagement
exports.create = create;

// update choicesListManagement informations
exports.update = update;

// Delete a choicesListManagement
exports.delete = remove;
