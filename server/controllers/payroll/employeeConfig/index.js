/**
* Employee Configuration Controller
*
* This controller exposes an API to the client for reading and writing Employee configuration
*/

const db = require('../../../lib/db');
const NotFound = require('../../../lib/errors/NotFound');

function lookupEmployeeConfig(id) {
  const sql = `SELECT id, label FROM config_employee WHERE id = ?`;
  return db.one(sql, [id]);
}

// Lists the Payroll Employee configurations
function list(req, res, next) {

  const sql = `
    SELECT c.id, c.label, COUNT(ci.employee_uuid) as numEmployees
    FROM config_employee AS c LEFT JOIN config_employee_item as ci
      ON c.id = ci.config_employee_id
    GROUP BY c.id;
  `;

  // NOTE(@jniles): this considers the employees available _right now_ as opposed to
  // when the configuration was created.  We don't store configuration created_at, so
  // we cannot make this determination.  If we did, we could filter based on the employee's
  // created_at date and figure out which employees should be listed here.
  const employeeSQL = `SELECT COUNT(employee.uuid) as totalEmployees FROM employee WHERE locked <> 1;`;

  Promise.all([sql, employeeSQL].map(stmt => db.exec(stmt)))
    .then(([rows, [{ totalEmployees }]]) => {

      // add in the total employees.
      const records = rows.map(row => {
        row.totalEmployees = totalEmployees;
        return row;
      });

      res.status(200).json(records);
    })
    .catch(next);
}

/**
* GET /employee_config/:id
*
* Returns the detail of a single employee configuration
*/
function detail(req, res, next) {
  const { id } = req.params;

  lookupEmployeeConfig(id)
    .then((record) => {
      res.status(200).json(record);
    })
    .catch(next)
    
}

// POST /EMPLOYEE_CONFIG
function create(req, res, next) {
  const sql = `INSERT INTO config_employee SET ?`;
  const { label } = req.body;

  db.exec(sql, [{ label }])
    .then((row) => {
      res.status(201).json({ id : row.insertId });
    })
    .catch(next)
    

}

// PUT/EMPLOYEE_CONFIG/:ID
function update(req, res, next) {
  const sql = `UPDATE config_employee SET ? WHERE id = ?;`;
  const data = db.convert(req.body, ['employee_uuid']);

  db.exec(sql, [data, req.params.id])
    .then(() => {
      return lookupEmployeeConfig(req.params.id);
    })
    .then((record) => {
    // all updates completed successfull, return full object to client
      res.status(200).json(record);
    })
    .catch(next)
    
}

// DELETE /employee_config/:ID
function del(req, res, next) {
  const { id } = req.params;

  db.transaction()
    .addQuery('DELETE FROM config_employee_item WHERE config_employee_id = ?;', [id])
    .addQuery('DELETE FROM config_employee WHERE id = ?', [id])
    .execute()
    .then((rows) => {
      const hasAffectedRows = rows.reduce((agg, row) => row.affectedRows + agg, 0);

      if (hasAffectedRows === 0) {
        throw new NotFound(`Could not find an employee configuration with id ${id}`);
      }

      res.sendStatus(204);
    })
    .catch(next)
    
}

/**
 * POST /employee_config/:id/setting
 *
 * Creates and updates an Employee Configuration.  This works by completely deleting
 * the payroll configuration and then replacing them with the new employee .
 */
function createConfig(req, res, next) {
  const data = req.body.configuration.map((uuid) => {
    return [db.bid(uuid), req.params.id];
  });

  const transaction = db.transaction();

  transaction
    .addQuery('DELETE FROM config_employee_item WHERE config_employee_id = ?;', [req.params.id]);

  // if an array of configuration has been sent, add them to an INSERT query
  // otherwise, the previous config will be cleared.
  if (req.body.configuration.length) {
    transaction
      .addQuery('INSERT INTO config_employee_item (employee_uuid, config_employee_id) VALUES ?', [data]);
  }

  transaction.execute()
    .then(() => {
      res.sendStatus(201);
    })
    .catch(next)
    
}

/**
 * GET /weekend_config/:id/setting
 *
 * @description
 * In this function, the `req.params.id` is the employee configuration id.
*/
function listConfig(req, res, next) {
  const sql = `
    SELECT id, config_employee_id, BUID(employee_uuid) AS employee_uuid
      FROM config_employee_item
    WHERE config_employee_item.config_employee_id = ?;
  `;

  db.exec(sql, [req.params.id])
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next)
    
}

// get list of Employee configuration
exports.list = list;

// get details of a Employee configuration
exports.detail = detail;

// create a new Employee configuration
exports.create = create;

// update Employee configurationinformations
exports.update = update;

// Delete a Employee configuration
exports.delete = del;

// Create or Update New Configuration of Payroll Week Days
exports.createConfig = createConfig;

// Get list of Week Days configured by Configuration
exports.listConfig = listConfig;
