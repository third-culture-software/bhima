/**
* Payroll Configuration Controller
*
* This controller exposes an API to the client for reading and writing Payroll configuration
*/

const moment = require('moment');
const db = require('../../../lib/db');
const util = require('../../../lib/util');

// GET /PAYROLL_CONFIG
function lookupPayrollConfig(id) {
  const sql = `
    SELECT p.id, p.label, p.dateFrom, p.dateTo, p.config_rubric_id,
    p.config_accounting_id, p.config_weekend_id, p.config_ipr_id, p.config_employee_id
    FROM payroll_configuration AS p
    WHERE p.id = ?`;

  return db.one(sql, [id]);
}

// Lists the Payroll configurations
function list(req, res, next) {
  const sql = `
    SELECT p.id, p.label, p.dateFrom, p.dateTo, p.config_rubric_id,
    p.config_accounting_id, p.config_weekend_id, p.config_ipr_id, p.config_employee_id
    FROM payroll_configuration AS p
    ORDER BY p.dateTo DESC;`;

  db.exec(sql)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next);

}

/**
* GET /PAYROLL_CONFIG/:ID
*
* Returns the detail of a single Payroll
*/
function detail(req, res, next) {
  lookupPayrollConfig(req.params.id)
    .then((record) => {
      res.status(200).json(record);
    })
    .catch(next);

}

// POST /PAYROLL_CONFIG
function create(req, res, next) {
  const sql = `INSERT INTO payroll_configuration SET ?`;
  const data = req.body;
  let insertedId = null;

  db.exec(sql, [data])
    .then((row) => {
      insertedId = row.insertId;
      data.dateTo = moment(data.dateTo).format('YYYY-MM-DD');
      return updateEmployeesBasicIndice(insertedId, data.dateTo);
    }).then(() => {
      res.status(201).json({ id : insertedId });
    })
    .catch(next);

}

// PUT /PAYROLL_CONFIG /:ID
function update(req, res, next) {
  const sql = `UPDATE payroll_configuration SET ? WHERE id = ?;`;

  db.exec(sql, [req.body, req.params.id])
    .then(() => {
      return lookupPayrollConfig(req.params.id);
    })
    .then((record) => {
    // all updates completed successfull, return full object to client
      res.status(200).json(record);
    })
    .catch(next);

}

// DELETE /PAYROLL_CONFIG /:ID
function del(req, res, next) {
  db.delete(
    'payroll_configuration', 'id', req.params.id, res, next,
    `Could not find a Payroll configuration with id ${req.params.id}`,
  );
}

function paymentStatus(req, res, next) {
  const sql = `
    SELECT payment_status.id, payment_status.text
    FROM payment_status
  `;

  db.exec(sql)
    .then(rows => res.status(200).json(rows))
    .catch(next);

}

/*
  * This function returns
  * Payroll rubrics configured for a pay period based on a list of employees
  * The status of the employee report that was on vacation during the pay period
  * The status of the holiday payments report
  * The summation of the rubrics configured for all employees
  * The summation of the expenses of the employees
  * The summation of the rubrics in the expenses of the company
*/
function payrollReportElements(idPeriod, employees, employeesPaymentUuid) {
  const sql = `
    SELECT rubric_payment.payment_uuid, rubric_payment.value AS result,
    BUID(payment.employee_uuid) AS employee_uuid, rubric_payroll.abbr, UPPER(rubric_payroll.label) AS label,
    rubric_payroll.is_percent, rubric_payroll.value, rubric_payroll.is_discount,
    rubric_payroll.is_social_care, rubric_payroll.is_employee, payment.currency_id
    FROM rubric_payment
    JOIN payment ON payment.uuid = rubric_payment.payment_uuid
    JOIN employee ON employee.uuid = payment.employee_uuid
    JOIN rubric_payroll ON rubric_payroll.id = rubric_payment.rubric_payroll_id
    WHERE payment.payroll_configuration_id = ? AND employee.uuid IN (?)
    AND rubric_payroll.is_monetary_value = 1 AND rubric_payroll.is_linked_pension_fund = 0
    ORDER BY rubric_payroll.label, rubric_payroll.is_social_care ASC, rubric_payroll.is_discount ASC
  `;

  const sqlHolidayPayment = `
    SELECT holiday_payment.holiday_nbdays, holiday_payment.holiday_nbdays, holiday_payment.holiday_percentage,
    holiday_payment.label, holiday_payment.value, BUID(holiday_payment.payment_uuid) AS payment_uuid
    FROM holiday_payment
    WHERE holiday_payment.payment_uuid IN (?)
  `;

  const sqlOffDayPayment = `
    SELECT offday_payment.offday_percentage, BUID(offday_payment.payment_uuid) AS payment_uuid,
    offday_payment.label, offday_payment.value
    FROM offday_payment
    WHERE offday_payment.payment_uuid IN (?)
  `;

  const getRubricPayrollEmployee = `
    SELECT config_rubric_item.id, config_rubric_item.config_rubric_id, config_rubric_item.rubric_payroll_id,
    payroll_configuration.label AS PayrollConfig, rubric_payroll.*
    FROM config_rubric_item
    JOIN rubric_payroll ON rubric_payroll.id = config_rubric_item.rubric_payroll_id
    JOIN payroll_configuration ON payroll_configuration.config_rubric_id = config_rubric_item.config_rubric_id
    WHERE payroll_configuration.id = ?
    AND (rubric_payroll.is_discount = 0 OR (rubric_payroll.is_discount = 1 AND rubric_payroll.is_employee = 1))
    AND rubric_payroll.is_monetary_value = 1 AND rubric_payroll.is_linked_pension_fund = 0
    ORDER BY rubric_payroll.is_employee ASC, rubric_payroll.is_social_care ASC, rubric_payroll.is_discount ASC,
    rubric_payroll.label ASC;
  `;

  const getRubricPayrollEnterprise = `
    SELECT config_rubric_item.id, config_rubric_item.config_rubric_id, config_rubric_item.rubric_payroll_id,
    payroll_configuration.label AS PayrollConfig, rubric_payroll.*
    FROM config_rubric_item
    JOIN rubric_payroll ON rubric_payroll.id = config_rubric_item.rubric_payroll_id
    JOIN payroll_configuration ON payroll_configuration.config_rubric_id = config_rubric_item.config_rubric_id
    WHERE payroll_configuration.id = ?
    AND (rubric_payroll.is_discount = 1 AND rubric_payroll.is_employee = 0)
    AND rubric_payroll.is_monetary_value = 1 AND rubric_payroll.is_linked_pension_fund = 0
    ORDER BY rubric_payroll.is_employee ASC, rubric_payroll.is_social_care ASC, rubric_payroll.is_discount ASC,
    rubric_payroll.label ASC;
  `;

  const sqlRubricPayrollIndice = `
    SELECT BUID(spi.employee_uuid) AS employee_uuid, spi.payroll_configuration_id, spi.rubric_id, spi.rubric_value,
    rub.is_indice, rub.is_monetary_value, rub.label AS rubric_label, rub.indice_type
    FROM stage_payment_indice AS spi
    JOIN rubric_payroll AS rub ON rub.id = spi.rubric_id
    WHERE spi.payroll_configuration_id = ? AND spi.employee_uuid IN (?)
    AND rub.is_indice = 1 AND rub.is_monetary_value = 0 AND rub.is_linked_pension_fund = 0
    ORDER BY rub.label ASC;
  `;

  return Promise.all([
    db.exec(sql, [idPeriod, employees]),
    db.exec(sqlHolidayPayment, [employeesPaymentUuid]),
    db.exec(sqlOffDayPayment, [employeesPaymentUuid]),
    db.exec(getRubricPayrollEmployee, [idPeriod]),
    db.exec(getRubricPayrollEnterprise, [idPeriod]),
    db.exec(sqlRubricPayrollIndice, [idPeriod, employees]),
  ]);
}

async function updateEmployeesBasicIndice(idPeriod, dateTo) {
  // This query is executed when running payroll with index for the very first time or
  // when dealing with employees who are configured for the very first time,
  // this query searches for the date of hire, their relative base index with their rank,
  // their responsibility index linked to their function,
  const sqlFindNewEmployees = `
    SELECT emp.uuid, emp.date_embauche, sgi.value, sfi.value AS function_indice_value,
    emp.grade_uuid, emp.fonction_id, pa.display_name
    FROM employee AS emp
    JOIN config_employee_item AS it ON it.employee_uuid = emp.uuid
    JOIN config_employee AS conf ON conf.id = it.config_employee_id
    JOIN payroll_configuration AS pay ON pay.config_employee_id = conf.id
    JOIN grade AS gr ON gr.uuid = emp.grade_uuid
    JOIN staffing_grade_indice AS sgi ON sgi.grade_uuid = emp.grade_uuid
    LEFT JOIN staffing_function_indice AS sfi ON sfi.fonction_id = emp.fonction_id
    JOIN patient AS pa ON pa.uuid = emp.patient_uuid
    WHERE pay.id = ? AND emp.uuid NOT IN (SELECT stf.employee_uuid FROM staffing_indice AS stf)
    ORDER BY pa.display_name ASC;
  `;

  // The following query is executed when dealing with employees who have already been configured,
  // this query the date of the very first increment as well as the last value of the base index,
  // the responsibility index linked to the function and date of hire
  const sqlFindOldEmployees = `
    SELECT emp.uuid, emp.date_embauche, lastIndice.date AS lastDateIncrease,
    MAX(lastIndice.grade_indice) AS grade_indice, sfi.value AS function_indice_value, emp.grade_uuid,
    emp.fonction_id, pa.display_name
    FROM employee AS emp
    JOIN config_employee_item AS it ON it.employee_uuid = emp.uuid
    JOIN config_employee AS conf ON conf.id = it.config_employee_id
    JOIN payroll_configuration AS pay ON pay.config_employee_id = conf.id
    JOIN grade AS gr ON gr.uuid = emp.grade_uuid
    JOIN (
      SELECT st.uuid, st.employee_uuid, st.grade_indice, st.date
        FROM staffing_indice st
        JOIN (
          SELECT uuid, employee_uuid, MAX(date) AS maxdate
            FROM staffing_indice st
            GROUP BY st.employee_uuid
        ) AS currentInd ON currentInd.employee_uuid = st.employee_uuid AND currentInd.maxdate = st.date
    ) AS lastIndice ON lastIndice.employee_uuid = emp.uuid
    LEFT JOIN staffing_function_indice AS sfi ON sfi.fonction_id = emp.fonction_id
    JOIN patient AS pa ON pa.uuid = emp.patient_uuid
    WHERE pay.id = ?
    GROUP BY emp.uuid
    ORDER BY pa.display_name ASC;
  `;

  const sqlGetBaseIndexGrowthRate = `
    SELECT base_index_growth_rate FROM enterprise_setting LIMIT 1;
  `;

  const [newEmployees, oldEmployees, dataEnterprise] = await Promise.all([
    db.exec(sqlFindNewEmployees, idPeriod),
    db.exec(sqlFindOldEmployees, idPeriod),
    db.exec(sqlGetBaseIndexGrowthRate),
  ]);

  const transaction = db.transaction();

  const baseIndexGrowthRate = dataEnterprise[0].base_index_growth_rate;

  // Processing of new employee data
  newEmployees.forEach(employee => {
    employee.date_embauche = moment(employee.date_embauche).format('YYYY-MM-DD');
    const yearOfSeniority = parseInt(moment(dateTo).diff(employee.date_embauche, 'years'), 10);

    // Here we increment the base index based on the number of years
    for (let i = 0; i < yearOfSeniority; i++) {
      employee.value += (employee.value * (baseIndexGrowthRate / 100));
    }

    const dataStaffingIndice = {
      uuid : db.uuid(),
      employee_uuid : employee.uuid,
      grade_uuid : employee.grade_uuid,
      fonction_id : employee.fonction_id,
      grade_indice : util.roundDecimal(employee.value, 0),
      function_indice : employee.function_indice_value || 0,
      date : new Date(),
    };
    transaction.addQuery('INSERT INTO staffing_indice SET ?', dataStaffingIndice);
  });

  oldEmployees.forEach(employee => {
    employee.date_embauche = moment(employee.date_embauche).format('YYYY-MM-DD');
    employee.lastDateIncrease = moment(employee.lastDateIncrease).format('YYYY-MM-DD');
    // For employees who have already been configured, we will compare the number of years of seniority
    // and the difference in years between the date of the last increment of the base index,
    // if this difference is greater than zero, the we will have to increment
    // the base index in relation to this difference
    const yearOfSeniority = parseInt(moment(dateTo).diff(employee.date_embauche, 'years'), 10);
    const yearLastIncrementation = parseInt(moment(employee.lastDateIncrease).diff(employee.date_embauche, 'years'),
      10);

    const diffSeniorityIncrementation = yearOfSeniority - yearLastIncrementation;

    if ((diffSeniorityIncrementation > 0) && (baseIndexGrowthRate > 0)) {
      for (let i = 0; i < diffSeniorityIncrementation; i++) {
        employee.grade_indice += (employee.grade_indice * (baseIndexGrowthRate / 100));
      }

      const dataStaffingIndice = {
        uuid : db.uuid(),
        employee_uuid : employee.uuid,
        grade_uuid : employee.grade_uuid,
        fonction_id : employee.fonction_id,
        grade_indice : util.roundDecimal(employee.grade_indice, 0),
        function_indice : employee.function_indice_value || 0,
        date : new Date(),
      };

      transaction.addQuery('INSERT INTO staffing_indice SET ?', dataStaffingIndice);

    }
  });

  return transaction.execute();
}

// get list of Payroll configuration
exports.list = list;

// get details of a Payroll configuration
exports.detail = detail;

// create a new Payroll configuration
exports.create = create;

// update Payroll configurationinformations
exports.update = update;

// Delete a Payroll configuration
exports.delete = del;

// get list of Payment Status
exports.paymentStatus = paymentStatus;

exports.lookupPayrollConfig = lookupPayrollConfig;

exports.payrollReportElements = payrollReportElements;

exports.updateEmployeesBasicIndice = updateEmployeesBasicIndice;
