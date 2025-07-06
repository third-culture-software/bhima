/**
* Weekend Configuration Controller
*
* This controller exposes an API to the client for reading and writing Weekend configuration
*/

const db = require('../../../lib/db');

// GET /weekend_config
function lookupWeekendConfig(id) {
  const sql = `
    SELECT w.id, w.label
    FROM weekend_config AS w
    WHERE w.id = ?`;

  return db.one(sql, [id]);
}

// Lists the Payroll Weekend configurations
async function list(req, res) {
  const sql = `
    SELECT w.id, w.label
    FROM weekend_config AS w
  ;`;

  const rows = await db.exec(sql);
  res.status(200).json(rows);

}

/**
* GET /weekend_config/:id
*
* Returns the detail of a single Weekend
*/
async function detail(req, res) {
  const { id } = req.params;

  const record = await lookupWeekendConfig(id);
  res.status(200).json(record);

}

// POST /weekend_config
async function create(req, res) {
  const sql = `INSERT INTO weekend_config SET ?`;
  const data = req.body;
  const configuration = data.daysChecked;
  delete data.daysChecked;

  const { insertId } = await db.exec(sql, [data]);
  const dataConfigured = configuration.map(id => ([id, insertId]));
  await db.exec('INSERT INTO config_week_days (indice, weekend_config_id) VALUES ?', [dataConfigured]);
  res.status(201).json({ id : insertId });
}

// PUT /weekend_config /:id
async function update(req, res) {
  const transaction = db.transaction();
  const data = req.body;
  const dataconfigured = data.daysChecked.map(id => ([id, req.params.id]));

  delete data.daysChecked;

  transaction
    .addQuery('UPDATE weekend_config SET ? WHERE id = ?;', [data, req.params.id])
    .addQuery('DELETE FROM config_week_days WHERE weekend_config_id = ?;', [req.params.id]);

  // if an array of configuration has been sent, add them to an INSERT query
  if (dataconfigured.length) {
    transaction
      .addQuery('INSERT INTO config_week_days (indice, weekend_config_id) VALUES ?', [dataconfigured]);
  }

  await transaction.execute();
  const record = await lookupWeekendConfig(req.params.id);
  // all updates completed successfull, return full object to client
  res.status(200).json(record);

}

// DELETE /weekend_config/:id
function del(req, res, next) {
  db.delete(
    'weekend_config', 'id', req.params.id, res, next, `Could not find a Weekend configuration with id ${req.params.id}`,
  );
}

/**
 * GET /weekend_config/:id/setting
*/
async function listConfig(req, res) {
  const sql = `
    SELECT id, indice, weekend_config_id
      FROM config_week_days
    WHERE config_week_days.weekend_config_id = ?;
  `;

  const rows = await db.exec(sql, [req.params.id]);
  res.status(200).json(rows);
}

// get list of Weekend configuration
exports.list = list;

// get details of a Weekend configuration
exports.detail = detail;

// create a new Weekend configuration
exports.create = create;

// update Weekend configurationinformations
exports.update = update;

// Delete a Weekend configuration
exports.delete = del;

// Get list of Week Days configured by Configuration
exports.listConfig = listConfig;
