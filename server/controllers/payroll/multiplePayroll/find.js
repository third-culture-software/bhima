/**
 * @method find
 *
 * @description
 * This method will apply filters from the options object passed in to
 * filter.
 */
const db = require('../../../lib/db');
const FilterParser = require('../../../lib/filter');

// TODO(@jniles) - rename this function so that it is easier to rationalize in payroll modules
// Maybe getEmployeePayrollInformation()?
function find(options) {

  // ensure epected options are parsed appropriately as binary
  const filters = new FilterParser(options, { tableAlias : 'payroll' });
  let statusIds = [];
  let employees = [];

  if (options.status_id) {
    statusIds = statusIds.concat(options.status_id);
  }

  if (options.employeesUuid) {
    employees = options.employeesUuid;
  }

  const sql = `
    SELECT BUID(payroll.employee_uuid) AS employee_uuid, payroll.reference, payroll.code, payroll.hiring_date,
      payroll.nb_enfant, payroll.individual_salary, payroll.account_id, payroll.creditor_uuid, payroll.display_name,
      payroll.sex, payroll.payment_uuid, payroll.payroll_configuration_id, payroll.currency_id,
      payroll.payment_date, payroll.base_taxable, payroll.basic_salary, payroll.gross_salary, payroll.grade_salary,
      payroll.text, payroll.net_salary, payroll.working_day, payroll.total_day, payroll.daily_salary,
      payroll.amount_paid, payroll.status_id, payroll.status, (payroll.net_salary - payroll.amount_paid) AS balance,
      payroll.hrreference, payroll.cost_center_id, payroll.service_name,
      IF (payroll.net_salary < 0, 1, 0) AS negativeValue
    FROM(
      SELECT employee.uuid AS employee_uuid, employee.reference, em.text AS hrreference, employee.code,
        employee.hiring_date, employee.nb_enfant,employee.individual_salary, creditor_group.account_id,
        BUID(employee.creditor_uuid) AS creditor_uuid,
        UPPER(patient.display_name) AS display_name, patient.sex, BUID(payment.uuid) AS payment_uuid,
        payment.payroll_configuration_id,  payment.currency_id, payment.payment_date, payment.base_taxable,
        payment.basic_salary, payment.gross_salary, grade.basic_salary AS grade_salary, grade.text,
        payment.net_salary, payment.working_day, payment.total_day, payment.daily_salary, payment.amount_paid,
        payment.status_id, payment_status.text AS status, cost_center.id AS cost_center_id,
        service.name AS service_name
        FROM employee
          JOIN entity_map em ON employee.creditor_uuid = em.uuid
          JOIN creditor ON creditor.uuid = employee.creditor_uuid
          JOIN creditor_group ON creditor_group.uuid = creditor.group_uuid
          JOIN patient ON patient.uuid = employee.patient_uuid
          JOIN grade ON employee.grade_uuid = grade.uuid
          JOIN payment ON payment.employee_uuid = employee.uuid
          JOIN payroll_configuration ON payroll_configuration.id = payment.payroll_configuration_id
          JOIN config_employee ON config_employee.id = payroll_configuration.config_employee_id
          JOIN config_employee_item ON config_employee_item.employee_uuid = employee.uuid
          JOIN payment_status ON payment_status.id = payment.status_id
          LEFT JOIN service_cost_center ON service_cost_center.service_uuid = employee.service_uuid
          LEFT JOIN cost_center ON cost_center.id = service_cost_center.cost_center_id
          LEFT JOIN service ON service.uuid = employee.service_uuid
        WHERE payment.payroll_configuration_id = '${options.payroll_configuration_id}'
      UNION
        SELECT employee.uuid AS employee_uuid,  employee.reference, em.text AS hrreference, employee.code,
          employee.hiring_date, employee.nb_enfant, employee.individual_salary, creditor_group.account_id,
        BUID(employee.creditor_uuid) AS creditor_uuid, UPPER(patient.display_name) AS display_name,
        patient.sex, NULL AS 'payment_uuid', '${options.payroll_configuration_id}' AS payroll_configuration_id,
        '${options.currency_id}' AS currency_id, NULL AS payment_date, 0 AS base_taxable, 0 AS basic_salary,
        0 AS gross_salary, grade.basic_salary AS grade_salary, grade.text, 0 AS net_salary, 0 AS working_day,
        0 AS total_day, 0 AS daily_salary, 0 AS amount_paid, 1 AS status_id,
        'PAYROLL_STATUS.WAITING_FOR_CONFIGURATION' AS status, cost_center.id AS cost_center_id,
        service.name AS service_name
        FROM employee
          JOIN entity_map em ON employee.creditor_uuid = em.uuid
          JOIN creditor ON creditor.uuid = employee.creditor_uuid
          JOIN creditor_group ON creditor_group.uuid = creditor.group_uuid
          JOIN patient ON patient.uuid = employee.patient_uuid
          JOIN grade ON employee.grade_uuid = grade.uuid
          JOIN config_employee_item ON config_employee_item.employee_uuid = employee.uuid
          JOIN config_employee ON config_employee.id = config_employee_item.config_employee_id
          JOIN payroll_configuration ON payroll_configuration.config_employee_id = config_employee.id
          LEFT JOIN service_cost_center ON service_cost_center.service_uuid = employee.service_uuid
          LEFT JOIN cost_center ON cost_center.id = service_cost_center.cost_center_id
          LEFT JOIN service ON service.uuid = employee.service_uuid
        WHERE employee.uuid NOT IN (
          SELECT payment.employee_uuid
          FROM payment
          WHERE payment.payroll_configuration_id = '${options.payroll_configuration_id}')
          AND payroll_configuration.id = '${options.payroll_configuration_id}'
    ) AS payroll`;

  filters.fullText('display_name');
  filters.fullText('code');

  // Enterprise currency filtering is optional only if you want to
  // know the currency for which the employees have been configured for payment
  if (options.filterCurrency) {
    filters.equals('currency_id');
  }

  filters.custom('status_id', 'payroll.status_id IN (?)', [statusIds]);
  filters.custom('employeesUuid', 'payroll.employee_uuid IN (?)', [employees]);
  filters.setOrder('ORDER BY payroll.display_name');

  const query = filters.applyQuery(sql);
  const parameters = filters.parameters();

  return db.exec(query, parameters);
}

exports.find = find;
