/**
* IprTax Controller
*
* This controller exposes an API to the client for reading and writing IprTax
*/

const db = require('../../lib/db');
const FilterParser = require('../../lib/filter');

// GET /IprTax
function lookupIprTax(id) {
  const sql = `
    SELECT taxe_ipr.id, taxe_ipr.label, taxe_ipr.description, taxe_ipr.currency_id, currency.symbol
    FROM taxe_ipr
    JOIN currency ON currency.id = taxe_ipr.currency_id
    WHERE taxe_ipr.id = ?`;

  return db.one(sql, [id]);
}

// Lists the Payroll IprTaxes
async function list(req, res) {
  const sql = `
    SELECT taxe_ipr.id, taxe_ipr.label, taxe_ipr.description, taxe_ipr.currency_id, currency.name AS currency_name
    FROM taxe_ipr
    JOIN currency ON currency.id = taxe_ipr.currency_id
    ;`;

  const rows = await db.exec(sql);
  res.status(200).json(rows);
}

/**
* GET /IprTax/:ID
*
* Returns the detail of a single IprTax
*/
async function detail(req, res) {
  const { id } = req.params;

  const record = await lookupIprTax(id);
  res.status(200).json(record);
}

// POST /IprTax
async function create(req, res) {
  const sql = `INSERT INTO taxe_ipr SET ?`;
  const data = req.body;

  const row = await db.exec(sql, [data]);
  res.status(201).json({ id : row.insertId });
}

// PUT /IprTax/:id
async function update(req, res) {
  const sql = `UPDATE taxe_ipr SET ? WHERE id = ?;`;

  await db.exec(sql, [req.body, req.params.id]);
  const record = await lookupIprTax(req.params.id);
  res.status(200).json(record);
}

// DELETE /IprTax/:id
async function del(req, res) {
  await db.delete('taxe_ipr', 'id', req.params.id, res, `Could not find a IprTax with id ${req.params.id}`);
}

// GET /IprTaxConfig
function lookupIprTaxConfig(id) {
  const sql = `
    SELECT tc.id, tc.rate, tc.tranche_annuelle_debut, tc.tranche_annuelle_fin,
      tc.tranche_mensuelle_debut, tc.tranche_mensuelle_fin, tc.ecart_annuel,
      tc.ecart_mensuel, tc.impot_annuel, tc.impot_mensuel, tc.cumul_annuel,
      tc.cumul_mensuel, tc.taxe_ipr_id, t.currency_id, c.symbol
    FROM taxe_ipr_configuration AS tc
    JOIN taxe_ipr AS t ON t.id = tc.taxe_ipr_id
    JOIN currency AS c ON c.id = t.currency_id
    WHERE tc.id = ?`;

  return db.one(sql, [id]);
}

// Lists the Payroll IprTaxes Configuration
async function listConfig(req, res) {
  const filters = new FilterParser(req.query);

  const sql = `
    SELECT tc.id, tc.rate, tc.tranche_annuelle_debut, tc.tranche_annuelle_fin,
    tc.tranche_mensuelle_debut, tc.tranche_mensuelle_fin, tc.ecart_annuel,
    tc.ecart_mensuel, tc.impot_annuel, tc.impot_mensuel, tc.cumul_annuel,
    tc.cumul_mensuel, tc.taxe_ipr_id, t.currency_id
    FROM taxe_ipr_configuration AS tc
    JOIN taxe_ipr AS t ON t.id = tc.taxe_ipr_id`;

  filters.equals('taxe_ipr_id');

  const query = filters.applyQuery(sql);
  const parameters = filters.parameters();

  const rows = await db.exec(query, parameters);
  res.status(200).json(rows);
}

/**
* GET /IprTaxConfig/:ID
*
* Returns the detail of a single IprTax
*/
async function detailConfig(req, res) {
  const { id } = req.params;

  const record = await lookupIprTaxConfig(id);
  res.status(200).json(record);

}

// POST /IprTaxConfig
async function createConfig(req, res) {
  const sql = `INSERT INTO taxe_ipr_configuration SET ?`;
  const data = req.body;

  const row = await db.exec(sql, [data]);
  res.status(201).json({ id : row.insertId });
}

// PUT /IprTaxConfig/:id
async function updateConfig(req, res) {
  const sql = `UPDATE taxe_ipr_configuration SET ? WHERE id = ?;`;

  await db.exec(sql, [req.body, req.params.id]);
  const record = await lookupIprTaxConfig(req.params.id);
  res.status(200).json(record);

}

// DELETE /IprTaxConfig/:id
async function deleteConfig(req, res) {
  await db.delete(
    'taxe_ipr_configuration', 'id', req.params.id, res,
    `Could not find a IprTax Configuration with id ${req.params.id}`,
  );
}

// get list of IprTax
exports.list = list;
exports.detail = detail;
exports.create = create;
exports.update = update;
exports.delete = del;

exports.listConfig = listConfig;
exports.detailConfig = detailConfig;
exports.createConfig = createConfig;
exports.updateConfig = updateConfig;
exports.deleteConfig = deleteConfig;
