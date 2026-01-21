/**
* Rubrics Configuration Controller
*
* This controller exposes an API for reading and writing rubric configurations for payroll.
*/
const debug = require('debug')('payroll:rubric:configuration');
const db = require('../../../lib/db');

async function lookupRubricConfig(id) {
  const sql = `SELECT id, label FROM config_rubric WHERE id = ?`;

  const sqlItems = `
    SELECT config_rubric_item.id, config_rubric_item.config_rubric_id, config_rubric_item.rubric_payroll_id
      FROM config_rubric_item
    WHERE config_rubric_item.config_rubric_id = ?;
  `;

  const record = await db.one(sql, [id]);
  record.items = await db.exec(sqlItems, [id]);
  return record;

}

// Lists the Payroll RubricConfigs
async function list(req, res) {
  const sql = `SELECT id, label FROM config_rubric;`;

  const rows = await db.exec(sql);
  res.status(200).json(rows);
}

/**
* GET /payroll/rubric_config/:id
*
* Returns the detail of a single RubricConfig
*/
async function detail(req, res) {
  const { id } = req.params;

  const record = await lookupRubricConfig(id);
  res.status(200).json(record);
}

// POST /payroll/rubric_config
async function create(req, res) {
  const { label, items } = req.body;

  debug(`Creating rubric configuration ${label} with ${items.length} items.`);

  // first create the config_rubric item so we have the id
  const row = await db.exec('INSERT INTO config_rubric SET ?', [{ label }]);

  // NOTE(@jniles): you are allowed to make a rubric with just a label, and no items
  // attached.
  if (items && items.length > 0) {
    const configItems = items.map(id => ([id, row.insertId]));

    // next, create the config_rubric_item records
    await db.exec('INSERT INTO config_rubric_item (rubric_payroll_id, config_rubric_id) VALUES ?', [configItems]);
  }

  // if all goes well, return to the client
  // TODO(@jniles): use a db.transcation here so that we are able to roll this back as needed.
  res.status(201).json({ id : row.insertId });
}

// PUT /payroll/rubric_config/:id
async function update(req, res) {
  const sql = `UPDATE config_rubric SET ? WHERE id = ?;`;

  debug(`Updating rubric configuration with id ${req.params.id}.`);

  const items = req.body.items.map(id => ([id, req.params.id]));
  delete req.body.items;

  await db.exec(sql, [req.body, req.params.id]);

  const transaction = db.transaction()
    .addQuery(sql, [req.body, req.params.id])
    .addQuery('DELETE FROM config_rubric_item WHERE config_rubric_id = ?;', [req.params.id]);

  if (items.length > 0) {
    transaction
      .addQuery('INSERT INTO config_rubric_item (rubric_payroll_id, config_rubric_id) VALUES ?', [items]);
  }

  await transaction.execute();

  // all updates completed successfull, return full object to client
  const record = await lookupRubricConfig(req.params.id);

  res.status(200).json(record);
}

// DELETE /payroll/rubric_config/:id
async function del(req, res) {

  // check to see if the rubric configuration exists
  await lookupRubricConfig(req.params.id);

  // if so, delete it.
  await db.transaction()
    .addQuery('DELETE FROM config_rubric_item WHERE config_rubric_id = ?;', [req.params.id])
    .addQuery('DELETE FROM config_rubric WHERE id = ?;', [req.params.id])
    .execute();

  res.sendStatus(204);

}

// get list of rubrics configurations
exports.list = list;

// get details of a rubric configuration
exports.detail = detail;

// create a new rubric configuration
exports.create = create;

// update rubric configuration
exports.update = update;

// deletes a rubric configuration
exports.delete = del;

exports.lookupRubricConfig = lookupRubricConfig;
