/**
* Rubric Controller
*
* This controller exposes an API to the client for reading and writing Rubric
*/

const rubricsIndexes = require('./rubricsIndex');
const db = require('../../../lib/db');
const FilterParser = require('../../../lib/filter');
const translate = require('../../../lib/helpers/translate');

// GET /rubrics
function lookupRubric(id) {
  const sql = `
    SELECT r.id, r.label, r.abbr, r.is_employee, r.is_percent, r.is_defined_employee, r.is_discount, r.is_social_care,
    r.debtor_account_id, r.expense_account_id, r.is_ipr, r.value, r.is_tax, r.is_membership_fee,
    r.is_associated_employee, r.is_seniority_bonus, r.position, r.is_monetary_value,
    r.is_family_allowances, r.is_indice, r.indice_type, r.indice_to_grap, r.is_linked_pension_fund, r.is_linked_to_grade
    FROM rubric_payroll AS r
    WHERE r.id = ? ORDER BY r.label ASC`;

  return db.one(sql, [id]);
}

// Lists the Payroll Rubrics
function list(req, res, next) {
  const filters = new FilterParser(req.query, { tableAlias : 'r' });

  const sql = `
    SELECT r.id, UPPER(r.label) AS label, r.abbr, r.is_employee, r.is_percent, r.is_defined_employee,
      r.is_discount, r.is_social_care,
      r.debtor_account_id, a4.number AS four_number, a4.label AS four_label,
      r.expense_account_id, a6.number AS six_number, a6.label AS six_label, r.is_ipr, r.value, r.is_tax,
      r.is_membership_fee, r.is_associated_employee, r.is_seniority_bonus, r.is_family_allowances,
      r.is_monetary_value, r.position, r.is_indice, r.indice_type, r.indice_to_grap, r.is_linked_pension_fund,
      r.is_linked_to_grade
    FROM rubric_payroll AS r
    LEFT JOIN account AS a4 ON a4.id = r.debtor_account_id
    LEFT JOIN account AS a6 ON a6.id = r.expense_account_id
  `;

  filters.equals('is_defined_employee');
  filters.equals('is_indice');
  filters.equals('is_linked_to_grade');
  filters.setOrder('ORDER BY r.is_indice, r.label');

  const query = filters.applyQuery(sql);
  const parameters = filters.parameters();

  db.exec(query, parameters)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next);

}

/**
 * GET /rubrics/:id
*
* Returns the detail of a single Rubric
*/
function detail(req, res, next) {
  const { id } = req.params;
  lookupRubric(id)
    .then((record) => {
      res.status(200).json(record);
    })
    .catch(next);

}

// POST /rubrics
function create(req, res, next) {
  const sql = `INSERT INTO rubric_payroll SET ?`;
  const data = req.body;
  db.exec(sql, [data])
    .then(result => {
      res.status(201).json({ id : result.insertId });
    })
    .catch(next);

}

function importIndexes(req, res, next) {
  const { lang } = req.body;
  const transaction = db.transaction();
  const trslt = translate(lang);

  rubricsIndexes.forEach(rubric => {
    rubric.label = trslt(rubric.label);
    transaction.addQuery('INSERT INTO rubric_payroll SET ?', rubric);
  });

  transaction.execute().then(() => {
    res.sendStatus(201);
  }).catch(next);
}

// PUT /rubrics/:id
function update(req, res, next) {
  const sql = `UPDATE rubric_payroll SET ? WHERE id = ?;`;
  const rubricPayrollId = req.params.id;
  db.exec(sql, [req.body, rubricPayrollId])
    .then(() => {
      return lookupRubric(rubricPayrollId);
    }).then(record => {
      res.status(200).json(record);
    })
    .catch(next);

}

// DELETE /rubrics/:id
function del(req, res, next) {
  db.delete('rubric_payroll', 'id', req.params.id, res, next, `Could not find a Rubric with id ${req.params.id}`);
}

// get list of Rubric
exports.list = list;

// get details of a Rubric
exports.detail = detail;

// create a new Rubric
exports.create = create;

// update Rubric informations
exports.update = update;

// Delete a Rubric
exports.delete = del;

// import rubrics (indexes)
exports.importIndexes = importIndexes;
