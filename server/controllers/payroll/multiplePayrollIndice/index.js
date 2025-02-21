/**
 * @description
 * HTTP controller for multiple payroll indice.
 */
const db = require('../../../lib/db');

exports.read = read;
exports.create = create;
exports.lookUp = lookUp;
exports.parameters = require('./parameters.config');
exports.reports = require('./report');

// retrieve indice's value for employee(s)
function read(req, res, next) {
  lookUp(req.query).then(rows => {
    res.status(200).json(rows);
  }).catch(next);
}

// specifying indice's value for an employee
async function create(req, res, next) {
  const currencyId = req.body.currency_id;
  const payrollConfigurationId = req.body.payroll_configuration_id;
  const employeeUuid = req.body.employee_uuid;
  const { rubrics } = req.body;
  const minMonentaryUnit = req.session.enterprise.min_monentary_unit;

  try {

    // TODO(@jniles) - migrate this to "common.isMonetary()"
    const monetaryRubrics = rubrics.filter(r => r.is_monetary === 1);

    const transaction = db.transaction();

    transaction.addQuery(`DELETE FROM employee_advantage WHERE employee_uuid = ?`, [db.bid(employeeUuid)]);

    // TODO(@jniles) - This might be a bug - the minMonentaryUnit is related to the enterprise currency,
    // yet we don't check the currency of rubrics we are converting. We should probably do that.
    monetaryRubrics.forEach(r => {
      r.value = minMonentaryUnit * Math.round(r.value / minMonentaryUnit);

      transaction.addQuery('INSERT INTO employee_advantage SET ?', {
        employee_uuid : db.bid(employeeUuid),
        rubric_payroll_id : r.id,
        value : r.value,
      });
    });

    rubrics.forEach(r => {
      transaction.addQuery(
        `DELETE FROM stage_payment_indice WHERE employee_uuid = ? AND payroll_configuration_id = ? AND rubric_id = ?`,
        [db.bid(employeeUuid), payrollConfigurationId, r.id],
      );

      transaction.addQuery('INSERT INTO stage_payment_indice SET ?', {
        uuid : db.uuid(),
        employee_uuid : db.bid(employeeUuid),
        payroll_configuration_id : payrollConfigurationId,
        rubric_id : r.id,
        currency_id : currencyId,
        rubric_value : r.value,
      });
    });

    await transaction.execute();

    res.sendStatus(201);
  } catch (err) {
    next(err);
  }

}

// retrieve indice's value for employee(s)
async function lookUp(options) {
  const payConfigId = options.payroll_configuration_id;
  const employeeUuid = options.employee_uuid;

  const employeeSql = `
    SELECT BUID(emp.uuid) AS uuid,UPPER(pt.display_name) AS display_name, pt.sex, service.name as service_name,
    BUID(emp.grade_uuid) AS grade_uuid
    FROM payroll_configuration pc
      JOIN config_employee ce ON ce.id = pc.config_employee_id
      JOIN config_employee_item cei ON cei.config_employee_id = ce.id
      JOIN employee emp ON emp.uuid = cei.employee_uuid
      JOIN grade gr ON gr.uuid = emp.grade_uuid
      LEFT JOIN service ON emp.service_uuid = service.uuid
      JOIN patient pt ON pt.uuid = emp.patient_uuid
    WHERE pc.id = ?
      ${employeeUuid ? ' AND emp.uuid = ?' : ''}
    ORDER BY pt.display_name ASC
  `;

  const stagePaymentIndiceSql = `
    SELECT rubric_id, rubric_value, rb.abbr as rubric_abbr,  BUID(sti.employee_uuid) as employee_uuid,
    rb.is_linked_to_grade
    FROM stage_payment_indice sti
    JOIN employee emp ON emp.uuid = sti.employee_uuid
    JOIN rubric_payroll rb ON rb.id = sti.rubric_id
    WHERE sti.payroll_configuration_id = ?
    ${employeeUuid ? ' AND emp.uuid = ?' : ''}
  `;

  const rubricSql = `
    SELECT rb.*
    FROM rubric_payroll rb
    JOIN config_rubric_item cti ON cti.rubric_payroll_id = rb.id
    JOIN config_rubric cr On cr.id = cti.config_rubric_id
    WHERE
      cr.id IN ( SELECT config_rubric_id FROM payroll_configuration WHERE id = ?)
      AND rb.is_indice = 1
    ORDER BY rb.position
  `;

  // let get enterprise employees
  const employeeParams = [payConfigId];
  if (employeeUuid) {
    employeeParams.push(db.bid(employeeUuid));
  }

  const employees = await db.exec(employeeSql, employeeParams);
  const employeesMap = {};
  employees.forEach(employee => {
    employeesMap[employee.uuid] = employee;
    employeesMap[employee.uuid].rubrics = [];
  });

  // let get rubric values for each employee
  const stagePaymentsParams = employeeUuid ? [payConfigId, db.bid(employeeUuid)] : [payConfigId];
  const stagePayments = await db.exec(stagePaymentIndiceSql, stagePaymentsParams);

  stagePayments.forEach(stagePay => {
    if (employeesMap[stagePay.employee_uuid]) {
      employeesMap[stagePay.employee_uuid].rubrics.push(stagePay);
    }
  });

  // let get rubric for this payment period
  const rubrics = await db.exec(rubricSql, payConfigId);

  return { employees, rubrics };
}
