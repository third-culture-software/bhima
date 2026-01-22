/**
 * Stock Requestor Type Controller
 */
const db = require('../../../lib/db');
const FilterParser = require('../../../lib/filter');

function find(options) {
  const sql = 'SELECT id, type_key, title_key FROM stock_requestor_type';
  const filters = new FilterParser(options);
  filters.equals('id', 'id');
  filters.equals('type_key', 'type_key');

  const query = filters.applyQuery(sql);
  const queryParameters = filters.parameters();
  return db.exec(query, queryParameters);
}

function lookup(id) {
  const sql = 'SELECT id, type_key, title_key FROM stock_requestor_type WHERE id = ?';
  return db.one(sql, [id]);
}

module.exports.list = async (req, res) => {
  const rows = await find(req.query);
  res.status(200).json(rows);
};

module.exports.details = async (req, res) => {
  const row = await lookup(req.params.id);
  res.status(200).json(row);
};
