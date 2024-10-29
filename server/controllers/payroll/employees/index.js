/**
 * @module employees
 *
 * @description
 * This controller is responsible for implementing all crud on the
 * employees table through the `/employees` endpoint.
 * The /employees HTTP API endpoint
 *
 * NOTE: This api does not handle the deletion of employees because
 * that subject is not in the actuality.
 *
 * @requires db
 * @requires uuid
 * @requires NotFound
 * @requires filter
 */

const { uuid } = require('../../../lib/util');
const db = require('../../../lib/db');
const NotFound = require('../../../lib/errors/NotFound');
const FilterParser = require('../../../lib/filter');

exports.list = list;
exports.create = create;
exports.update = update;
exports.detail = detail;
exports.find = find;
exports.advantage = advantage;
exports.lookupEmployeeAdvantages = lookupEmployeeAdvantages;
exports.patientToEmployee = patientToEmployee;
exports.lookupEmployee = lookupEmployee;

/**
 * Get list of availaible holidays for an employee
 */
exports.listHolidays = function listHolidays(req, res, next) {
  const pp = JSON.parse(req.params.pp);
  const sql = `
    SELECT holiday.id, holiday.label, holiday.dateFrom, holiday.percentage, holiday.dateTo
     FROM holiday WHERE
       ((holiday.dateFrom >= ? AND holiday.dateFrom <= ?)
       (holiday.dateTo >= ? AND holiday.dateTo <= ?) OR
       (holiday.dateFrom <= ? AND holiday.dateTo >= ?)) AND
       holiday.employee_uuid = ?;
 `;

  const data = [
    pp.dateFrom, pp.dateTo,
    pp.dateFrom, pp.dateTo,
    pp.dateFrom, pp.dateFrom,
    db.bid(req.params.employee_uuid),
  ];

  db.exec(sql, data)
    .then(rows => {
      res.status(200).json(rows);
    })
    .catch(next)
    .done();
};

/**
 * Check an existing holiday
 */
exports.checkHoliday = function checkHoliday(req, res, next) {
  let sql = `
    SELECT id, BUID(employee_uuid) AS employee_uuid, label, dateTo, percentage, dateFrom FROM holiday
    WHERE employee_uuid = ?
    AND ((dateFrom >= ?) OR (dateTo >= ?) OR (dateFrom >= ?) OR (dateTo >= ?))
    AND ((dateFrom <= ?) OR (dateTo <= ?) OR (dateFrom <= ?) OR (dateTo <= ?))`;

  const data = [
    db.bid(req.query.employee_uuid),
    req.query.dateFrom, req.query.dateFrom, req.query.dateTo, req.query.dateTo,
    req.query.dateFrom, req.query.dateFrom, req.query.dateTo, req.query.dateTo,
  ];

  if (req.query.line !== '') {
    sql += ' AND id <> ?';
    data.push(req.query.line);
  }

  db.exec(sql, data)
    .then(rows => {
      res.status(200).json(rows);
    })
    .catch(next)
    .done();
};

/**
 * Check an existing offday
 */
exports.checkOffday = function checkHoliday(req, res, next) {
  const sql = `SELECT * FROM offday WHERE date = ? AND id <> ?`;
  db.exec(sql, [req.query.date, req.query.id])
    .then(rows => {
      res.status(200).json(rows);
    })
    .catch(next)
    .done();
};

/**
 * @method lookupEmployee
 *
 * @description
 * Looks up an employee in the database by their id.
 *
 * @param uuid - the uuid of the employee to look up
 * @returns {Promise} - the result of the database query.
 */
function lookupEmployee(uid) {
  const sql = `
    SELECT
      BUID(employee.uuid) AS uuid, employee.code, patient.display_name, patient.sex,
      patient.dob, employee.date_embauche, BUID(employee.service_uuid) as service_uuid,
      employee.nb_spouse, employee.nb_enfant, BUID(employee.grade_uuid) as grade_uuid,
      employee.locked, title_employee.is_medical, grade.text, grade.basic_salary,
      fonction.id AS fonction_id, fonction.fonction_txt, service.name AS service_txt, patient.hospital_no,
      patient.phone, patient.email, patient.address_1 AS adresse, BUID(employee.patient_uuid) AS patient_uuid,
      employee.bank, employee.bank_account, employee.title_employee_id, title_employee.title_txt,
      employee.individual_salary, grade.code AS code_grade, BUID(debtor.uuid) as debtor_uuid,
      debtor.text AS debtor_text, BUID(debtor.group_uuid) as debtor_group_uuid, entity_map.text AS reference,
      BUID(creditor.uuid) as creditor_uuid, creditor.text AS creditor_text,
      BUID(creditor.group_uuid) as creditor_group_uuid, creditor_group.account_id,
      BUID(current_location_id) as current_location_id, BUID(origin_location_id) as origin_location_id
    FROM employee
      JOIN grade ON employee.grade_uuid = grade.uuid
      LEFT JOIN fonction ON employee.fonction_id = fonction.id
      JOIN patient ON patient.uuid = employee.patient_uuid
      JOIN debtor ON patient.debtor_uuid = debtor.uuid
      JOIN creditor ON employee.creditor_uuid = creditor.uuid
      JOIN creditor_group ON creditor_group.uuid = creditor.group_uuid
      LEFT JOIN service ON service.uuid = employee.service_uuid
      LEFT JOIN entity_map ON entity_map.uuid = employee.creditor_uuid
      LEFT JOIN title_employee ON title_employee.id = employee.title_employee_id
    WHERE employee.uuid = ?;
  `;

  return db.one(sql, [db.bid(uid)], uid, 'employee');
}

/**
 * @method detail
 *
 * @description
 * Returns an object of details of an employee referenced by an `id` in the database
 */
function detail(req, res, next) {
  lookupEmployee(req.params.uuid)
    .then(record => {
      res.status(200).json(record);
    })
    .catch(next)
    .done();
}

/**
 * @method advantage
 *
 * @description
 * Returns an object of details of an employee Payroll Advantage by an `uuid` in the database
 */
function advantage(req, res, next) {
  lookupEmployeeAdvantages(req.params.uuid)
    .then(record => {
      res.status(200).json(record);
    })
    .catch(next)
    .done();
}

function lookupEmployeeAdvantages(uid) {
  const sql = `
    SELECT employee_advantage.employee_uuid, employee_advantage.rubric_payroll_id, employee_advantage.value
    FROM employee_advantage
    WHERE employee_uuid = ?
  `;

  return db.exec(sql, [db.bid(uid)]);
}

/**
 * @method update
 *
 * @description
 * Update details of an employee referenced by a `uuid` in the database
 */
function update(req, res, next) {
  const employeeAdvantage = [];

  const employee = db.convert(req.body, [
    'grade_uuid', 'debtor_group_uuid', 'creditor_group_uuid', 'creditor_uuid', 'debtor_uuid', 'patient_uuid',
    'current_location_id', 'origin_location_id', 'service_uuid',
  ]);

  // Remove whitespace from Patient display_name
  if (employee.display_name) {
    employee.display_name = employee.display_name.trim();
  }

  const employeeAdvantagePayroll = employee.payroll;

  if (employeeAdvantagePayroll) {
    Object.keys(employeeAdvantagePayroll).forEach((key) => {
      employeeAdvantage.push([db.bid(req.params.uuid), key, employeeAdvantagePayroll[key]]);
    });
  }

  if (employee.dob) {
    employee.dob = new Date(employee.dob);
  }

  if (employee.date_embauche) {
    employee.date_embauche = new Date(employee.date_embauche);
  }

  const creditor = {
    uuid : employee.creditor_uuid,
    group_uuid : employee.creditor_group_uuid,
    text : `Crediteur [${employee.display_name}]`,
  };

  const debtor = {
    uuid : employee.debtor_uuid,
    group_uuid : employee.debtor_group_uuid,
    text : `Debiteur [${employee.display_name}]`,
  };

  const patient = {
    display_name : employee.display_name,
    dob : employee.dob,
    current_location_id : employee.current_location_id,
    origin_location_id : employee.origin_location_id,
    hospital_no : employee.hospital_no,
    sex : employee.sex,
    phone : employee.phone,
    email : employee.email,
    address_1 : employee.adresse,
  };

  const clean = {
    date_embauche : employee.date_embauche,
    service_uuid : employee.service_uuid,
    nb_enfant : employee.nb_enfant,
    grade_uuid : employee.grade_uuid,
    // TODO(@jniles): maybe structure this API better so we don't have to default to this.
    locked : employee.locked || 0,
    fonction_id : employee.fonction_id,
    bank : employee.bank,
    bank_account : employee.bank_account,
    individual_salary : employee.individual_salary,
    code : employee.code,
    title_employee_id : employee.title_employee_id,
  };

  const updateCreditor = `UPDATE creditor SET ? WHERE creditor.uuid = ?`;
  const updateDebtor = `UPDATE debtor SET ? WHERE debtor.uuid = ?`;
  const updatePatient = `UPDATE patient SET ? WHERE uuid = ?`;
  const sql = `UPDATE employee SET ? WHERE employee.uuid = ?`;
  const delEmployee = `DELETE FROM employee_advantage WHERE employee_uuid = ?`;
  const sqlEmployeeAdvantage = 'INSERT INTO employee_advantage (employee_uuid, rubric_payroll_id, value) VALUES ?';

  const transaction = db.transaction();

  transaction
    .addQuery(updateCreditor, [creditor, creditor.uuid])
    .addQuery(updateDebtor, [debtor, debtor.uuid])
    .addQuery(updatePatient, [patient, employee.patient_uuid])
    .addQuery(sql, [clean, db.bid(req.params.uuid)]);

  if (employeeAdvantage.length) {
    transaction.addQuery(delEmployee, [db.bid(req.params.uuid)]);
    transaction.addQuery(sqlEmployeeAdvantage, [employeeAdvantage]);
  }

  transaction.execute()
    .then(results => {
      if (!results[3].affectedRows) {
        throw new NotFound(`Could not find an employee with Uuid ${req.params.uuid}.`);
      }

      return lookupEmployee(req.params.uuid);
    })
    .then(rows => {
      res.status(200).json(rows);
    })
    .catch(next)
    .done();
}

/**
 * @method create
 *
 * @description
 * This function is responsible for creating a new employee in the database
 */
function create(req, res, next) {
  // cast as data object and add unique ids
  const data = req.body;

  const employeeUuid = data.uuid || uuid();

  // Provide UUID if the client has not specified
  data.uuid = employeeUuid;

  const patientID = uuid();
  const employeeAdvantage = [];

  data.creditor_uuid = data.creditor_uuid || uuid();
  data.debtor_uuid = data.debtor_uuid || uuid();
  data.patient_uuid = patientID;

  // convert uuids to binary uuids as necessary
  const employee = db.convert(data, [
    'uuid', 'grade_uuid', 'debtor_group_uuid', 'creditor_group_uuid', 'creditor_uuid',
    'debtor_uuid', 'current_location_id', 'origin_location_id', 'patient_uuid', 'service_uuid',
  ]);

  // Remove whitespace from Patient display_name
  if (employee.display_name) {
    employee.display_name = employee.display_name.trim();
  }

  const employeeAdvantagePayroll = employee.payroll;

  if (employeeAdvantagePayroll) {
    Object.keys(employeeAdvantagePayroll).forEach((key) => {
      employeeAdvantage.push([employee.uuid, key, employeeAdvantagePayroll[key]]);
    });
  }

  if (employee.dob) {
    employee.dob = new Date(employee.dob);
  }

  if (employee.date_embauche) {
    employee.date_embauche = new Date(employee.date_embauche);
  }

  const creditor = {
    uuid : employee.creditor_uuid,
    group_uuid : employee.creditor_group_uuid,
    text : `Crediteur [${employee.display_name}]`,
  };

  const debtor = {
    uuid : employee.debtor_uuid,
    group_uuid : employee.debtor_group_uuid,
    text : `Debiteur [${employee.display_name}]`,
  };

  const patient = {
    uuid : employee.patient_uuid,
    project_id : req.session.project.id,
    display_name : employee.display_name,
    dob : employee.dob,
    current_location_id : employee.current_location_id,
    origin_location_id : employee.origin_location_id,
    hospital_no : employee.hospital_no,
    debtor_uuid : employee.debtor_uuid,
    user_id : req.session.user.id,
    sex : employee.sex,
  };

  delete employee.debtor_group_uuid;
  delete employee.creditor_group_uuid;
  delete employee.current_location_id;
  delete employee.origin_location_id;
  delete employee.debtor_uuid;
  delete employee.hospital_no;

  // Delete not necessary Data for Employee
  delete employee.display_name;
  delete employee.dob;
  delete employee.sex;
  delete employee.adresse;
  delete employee.phone;
  delete employee.email;
  delete employee.payroll;

  const writeCreditor = 'INSERT INTO creditor SET ?';
  const writeDebtor = 'INSERT INTO debtor SET ?';
  const writePatient = 'INSERT INTO patient SET ?';
  const sqlEmployeeAdvantage = 'INSERT INTO employee_advantage (employee_uuid, rubric_payroll_id, value) VALUES ?';
  const sql = 'INSERT INTO employee SET ?';
  const transaction = db.transaction();

  transaction
    .addQuery(writeCreditor, [creditor])
    .addQuery(writeDebtor, [debtor])
    .addQuery(writePatient, [patient])
    .addQuery(sql, [employee]);

  if (employeeAdvantage.length) {
    transaction.addQuery(sqlEmployeeAdvantage, [employeeAdvantage]);
  }

  transaction.execute()
    .then(() => {
      res.status(201).json({ uuid : employeeUuid, patient_uuid : patientID });
    })
    .catch(next)
    .done();
}

/**
 * @method list
 *
 * @description
 * A multi-parameter function that uses find() to query the database for
 * employee records.
 *
 */
function list(req, res, next) {
  find(req.query)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next)
    .done();
}

/**
 * @method find
 *
 * @description
 * This function scans the employee table in the database to find all values
 * matching parameters provided in the options parameter.
 *
 * @param {Object} options - a JSON of query parameters
 * @returns {Promise} - the result of the promise query on the database.
 */
function find(options) {
  // ensure expected options are parsed appropriately
  db.convert(options, ['uuid', 'grade_uuid', 'creditor_uuid', 'patient_uuid', 'service_uuid']);
  if (options.cost_center_id) {
    options.cost_center_id = Number(options.cost_center_id);
  }

  const sql = `
    SELECT
      BUID(employee.uuid) AS uuid, employee.code, patient.display_name, patient.sex,
      patient.dob, employee.date_embauche, BUID(employee.service_uuid) as service_uuid, employee.nb_spouse,
      employee.nb_enfant, BUID(employee.grade_uuid) as grade_uuid, employee.locked, grade.text,
      grade.basic_salary, fonction.id AS fonction_id, fonction.fonction_txt, patient.hospital_no,
      patient.phone, patient.email, patient.address_1 AS adresse, BUID(employee.patient_uuid) AS patient_uuid,
      employee.bank, employee.bank_account, employee.title_employee_id, title_employee.title_txt,
      employee.individual_salary, title_employee.is_medical, grade.code AS code_grade, BUID(debtor.uuid) as debtor_uuid,
      debtor.text AS debtor_text, BUID(debtor.group_uuid) as debtor_group_uuid,
      BUID(creditor.uuid) as creditor_uuid, creditor.text AS creditor_text,
      BUID(creditor.group_uuid) as creditor_group_uuid, creditor_group.account_id,
      BUID(current_location_id) as current_location_id, BUID(origin_location_id) as origin_location_id,
      service.name as service_name, cc.label AS cost_center, cc.id AS cost_center_id,
      entity_map.text as reference
    FROM employee
     JOIN grade ON employee.grade_uuid = grade.uuid
     LEFT JOIN fonction ON employee.fonction_id = fonction.id
     JOIN patient ON patient.uuid = employee.patient_uuid
     JOIN debtor ON patient.debtor_uuid = debtor.uuid
     JOIN creditor ON employee.creditor_uuid = creditor.uuid
     JOIN creditor_group ON creditor_group.uuid = creditor.group_uuid
     LEFT JOIN service ON service.uuid = employee.service_uuid
     LEFT JOIN service_cost_center AS scc ON scc.service_uuid = service.uuid
     LEFT JOIN cost_center AS cc ON cc.id = scc.cost_center_id
     LEFT JOIN entity_map ON entity_map.uuid = employee.creditor_uuid
     LEFT JOIN title_employee ON title_employee.id = employee.title_employee_id
  `;

  const filters = new FilterParser(options, { tableAlias : 'employee' });

  filters.dateFrom('dateBirthFrom', 'dob', 'patient');
  filters.dateFrom('dateEmbaucheFrom', 'date_embauche');
  filters.dateTo('dateBirthTo', 'dob', 'patient');
  filters.dateTo('dateEmbaucheTo', 'date_embauche');
  filters.equals('code', 'code', 'employee');
  filters.equals('fonction_id', 'fonction_id', 'employee');
  filters.equals('grade_uuid', 'grade_uuid', 'employee');
  filters.equals('is_medical', 'is_medical', 'title_employee');
  filters.equals('locked', 'locked', 'employee');
  filters.equals('reference', 'text', 'entity_map');
  filters.equals('service_uuid', 'service_uuid', 'employee');
  filters.equals('sex', 'sex', 'patient');
  filters.equals('title_employee_id', 'title_employee_id', 'employee');
  filters.fullText('display_name', 'display_name', 'patient');


  // NOTE(@jniles) - why does this query exist in the fashion it does?
  if (options.cost_center_id) {
    if (options.cost_center_id > -1) {
      filters.equals('cost_center_id', 'id', 'cc');
    } else {
      filters.custom('cost_center_id', 'cc.id IS NULL');
    }
  }

  // @TODO Support ordering query
  filters.setOrder('ORDER BY patient.display_name ASC');

  // applies filters and limits to defined sql, get parameters in correct order
  const query = filters.applyQuery(sql);
  const parameters = filters.parameters();

  return db.exec(query, parameters);
}

/**
 * @method patientToEmployee
 *
 * @description
 * This function is responsible for transform a Patient to New employee in the database
 */
function patientToEmployee(req, res, next) {
  const data = req.body;
  const patientUuid = data.patient_uuid;
  const employeeUuid = uuid();

  data.creditor_uuid = uuid();
  data.uuid = employeeUuid;

  const employeeAdvantage = [];

  // convert uuids to binary uuids as necessary
  const employee = db.convert(data, [
    'uuid', 'grade_uuid', 'debtor_group_uuid', 'creditor_group_uuid', 'creditor_uuid',
    'debtor_uuid', 'current_location_id', 'origin_location_id', 'patient_uuid', 'service_uuid',
  ]);

  // Remove whitespace from Patient display_name
  employee.display_name = employee.display_name.trim();

  const employeeAdvantagePayroll = employee.payroll;

  if (employeeAdvantagePayroll) {
    Object.keys(employeeAdvantagePayroll).forEach((key) => {
      employeeAdvantage.push([employee.uuid, key, employeeAdvantagePayroll[key]]);
    });
  }

  const creditor = {
    uuid : employee.creditor_uuid,
    group_uuid : employee.creditor_group_uuid,
    text : `Crediteur [${employee.display_name}]`,
  };

  const debtor = {
    uuid : employee.debtor_uuid,
    group_uuid : employee.debtor_group_uuid,
    text : `Debiteur [${employee.display_name}]`,
  };

  if (employee.date_embauche) {
    employee.date_embauche = new Date(employee.date_embauche);
  }

  delete employee.debtor_group_uuid;
  delete employee.creditor_group_uuid;
  delete employee.current_location_id;
  delete employee.origin_location_id;
  delete employee.debtor_uuid;
  delete employee.hospital_no;

  // delete data that shouldn't be attached to employees
  delete employee.display_name;
  delete employee.dob;
  delete employee.sex;
  delete employee.adresse;
  delete employee.phone;
  delete employee.email;
  delete employee.is_patient;
  delete employee.payroll;

  const writeCreditor = 'INSERT INTO creditor SET ?';
  const updateDebtor = `UPDATE debtor SET ? WHERE debtor.uuid = ?`;
  const sql = 'INSERT INTO employee SET ?';
  const sqlEmployeeAdvantage = 'INSERT INTO employee_advantage (employee_uuid, rubric_payroll_id, value) VALUES ?';

  const transaction = db.transaction();

  transaction
    .addQuery(writeCreditor, [creditor])
    .addQuery(updateDebtor, [debtor, employee.debtor_uuid])
    .addQuery(sql, [employee]);

  if (employeeAdvantage.length) {
    transaction.addQuery(sqlEmployeeAdvantage, [employeeAdvantage]);
  }

  transaction.execute()
    .then(() => {
      res.status(201).json({ uuid : employeeUuid, patient_uuid : patientUuid });
    })
    .catch(next)
    .done();
}
