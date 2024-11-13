/**
 * @method find
 *
 * @description
 * This method will apply filters from the options object passed in to
 * filter.
 */
const moment = require('moment');
const debug = require('debug')('payroll:indice');
const { BadRequest } = require('../../../lib/errors');
const db = require('../../../lib/db');
const util = require('../../../lib/util');
const translate = require('../../../lib/helpers/translate');
const { uuid } = require('../../../lib/util');
const i18n = require('../../../lib/helpers/translate');

// get staffing indice parameters
function detail(req, res, next) {
  const sql = `
    SELECT BUID(uuid) as uuid, pay_envelope, pension_fund, working_days, payroll_configuration_id
    FROM staffing_indice_parameters
    WHERE payroll_configuration_id = ?
  `;
  const id = req.params.payroll_config_id;
  db.exec(sql, id)
    .then(param => {
      res.status(200).json(param);
    })
    .catch(next)
    
}

// settup staffing indice parameters
async function create(req, res, next) {
  const data = req.body;
  const { lang } = data;
  delete data.lang;

  data.uuid = db.uuid();
  const id = req.body.payroll_configuration_id;

  debug(`beginning payroll for configuration id: ${id} (${data.uuid}).`);

  const transaction = db.transaction();

  const getEnterpriseMiMonentaryUnit = `
    SELECT c.min_monentary_unit
    FROM enterprise AS e
    JOIN currency AS c ON c.id = e.currency_id
    WHERE e.id = ?;`;

  const getEnterprisePercentageFixedBonus = `
    SELECT s.percentage_fixed_bonus
    FROM enterprise_setting AS s
    WHERE s.enterprise_id = ?;`;

  const [resultMiMonentaryUnit, resultPercentageFixedBonus] = await Promise.all([
    db.exec(getEnterpriseMiMonentaryUnit, req.session.enterprise.id),
    db.exec(getEnterprisePercentageFixedBonus, req.session.enterprise.id),
  ]);

  const minMonentaryUnit = resultMiMonentaryUnit[0].min_monentary_unit;
  const percentageFixedBonus = resultPercentageFixedBonus[0].percentage_fixed_bonus;
  const percentagePerformanceBonus = 100 - percentageFixedBonus;

  debug(`the fixed percentage performance bonus is ${percentagePerformanceBonus}.`);

  // TODO(@jniles) - document this action.  The pay envelope inserted by the user
  // is going to be increased by the percentage_fixed_bonus.
  //
  // FIXME(@jniles) - what currency is this in?
  // RESPONSE (@lomamech): Enterprise Currency
  const payEnvelope = req.body.pay_envelope * (percentageFixedBonus / 100);
  const bonusPerformance = req.body.pay_envelope * (percentagePerformanceBonus / 100);
  const pensionFund = req.body.pension_fund;

  debug(`the computed pay envelope is ${payEnvelope}.`);
  debug(`the computed bonus performance is ${bonusPerformance}.`);

  const workingDays = req.body.working_days;
  const requestsUpdateIndices = await stagePaymentIndice(id);
  let getRubricFundPension = {};

  const [
    paymentIndice,
    employeesGradeIndice,
    aggregateOtherProfits,
    rubricMonetaryValue,
    payrollPeriod,
    rubricFundPension,
  ] = requestsUpdateIndices;

  if (rubricFundPension.length) {
    [getRubricFundPension] = rubricFundPension;
  }

  const payrollPeriodDate = payrollPeriod[0].dateTo;

  debug(`payment will be computed for ${employeesGradeIndice.length} employees.`);
  debug(`the payroll period date is ${payrollPeriodDate}.`);

  let totalCode = 0;
  let rubricPayRateId;
  let rubricGrossSallaryId;
  let rubricNumberOfDaysId;
  let rubricFixedBonusId;
  let totalRelatifPoint = 0;
  let rubricPerformanceRateId;
  let rubricPerformanceBonusId;
  let rubricPensionFundId;

  transaction.addQuery('DELETE FROM staffing_indice_parameters WHERE payroll_configuration_id =?', id);
  transaction.addQuery('INSERT INTO staffing_indice_parameters SET ?', data);

  const updateStaffingIndice = `
    UPDATE stage_payment_indice SET rubric_value = ?
    WHERE payroll_configuration_id = ? AND employee_uuid = ? AND rubric_id = ?;
  `;

  const updateEmployeeIndividualySalary = `
    UPDATE employee SET individual_salary = ? WHERE uuid = ?
  `;

  // Deletion of employee data that has been removed from the configuration
  const cleanStagePaymentIndice = `
    DELETE FROM stage_payment_indice AS spi WHERE spi.payroll_configuration_id = ? AND spi.employee_uuid NOT IN (
      SELECT emp.uuid
      FROM employee AS emp
      JOIN patient AS pa ON pa.uuid = emp.patient_uuid
      JOIN config_employee_item AS cei ON cei.employee_uuid = emp.uuid
      JOIN config_employee AS ce ON ce.id = cei.config_employee_id
      JOIN payroll_configuration AS pc ON pc.config_employee_id = ce.id
      WHERE pc.id = ?)`;

  employeesGradeIndice.forEach(emp => {
    debug(`computing payroll for ${emp.code} - ${emp.display_name}`);

    let totalDays = 0;
    let rubricTotalDaysId;
    let rubricReagisteredIndexId;
    let rubricTotalCodeId;
    let rubricDayIndexId;

    // FIXME(@jniles) - we should make sure this can never be negative
    // if it is negative, can it be zeroed out?
    const diff = moment(payrollPeriodDate).diff(moment(emp.date_embauche));
    const duration = moment.duration(diff, 'milliseconds');
    const yearOfSeniority = parseInt(duration.asYears(), 10);

    emp.totalBase = 0;

    // remove all parameters in employee_advantage table related to this employee
    transaction.addQuery(`DELETE FROM employee_advantage WHERE employee_uuid = ?`, [emp.employee_buid]);

    // get all of the indicies related to this employee.
    const employeePaymentIndice = paymentIndice.filter(ind => ind.employee_uuid === emp.employee_uuid);

    debug(`[${emp.code}] processing ${employeePaymentIndice.length} indices for ${emp.name}.`);

    employeePaymentIndice.forEach(ind => {
      if (getRubricFundPension) {
        if (ind.rubric_id === getRubricFundPension.rubric_id) {
          rubricPensionFundId = ind.rubric_id;
        }
      }

      debug(`[${emp.code}] computing ${ind.indice_type} for ${emp.display_name}`);

      // calculate total days for rubrics where type is 'is_day_worked' or 'is_extra_day'
      if (ind.indice_type === 'is_day_worked' || ind.indice_type === 'is_extra_day') {
        totalDays += ind.rubric_value;
      }

      // get total days rubric id
      if (ind.indice_type === 'is_total_days') {
        rubricTotalDaysId = ind.rubric_id;
      }

      // get reagistered index rubric id
      if (ind.indice_type === 'is_reagistered_index') {
        rubricReagisteredIndexId = ind.rubric_id;
      }

      // get total code rubric id
      if (ind.indice_type === 'is_total_code') {
        rubricTotalCodeId = ind.rubric_id;
      }

      // get the base index
      if (ind.indice_type === 'is_base_index') {
        ind.rubric_value = emp.grade_indice;
        emp.totalBase += emp.grade_indice;
        if (ind.rubric_id) {
          transaction.addQuery(updateStaffingIndice, [emp.grade_indice, id, emp.employee_buid, ind.rubric_id]);
        }
      }

      // Get the index of responsability
      if (ind.indice_type === 'is_responsability') {
        ind.rubric_value = emp.function_indice;
        emp.totalBase += emp.function_indice;
        debug(`[${emp.code}] qualifies for a responsibility index of ${emp.function_indice}.`);

        if (ind.rubric_id) {
          transaction.addQuery(
            updateStaffingIndice,
            [emp.function_indice, id, emp.employee_buid, ind.rubric_id],
          );
        }
      }

      // get the seniority bonus
      // FIXME(@jniles) - can this ever be negative?
      if (ind.indice_type === 'is_seniority_index') {
        ind.rubric_value = yearOfSeniority;
        emp.totalBase += yearOfSeniority;

        debug(`[${emp.code}] qualifies for the seniority index of ${yearOfSeniority}.`);

        if (ind.rubric_id) {
          transaction.addQuery(
            updateStaffingIndice,
            [yearOfSeniority, id, emp.employee_buid, ind.rubric_id],
          );
        }
      }

      //  get relative point
      if (ind.indice_type === 'is_individual_performance') {
        emp.performance = ind.rubric_value / 100;
      }

      // Get Pay Rate Id
      if (ind.indice_type === 'is_pay_rate') {
        rubricPayRateId = ind.rubric_id;
      }

      // Get Gross Sallary Id
      if (ind.indice_type === 'is_gross_salary') {
        rubricGrossSallaryId = ind.rubric_id;
      }

      // Get Fixed Bonus Id
      if (ind.indice_type === 'is_fixed_bonus') {
        rubricFixedBonusId = ind.rubric_id;
      }

      // Get Performance Bonus Id
      if (ind.indice_type === 'is_performance_bonus') {
        rubricPerformanceBonusId = ind.rubric_id;
      }

      // Get Number of days ID
      if (ind.indice_type === 'is_number_of_days') {
        rubricNumberOfDaysId = ind.rubric_id;
      }

      // Get Performance Bonus ID
      if (ind.indice_type === 'is_performance_rate') {
        rubricPerformanceRateId = ind.rubric_id;
      }

      // Get is other responsability
      if (ind.indice_type === 'is_other_responsability') {
        emp.totalBase += ind.rubric_value;
      }

      // Get Day Index Id
      if (ind.indice_type === 'is_day_index') {
        rubricDayIndexId = ind.rubric_id;
      }
    });

    debug(`[${emp.code}] finished computing all indices for ${emp.display_name}.`);
    debug(`[${emp.code}] they have a total base index of ${emp.totalBase}`);

    employeePaymentIndice.forEach(ind => {
      // Save relative point
      if (ind.indice_type === 'is_relative_point') {
        if (ind.rubric_id) {
          transaction.addQuery(
            updateStaffingIndice,
            [(emp.totalBase * emp.performance), id, emp.employee_buid, ind.rubric_id],
          );
          emp.relatifPoint = emp.totalBase * emp.performance;
          totalRelatifPoint += emp.totalBase * emp.performance;
        }
      }
    });

    // TODO(@jniles) - filter these first by employee for better debuggin
    // employeeMonetaryRubrics = rubricMonetaryValue.filter(r => r.employee_uuid === emp.employee_uuid)
    // employeeMonetaryRubrics.forEach(r => { /* blah */ });

    rubricMonetaryValue.forEach(money => {
      if (emp.employee_uuid === money.employee_uuid) {
        transaction.addQuery('INSERT INTO employee_advantage SET ?', {
          employee_uuid : emp.employee_buid,
          rubric_payroll_id : money.rubric_id,
          value : money.rubric_value,
        });
      }
    });

    // TODO(@jniles) - filter by employee before looping.
    aggregateOtherProfits.forEach(profit => {
      if (emp.employee_uuid === profit.employee_uuid) {
        emp.otherProfits = profit.rubric_value;
      }
    });

    emp.otherProfits = emp.otherProfits || 0;
    if (workingDays && totalDays) {
      emp.dayIndex = (emp.totalBase / workingDays) || 0;
      emp.numberOfDays = workingDays;
      emp.totalDays = totalDays;
      emp.indiceReajust = util.roundDecimal((emp.dayIndex * totalDays), 5);
      emp.totalCode = emp.indiceReajust + emp.otherProfits;

      debug(`[${emp.code}] after working days computation, totalDays: ${emp.totalDays}, totalCode: ${totalCode}`);
    } else {
      emp.totalCode = emp.totalBase + emp.otherProfits;
    }

    // Set Total days
    transaction.addQuery(updateStaffingIndice, [totalDays, id, emp.employee_buid, rubricTotalDaysId]);

    // Set Reagistered Index
    if (rubricReagisteredIndexId && emp.indiceReajust) {
      transaction.addQuery(
        updateStaffingIndice,
        [emp.indiceReajust, id, emp.employee_buid, rubricReagisteredIndexId],
      );
    }

    // Set Total Code
    if (rubricTotalCodeId) {
      transaction.addQuery(
        updateStaffingIndice,
        [emp.totalCode, id, emp.employee_buid, rubricTotalCodeId],
      );
    }

    // Set Day index
    if (rubricDayIndexId) {
      if (!emp.dayIndex) {
        const messageError = translate(lang)('ERRORS.ER_EMPLOYEE_IS_NOT_CONFIGURED_CORRECTLY');
        const messageErrorFormated = messageError.replace('%EMPLOYEE%', emp.display_name);
        next(new BadRequest('The employee: is not configured correctly',
          messageErrorFormated),
        );
        return;
      }

      transaction.addQuery(
        updateStaffingIndice,
        [emp.dayIndex, id, emp.employee_buid, rubricDayIndexId],
      );
    }

    totalCode += emp.totalCode;
  });

  const payRate = payEnvelope / totalCode;
  const pensionFundRate = pensionFund ? (pensionFund / totalCode) : 0;
  const performanceBonusRate = bonusPerformance / totalRelatifPoint;

  employeesGradeIndice.forEach(emp => {
    emp.performanceBonus = 0;

    emp.payRate = payRate;
    emp.fixedBonus = util.roundDecimal(((payRate * emp.totalCode) / minMonentaryUnit), 0) * minMonentaryUnit;
    emp.pensionFund = util.roundDecimal(((pensionFundRate * emp.totalCode) / minMonentaryUnit), 0) * minMonentaryUnit;

    if (emp.relatifPoint) {
      emp.performanceBonus = performanceBonusRate * emp.relatifPoint;
    }

    emp.grossSalary = emp.fixedBonus + emp.performanceBonus;

    // Set Pay Rate
    if (rubricPayRateId) {
      transaction.addQuery(
        updateStaffingIndice,
        [payRate, id, emp.employee_buid, rubricPayRateId],
      );
    }

    // Set Employee Fixed Bonus
    if (rubricFixedBonusId) {
      transaction.addQuery(
        updateStaffingIndice,
        [emp.fixedBonus, id, emp.employee_buid, rubricFixedBonusId],
      );
    }

    // Set Employee Performance Bonus
    if (rubricPerformanceBonusId) {
      transaction.addQuery(
        updateStaffingIndice,
        [emp.performanceBonus, id, emp.employee_buid, rubricPerformanceBonusId],
      );
    }

    // Set Employee Pension Fund
    if (rubricPensionFundId) {
      transaction.addQuery(
        updateStaffingIndice,
        [emp.pensionFund, id, emp.employee_buid, rubricPensionFundId],
      );

      transaction.addQuery('INSERT INTO employee_advantage SET ?', {
        employee_uuid : emp.employee_buid,
        rubric_payroll_id : rubricPensionFundId,
        value : emp.pensionFund,
      });
    }

    // Set Employee Performance Bonus Rate
    if (rubricPerformanceRateId) {
      transaction.addQuery(
        updateStaffingIndice,
        [performanceBonusRate, id, emp.employee_buid, rubricPerformanceRateId],
      );
    }

    // Set Gross Sallary
    transaction.addQuery(
      updateStaffingIndice,
      [emp.grossSalary, id, emp.employee_buid, rubricGrossSallaryId],
    );

    // Update Individualy salary for Payroll Process
    transaction.addQuery(
      updateEmployeeIndividualySalary,
      [emp.grossSalary, emp.employee_buid],
    );

    // Clean of employee data that has been removed from the configuration
    transaction.addQuery(
      cleanStagePaymentIndice,
      [id, id],
    );

    // Set working days
    if (rubricNumberOfDaysId) {
      transaction.addQuery(
        updateStaffingIndice,
        [workingDays, id, emp.employee_buid, rubricNumberOfDaysId],
      );
    }
  });

  transaction.execute().then(() => {
    res.sendStatus(201);
  }).catch(next);
}

function stagePaymentIndice(payrollConfigurationId) {
  const sqlGetStagePaymentIndice = `
    SELECT BUID(spi.employee_uuid) AS employee_uuid, rub.id AS rubric_id, rub.label,
    rub.label, spi.rubric_value, rub.indice_type
    FROM stage_payment_indice AS spi
    JOIN rubric_payroll AS rub ON rub.id = spi.rubric_id
    WHERE spi.payroll_configuration_id = ? AND rub.is_indice = 1 AND 
    (rub.is_monetary_value = 0 OR rub.is_linked_pension_fund = 1);
  `;

  const sqlGetEmployees = `
     SELECT BUID(emp.uuid) AS employee_uuid, emp.uuid AS employee_buid, emp.code, ind.grade_indice,
       ind.function_indice, ind.created_at, emp.date_embauche, patient.display_name
     FROM payroll_configuration AS pc
       JOIN config_employee AS ce ON ce.id = pc.config_employee_id
       JOIN config_employee_item AS cei ON cei.config_employee_id = ce.id
       JOIN employee AS emp ON emp.uuid = cei.employee_uuid
       JOIN patient ON emp.patient_uuid = patient.uuid
       JOIN staffing_indice AS ind ON ind.employee_uuid = emp.uuid
       JOIN (
         SELECT st.employee_uuid, MAX(st.created_at) AS created_at
         FROM staffing_indice AS st
         GROUP BY st.employee_uuid
       ) st_ind ON (st_ind.employee_uuid = ind.employee_uuid AND st_ind.created_at = ind.created_at)
       WHERE pc.id = ?;
  `;

  const sqlGetAggregateOtherProfits = `
    SELECT BUID(spi.employee_uuid) AS employee_uuid, SUM(spi.rubric_value) AS rubric_value,
    rub.indice_type, spi.rubric_id, spi.payroll_configuration_id
    FROM stage_payment_indice AS spi
    JOIN rubric_payroll AS rub ON rub.id = spi.rubric_id
    WHERE spi.payroll_configuration_id = ? AND rub.is_indice = 1 AND rub.is_monetary_value = 0
    AND rub.indice_type = 'is_other_profits'
    GROUP BY spi.employee_uuid;
  `;

  const sqlGetRubricMonetaryValue = `
    SELECT BUID(spi.employee_uuid) AS employee_uuid, rub.id AS rubric_id, rub.label,
    rub.label, spi.rubric_value, rub.indice_type
    FROM stage_payment_indice AS spi
    JOIN rubric_payroll AS rub ON rub.id = spi.rubric_id
    WHERE spi.payroll_configuration_id = ? AND rub.is_indice = 1
    AND rub.is_monetary_value = 1  AND rub.is_linked_pension_fund = 0;
  `;

  const sqlGetEndOfPeriod = `
    SELECT pc.dateTo FROM payroll_configuration AS pc WHERE pc.id = ?;`;

  const sqlGetRubricPensionFund = `
    SELECT pc.id, pc.label, rub.id AS rubric_id, rub.label AS rubric_label, rub.abbr AS rubric_abbr
    FROM payroll_configuration AS pc
    JOIN config_rubric AS crb ON crb.id = pc.config_rubric_id
    JOIN config_rubric_item AS rubi ON rubi.config_rubric_id = crb.id
    JOIN rubric_payroll AS rub ON rub.id = rubi.rubric_payroll_id
    WHERE pc.id = ? AND rub.is_indice = 1 AND rub.is_monetary_value = 1 AND rub.is_linked_pension_fund = 1;
  `;

  return Promise.all([
    db.exec(sqlGetStagePaymentIndice, [payrollConfigurationId]),
    db.exec(sqlGetEmployees, [payrollConfigurationId]),
    db.exec(sqlGetAggregateOtherProfits, [payrollConfigurationId]),
    db.exec(sqlGetRubricMonetaryValue, [payrollConfigurationId]),
    db.exec(sqlGetEndOfPeriod, [payrollConfigurationId]),
    db.exec(sqlGetRubricPensionFund, [payrollConfigurationId]),
  ]);

}

/**
 * Import Payroll Configuration for a payroll configuration
 *
 * POST /multiple_payroll_indice/upload/:payroll_config_id'
 *
 * @param {object} req - the request object
 * @param {object} res - the response object
 * @param {object} next - next middleware object to pass control to
 */
async function importConfig(req, res, next) {
  if (!req.params.payroll_config_id) {
    throw new BadRequest(`ERROR: Missing 'payroll_config' ID parameter in POST /multiple_payroll_indice/upload`);
  }
  const payrollConfigId = Number(req.params.payroll_config_id);
  const { lang } = req.query;

  try {

    if (!req.files || req.files.length === 0) {
      const errMsg = `${i18n(lang)('ERRORS.MISSING_UPLOAD_FILES')}`;
      throw new BadRequest('Expected at least one file upload but did not receive any files.',
        errMsg);
    }
    const filePath = req.files[0].path;
    const data = await util.formatCsvToJson(filePath);

    const arrayDataFormated = data.map((employee) => {
      const keys = Object.keys(employee);
      const firstKey = keys[0];
      const { [firstKey] : renamedProperty, ...rest } = employee;
      return { employee : renamedProperty, ...rest };
    });

    const sqlGetRubs = `
      SELECT rub.id, rub.abbr, rub.label, cri.config_rubric_id, cr.label, pc.label AS 'Period paie'
      FROM rubric_payroll AS rub
      JOIN config_rubric_item AS cri ON cri.rubric_payroll_id = rub.id
      JOIN config_rubric AS cr ON cr.id = cri.config_rubric_id
      JOIN payroll_configuration AS pc ON pc.config_rubric_id = cr.id
      WHERE pc.id = ?;
    `;

    const sqlGetEmployees = `
      SELECT BUID(emp.uuid) AS employee_uuid, pat.display_name AS employee_display_name,
      cemp.label, cemp.id, pc.id payroll_configuration_id
      FROM employee AS emp
      JOIN patient AS pat ON pat.uuid = emp.patient_uuid
      JOIN config_employee_item AS cei ON cei.employee_uuid = emp.uuid
      JOIN config_employee AS cemp ON cemp.id = cei.config_employee_id
      JOIN payroll_configuration AS pc ON pc.config_employee_id = cemp.id
      WHERE pc.id = ?;
    `;

    const sqlGetEditableRubrics = `
      SELECT rub.id, rub.abbr, rub.label, cri.config_rubric_id, cr.label, pc.label AS 'Period paie'
      FROM rubric_payroll AS rub
      JOIN config_rubric_item AS cri ON cri.rubric_payroll_id = rub.id
      JOIN config_rubric AS cr ON cr.id = cri.config_rubric_id
      JOIN payroll_configuration AS pc ON pc.config_rubric_id = cr.id
      WHERE pc.id = ? AND rub.is_indice AND rub.indice_to_grap;
    `;

    const transaction = db.transaction();

    transaction
      .addQuery(sqlGetRubs, [payrollConfigId])
      .addQuery(sqlGetEmployees, [payrollConfigId])
      .addQuery(sqlGetEditableRubrics, [payrollConfigId]);

    const record = await transaction.execute();

    const [rubPayroll, empPayroll, rubPayrollConfig] = record;

    const checkColumnFormated = Object.keys(arrayDataFormated[0]).length;

    let checkValidColumn = 0;
    rubPayrollConfig.forEach(rcf => {
      if (rcf.abbr in arrayDataFormated[0]) {
        checkValidColumn++;
      }
    });

    let checkValidEmployee = 0;
    empPayroll.forEach(emp => {
      arrayDataFormated.forEach(dt => {
        if (emp.employee_display_name.toLowerCase() === dt.employee.toLowerCase()) {
          checkValidEmployee++;
        }
      });
    });

    if (empPayroll.length !== checkValidEmployee) {
      throw new BadRequest(
        `Warning: The configured list of employees does not match the initially configured list.`,
        `${i18n(lang)('ERRORS.ER_BAD_CSV_FILE_EMP')}`);
    }

    if (rubPayrollConfig.length !== checkValidColumn) {
      throw new BadRequest(
        `Warning: The CSV file you have selected does not match the selected payroll period.
          Please download the template again, configure it correctly, and re-upload the file.`,
        `${i18n(lang)('ERRORS.ER_BAD_CSV_FILE')}`);
    }

    if ((checkColumnFormated - rubPayrollConfig.length) > 2) {
      throw new BadRequest(
        'Error: The uploaded CSV file contains more columns than expected.',
        `${i18n(lang)('ERRORS.ER_CSV_MORE_COLUMN')}`);
    }

    if ((checkColumnFormated - rubPayrollConfig.length) < 2) {
      throw new BadRequest(
        'Error: Error: The uploaded CSV file contains fewer columns than expected.',
        `${i18n(lang)('ERRORS.ER_CSV_FEW_COLUMN')}`);
    }

    const transactionOperation = db.transaction();

    const delStagePaymentIndice = `
      DELETE FROM stage_payment_indice
      WHERE payroll_configuration_id = ? AND employee_uuid = ?`;

    const insertStagePaymentIndice = 'INSERT INTO stage_payment_indice SET ?';

    empPayroll.forEach(emp => {
      transactionOperation.addQuery(delStagePaymentIndice, [payrollConfigId, db.bid(emp.employee_uuid)]);

      rubPayroll.forEach(rub => {
        const stagePaymentIndiceData = {};
        let rubricValue = 0;
        arrayDataFormated.forEach(df => {
          rubPayrollConfig.forEach(rcf => {
            // to prevent the addition of non-configurable and non-editable columns
            if (rub.id === rcf.id) {
              if ((df.employee.toLowerCase() === emp.employee_display_name.toLowerCase()) && (rub.abbr in df)) {
                rubricValue = df[rub.abbr];
              }
            }
          });
        });

        stagePaymentIndiceData.uuid = db.bid(uuid());
        stagePaymentIndiceData.employee_uuid = db.bid(emp.employee_uuid);
        stagePaymentIndiceData.payroll_configuration_id = payrollConfigId;
        stagePaymentIndiceData.currency_id = req.session.enterprise.currency_id;
        stagePaymentIndiceData.rubric_id = rub.id;
        stagePaymentIndiceData.rubric_value = rubricValue;

        transactionOperation.addQuery(insertStagePaymentIndice, [stagePaymentIndiceData]);
      });
    });

    await transactionOperation.execute();
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

module.exports.detail = detail;
module.exports.create = create;
module.exports.importConfig = importConfig;
