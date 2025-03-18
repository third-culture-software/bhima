/**
 * The /projects HTTP API endpoint.
 *
 * This controller is responsible for implementing full CRUD on the
 * project table via the /projects endpoint.
 *
 * NOTE:
 *  this endpoint does not filter for enterprise ID.  We should probably
 *  move to doing this in the future.
 * */

const db = require('../../lib/db');

// expose the find function
exports.find = find;
exports.findDetails = findDetails;

/**
 * @function findDetails
 * @description return details of a project
 * @param {number} id the project id
 */
function findDetails(id) {
  const sql = `
    SELECT project.id, project.enterprise_id, project.abbr,
      project.zs_id, project.name, project.locked, project.logo
    FROM project
    WHERE project.id = ?;
  `;

  return db.one(sql, [id], id, 'project');
}

/**
 * @function find
 * @description find projects according params given
 * @param {object} params
 */
function find(params) {
  let sql;

  // send a larger response if complete is 1
  if (params.complete === '1') {
    sql = `
      SELECT project.id, project.enterprise_id, project.abbr,
        project.zs_id, project.name, project.locked, project.logo
      FROM project;`;
  } else {
    sql = 'SELECT project.id, project.name FROM project;';
  }

  if (params.locked === '0') {
    sql = `
      SELECT project.id, project.enterprise_id, project.abbr,
        project.zs_id, project.name, project.locked, project.logo
      FROM project WHERE project.locked = 0;`;
  }

  if (params.locked === '1') {
    sql = `
      SELECT project.id, project.enterprise_id, project.abbr,
        project.zs_id, project.name, project.locked, project.logo
      FROM project WHERE project.locked = 1;`;
  }

  return db.exec(sql);
}

/**
 * GET /projects?complete={0|1}
 *
 * Returns an array of {id, name} for each project in the database.
 */
exports.list = function list(req, res, next) {
  find(req.query)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next);

};

/**
 * GET /projects/:id
 *
 * Returns the details of a single project
 */
exports.detail = function detail(req, res, next) {
  findDetails(req.params.id)
    .then(project => res.status(200).json(project))
    .catch(next);

};

/**
 * POST /projects
 *
 * Creates a new project.
 */
exports.create = async function create(req, res, next) {
  try {
    const logo = req.files && req.files.length > 0 ? req.files[0].link : null;
    const data = req.body;
    const sql = `INSERT INTO project (name, abbr, enterprise_id, zs_id, locked, logo) VALUES (?, ?, ?, ?, ?, ?);`;
    const row = await db.exec(sql, [data.name, data.abbr, data.enterprise_id, data.zs_id, data.locked, logo]);
    res.status(201).send({ id : row.insertId });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /projects/:id
 *
 * Updates a new project.
 */
exports.update = async function update(req, res, next) {
  try {
    if (req.files && req.files.length > 0) {
      req.body.logo = req.files[0].link;
    }

    await db.exec('UPDATE project SET ? WHERE id = ?;', [req.body, req.params.id]);

    const sql = `
      SELECT project.id, project.enterprise_id, project.abbr,
        project.zs_id, project.name, project.locked, project.logo
      FROM project
      WHERE project.id = ?;
    `.trim();

    const project = await db.one(sql, [req.params.id]);
    res.status(200).json(project);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /projects/:id
 *
 * Deletes a project.
 */
exports.delete = function del(req, res, next) {
  db.delete('project', 'id', req.params.id, res, next, `No project found by id ${req.params.id}.`);
};
