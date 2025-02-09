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
function list(req, res, next) {
  const sql = `
    SELECT taxe_ipr.id, taxe_ipr.label, taxe_ipr.description, taxe_ipr.currency_id, currency.name AS currency_name
    FROM taxe_ipr
    JOIN currency ON currency.id = taxe_ipr.currency_id
    ;`;

  db.exec(sql)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next);

}

/**
* GET /IprTax/:ID
*
* Returns the detail of a single IprTax
*/
function detail(req, res, next) {
  const { id } = req.params;

  lookupIprTax(id)
    .then((record) => {
      res.status(200).json(record);
    })
    .catch(next);

}

// POST /IprTax
function create(req, res, next) {
  const sql = `INSERT INTO taxe_ipr SET ?`;
  const data = req.body;

  db.exec(sql, [data])
    .then((row) => {
      res.status(201).json({ id : row.insertId });
    })
    .catch(next);

}

// PUT /IprTax/:id
async function update(req, res, next) {
  const sql = `UPDATE taxe_ipr SET ? WHERE id = ?;`;

  try {
    await db.exec(sql, [req.body, req.params.id]);
    const record = await lookupIprTax(req.params.id);
    res.status(200).json(record);
  } catch (e) { next(e); }
}

// DELETE /IprTax/:id
function del(req, res, next) {
  db.delete('taxe_ipr', 'id', req.params.id, res, next, `Could not find a IprTax with id ${req.params.id}`);
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
function listConfig(req, res, next) {
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

  db.exec(query, parameters)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next);

}

/**
* GET /IprTaxConfig/:ID
*
* Returns the detail of a single IprTax
*/
function detailConfig(req, res, next) {
  const { id } = req.params;

  lookupIprTaxConfig(id)
    .then((record) => {
      res.status(200).json(record);
    })
    .catch(next);

}

// POST /IprTaxConfig
function createConfig(req, res, next) {
  const sql = `INSERT INTO taxe_ipr_configuration SET ?`;
  const data = req.body;

  db.exec(sql, [data])
    .then((row) => {
      res.status(201).json({ id : row.insertId });
    })
    .catch(next);

}

// PUT /IprTaxConfig/:id
async function updateConfig(req, res, next) {
  const sql = `UPDATE taxe_ipr_configuration SET ? WHERE id = ?;`;

  try {
    await db.exec(sql, [req.body, req.params.id]);
    const record = await lookupIprTaxConfig(req.params.id);
    res.status(200).json(record);
  } catch (e) { next(e); }

}

// DELETE /IprTaxConfig/:id
function deleteConfig(req, res, next) {
  db.delete(
    'taxe_ipr_configuration', 'id', req.params.id, res, next,
    `Could not find a IprTax Configuration with id ${req.params.id}`,
  );
}

// get list of IprTax
exports.list = list;

// get details of a IprTax
exports.detail = detail;

// create a new IprTax
exports.create = create;

// update IprTax informations
exports.update = update;

// Delete a IprTax
exports.delete = del;

// get list of IprTax Configuration
exports.listConfig = listConfig;

// get details of a IprTax Configuration
exports.detailConfig = detailConfig;

// create a new IprTax Configuration
exports.createConfig = createConfig;

// update IprTax  Configuration
exports.updateConfig = updateConfig;

// Delete a IprTax  Configuration
exports.deleteConfig = deleteConfig;
