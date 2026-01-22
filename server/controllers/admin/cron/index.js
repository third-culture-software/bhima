/**
 * HTTP END POINT
 * API for the crons http end point
 */
const db = require('../../../lib/db');

exports.list = list;
exports.details = details;
exports.update = update;
exports.remove = remove;
exports.create = create;

async function list(req, res) {
  const query = `SELECT id, label FROM cron`;
  const rows = await db.exec(query);
  res.status(200).json(rows);

}

async function details(req, res) {
  const query = `
    SELECT id, label FROM cron
    WHERE id = ?;
  `;
  const rows = await db.one(query, [req.params.id]);
  res.status(200).json(rows);
}

async function update(req, res) {
  const query = `
    UPDATE cron SET ? WHERE id = ?;
  `;
  const params = req.body;
  if (params.id) {
    delete params.id;
  }
  await db.exec(query, [params, req.params.id]);
  res.sendStatus(204);
}

async function remove(req, res) {
  const query = `
    DELETE FROM cron WHERE id = ?;
  `;
  await db.exec(query, [req.params.id]);
  res.sendStatus(204);

}

async function create(req, res) {
  const query = `
    INSERT INTO cron SET ?;
  `;
  const params = req.body;
  const result = await db.exec(query, [params]);
  res.status(201).json({ id : result.insertId });
}
