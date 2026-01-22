/* eslint-disable no-eval */
/**
* SURVEY FORM Controller
*
* This controller exposes an API to the client for reading and writing SURVEY FORM
*/

const db = require('../../lib/db');
const NotFound = require('../../lib/errors/NotFound');
const FilterParser = require('../../lib/filter');
const util = require('../../lib/util');

// GET /survey_form
function lookupSurveyForm(id) {
  const sql = `
    SELECT s.id, s.rank, s.data_collector_management_id, s.type, s.name, s.label, s.hint, s.required, s.constraint,
    s.default, s.calculation, s.choice_list_id, s.filter_choice_list_id, s.other_choice
    FROM survey_form AS s
    WHERE s.id = ?`;

  return db.one(sql, [id]);
}

function getSurveyFormElement(params) {
  const filters = new FilterParser(params, { tableAlias : 's' });

  const sql = `
    SELECT s.id, s.rank, s.data_collector_management_id, s.type, s.name, s.label,
    s.hint, s.filter_choice_list_id, s.required, s.constraint, s.default,
    s.calculation, s.choice_list_id, s.other_choice, d.label AS data_collector_label,
    d.color, d.description, d.version_number, sft.label AS typeLabel,
    cl.label AS choiceListLabel, sft.is_list, f.name AS filterLabel,
    sft.label AS labelType, sft.type AS typeForm
    FROM survey_form AS s 
    JOIN survey_form_type AS sft ON sft.id = s.type 
    JOIN data_collector_management AS d ON d.id = s.data_collector_management_id
    LEFT JOIN survey_form AS f ON f.id = s.filter_choice_list_id
    LEFT JOIN choices_list_management AS cl On cl.id = s.choice_list_id`;

  filters.equals('data_collector_management_id');
  filters.equals('is_list', 'is_list', 'sft');
  filters.setOrder('ORDER BY s.rank ASC');

  const query = filters.applyQuery(sql);
  const parameters = filters.parameters();

  return db.exec(query, parameters);
}

async function list(req, res) {
  const rows = await getSurveyFormElement(req.query);
  res.status(200).json(rows);
}

// List of Survey Form Type
async function listSurveyformtype(req, res) {
  const sql = `SELECT id, label, type, is_list FROM survey_form_type;`;

  const rows = await db.exec(sql);
  res.status(200).json(rows);
}

/**
* GET /fill_form/:UUID
*
* Returns the detail of a single survey_form
*/
async function detail(req, res) {
  const { id } = req.params;

  const record = await lookupSurveyForm(id);
  res.status(200).json(record);
}

// POST /survey_form
async function create(req, res) {
  const sql = `INSERT INTO survey_form SET ?`;
  const data = req.body;

  const row = await db.exec(sql, [data]);
  res.status(201).json({ id : row.insertId });
}

// PUT /survey_form /:id
async function update(req, res) {
  const sql = `UPDATE survey_form SET ? WHERE id = ?;`;

  await db.exec(sql, [req.body, req.params.id]);
  const record = await lookupSurveyForm(req.params.id);
  // all updates completed successfull, return full object to client
  res.status(200).json(record);
}

// DELETE /survey_form/:id
async function remove(req, res) {
  const sql = `DELETE FROM survey_form WHERE id = ?;`;

  const row = await db.exec(sql, [req.params.id]);
  // if nothing happened, let the client know via a 404 error
  if (row.affectedRows === 0) {
    throw new NotFound(`Could not find a function with id ${req.params.id}`);
  }

  res.status(204).json();
}

function getCalculation(survey) {
  // the params data is used in function eval
  let formula = survey.calculation;

  formula = formula.replace(/.{/g, 'data.');
  formula = formula.replace(/}/g, '');
  const calculation = util.roundDecimal(eval(formula), 2);

  return calculation || 0;
}

// get list of surveyForm element
exports.list = list;

// get details of a surveyForm
exports.detail = detail;

// create a new surveyForm
exports.create = create;

// update surveyForm informations
exports.update = update;

// Delete a surveyForm
exports.delete = remove;

// get list of List of survey form
exports.listSurveyformtype = listSurveyformtype;

// get survey form element
exports.getSurveyFormElement = getSurveyFormElement;

// Get Calculation
exports.getCalculation = getCalculation;
