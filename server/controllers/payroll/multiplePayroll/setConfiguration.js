/**
 *
 * @description
 * This controller allows to initialize the payment configuration for an employee,
 * the data of this configuration comes from the manual configuration,
 *
 * @requires db
 * @requires EmployeeData
 * @requires Exchange
 * @requires util
 */

const moment = require('moment');
const db = require('../../../lib/db');
const Exchange = require('../../finance/exchange');
const util = require('../../../lib/util');

const calculation = require('./calculation');

function config(req, res, next) {
  const { data } = req.body;
  const transaction = db.transaction();
  const currencyId = req.session.enterprise.currency_id;
  const enterpriseId = req.session.enterprise.id;

  // If tax IPR is not defined Else Use Currency ID
  const iprCurrencyId = data.iprScales.length ? data.iprScales[0].currency_id : currencyId;

  const { iprScales, employee } = data;
  const payrollConfigurationId = req.params.id;
  const paymentUuid = util.uuid();

  // End Date of Payroll Period
  const { periodDateTo } = data;

  const uid = db.bid(paymentUuid);

  const allRubrics = [];
  const holidaysElements = [];
  const offDaysElements = [];

  let enterpriseExchangeRate = 0;
  let iprExchangeRate = 0;

  Promise.all([
    Exchange.getExchangeRate(enterpriseId, data.currency_id, new Date()),
    Exchange.getExchangeRate(enterpriseId, iprCurrencyId, new Date()),
  ])
    .then(([exchange, exchangeIpr]) => {
      enterpriseExchangeRate = currencyId === data.currency_id ? 1 : exchange.rate;

      iprExchangeRate = exchangeIpr.rate;
      const DECIMAL_PRECISION = 2;

      let offDaysCost = 0;
      let holidaysCost = 0;

      // Calcul Daily Salary
      const totalDayPeriod = data.daysPeriod.working_day;

      const dailySalary = employee.individual_salary
        ? (employee.individual_salary / totalDayPeriod)
        : (employee.basic_salary / totalDayPeriod);

      const workingDayCost = dailySalary * data.working_day;
      const nbChildren = employee.nb_enfant;

      // Calcul of Seniority date Between date_embauche and the end date of Period
      const diff = moment(periodDateTo).diff(moment(employee.date_embauche));
      const duration = moment.duration(diff, 'milliseconds');
      const yearOfSeniority = parseInt(duration.asYears(), 10);

      /**
     * Some institution allocates a percentage for the offday and holiday payment,
     * the calculation of this rate is found by calculating the equivalence of the daily wage with
     * the percentage of the offday or holiday.
    */

      data.offDays.forEach(offDay => {
        const offDayValue = ((dailySalary * offDay.percent_pay) / 100);
        offDaysCost += offDayValue;

        offDaysElements.push([offDay.id, offDay.percent_pay, uid, offDay.label, offDayValue]);
      });

      data.holidays.forEach(holiday => {
        const holidayValue = ((dailySalary * holiday.percentage * holiday.numberOfDays) / 100);
        holidaysCost += holidayValue;
        holidaysElements.push([
          holiday.id,
          holiday.numberOfDays,
          holiday.percentage,
          uid,
          holiday.label,
          holidayValue,
        ]);
      });

      /*
     * Recalculation of base salary on the basis of any holiday or vacation period,
     * where the percentages are respectively equal to 100% of the basic salary will
     * remain equal to that defined at the level of the Holiday table
     */

      const basicSalary = (workingDayCost + offDaysCost + holidaysCost) * enterpriseExchangeRate;

      const sql = `
        SELECT config_rubric_item.id, config_rubric_item.config_rubric_id, config_rubric_item.rubric_payroll_id,
        payroll_configuration.label AS PayrollConfig, rubric_payroll.*
        FROM config_rubric_item
        JOIN rubric_payroll ON rubric_payroll.id = config_rubric_item.rubric_payroll_id
        JOIN payroll_configuration ON payroll_configuration.config_rubric_id = config_rubric_item.config_rubric_id
        WHERE payroll_configuration.id = ?  AND (rubric_payroll.debtor_account_id IS NOT NULL)
        AND (rubric_payroll.expense_account_id IS NOT NULL);
      `;

      db.exec(sql, [payrollConfigurationId])
        .then(rubrics => {
          let sumNonTaxable = 0;
          let sumTaxable = 0;
          let sumTaxContributionEmp = 0;
          let membershipFeeEmployee = 0;

          let nonTaxables = [];
          let taxables = [];
          let taxesContributions = [];

          if (rubrics.length) {
            rubrics.forEach(rubric => {
              // Conversion of non-percentage currency values to the currency used for payment
              if (rubric.value && !rubric.is_percent && !rubric.is_seniority_bonus) {
                rubric.value *= enterpriseExchangeRate;
              }

              // Initialize values for rubrics that are not automatically calculated
              rubric.result = util.roundDecimal(data.value[rubric.abbr], DECIMAL_PRECISION);

              // Automatic calcul of Seniority_Bonus & Family_Allowances
              if (rubric.is_seniority_bonus === 1) {
                const seniorityElements = [yearOfSeniority, rubric.value];

                rubric.result = calculation.automaticRubric(basicSalary, seniorityElements);
              }

              if (rubric.is_family_allowances === 1) {
                const allowanceElements = [nbChildren];

                rubric.result = calculation.automaticRubric(rubric.value, allowanceElements);
              }
            });

            // Filtering non-taxable Rubrics
            nonTaxables = rubrics.filter(item => item.is_social_care);

            // Filtering taxable Rubrics
            taxables = rubrics.filter(item => (item.is_tax !== 1
              && item.is_discount !== 1
              && item.is_social_care !== 1
              && item.is_membership_fee !== 1));

            // Filtering all taxes and contributions that is calculated from the taxable base
            taxesContributions = rubrics.filter(
              item => (item.is_tax || item.is_membership_fee || item.is_discount === 1),
            );
          }

          // Calcul value for non-taxable and automatically calculated Expected Seniority_bonus & Family_allowances
          if (nonTaxables.length) {
            nonTaxables.forEach(nonTaxable => {
              if (!nonTaxable.is_seniority_bonus && !nonTaxable.is_family_allowances) {
                nonTaxable.result = nonTaxable.is_percent
                  ? util.roundDecimal((basicSalary * nonTaxable.value) / 100, DECIMAL_PRECISION)
                  : (nonTaxable.result || nonTaxable.value);
              }

              sumNonTaxable += nonTaxable.result;
              allRubrics.push([uid, nonTaxable.rubric_payroll_id, nonTaxable.result]);
            });
          }

          // Calcul value for taxable and automatically calculated Expected Seniority_bonus & Family_allowances
          if (taxables.length) {
            taxables.forEach(taxable => {
              if (!taxable.is_seniority_bonus && !taxable.is_family_allowances) {
                taxable.result = taxable.is_percent
                  ? util.roundDecimal((basicSalary * taxable.value) / 100, DECIMAL_PRECISION)
                  : (taxable.result || taxable.value);
              }

              sumTaxable += taxable.result;
              allRubrics.push([uid, taxable.rubric_payroll_id, taxable.result]);
            });
          }

          const baseTaxable = basicSalary + sumTaxable;

          const grossSalary = basicSalary + sumTaxable + sumNonTaxable;

          if (taxesContributions.length) {
            taxesContributions.forEach(taxContribution => {
              taxContribution.result = taxContribution.is_percent
                ? util.roundDecimal((baseTaxable * taxContribution.value) / 100, DECIMAL_PRECISION)
                : (taxContribution.result || taxContribution.value);

              // Recovery of the value of the Membership Fee worker share
              if (taxContribution.is_membership_fee && taxContribution.is_employee) {
                membershipFeeEmployee = taxContribution.result;
              }
            });
          }

          const baseIpr = ((baseTaxable - membershipFeeEmployee) * (iprExchangeRate / enterpriseExchangeRate));

          // Annual cumulation of Base IPR
          const annualCumulation = baseIpr * 12;

          let iprValue = 0;

          if (iprScales.length) {
            iprValue = calculation.iprTax(annualCumulation, iprScales);

            if (nbChildren > 0) {
              iprValue -= (iprValue * (nbChildren * 2)) / 100;
            }

            // Convert IPR value in selected Currency
            iprValue = util.roundDecimal(iprValue * (enterpriseExchangeRate / iprExchangeRate), DECIMAL_PRECISION);

            if (taxesContributions.length) {
              taxesContributions.forEach(taxContribution => {
              // Set the result of IPR calculation
                if (taxContribution.is_ipr) {
                  taxContribution.result = iprValue;
                }

                // Calculation of the sum of taxes and membership fee borne by the employee
                if (taxContribution.is_employee) { sumTaxContributionEmp += taxContribution.result; }

                allRubrics.push([uid, taxContribution.rubric_payroll_id, taxContribution.result]);
              });
            }
          } else if (taxesContributions.length) {
            taxesContributions.forEach(taxContribution => {
              // Calculation of the sum of taxes and membership fee borne by the employee
              if (taxContribution.is_employee) {
                sumTaxContributionEmp += taxContribution.result;
              }

              allRubrics.push([uid, taxContribution.rubric_payroll_id, taxContribution.result]);
            });

          }

          const netSalary = grossSalary - sumTaxContributionEmp;

          const paymentData = {
            uuid : uid,
            employee_uuid : db.bid(employee.uuid),
            payroll_configuration_id : payrollConfigurationId,
            currency_id : data.currency_id,
            basic_salary : basicSalary,
            base_taxable : baseTaxable,
            daily_salary : dailySalary,
            total_day : totalDayPeriod,
            working_day : data.working_day,
            gross_salary : grossSalary,
            net_salary : netSalary,
            amount_paid : 0,
            status_id : 2,
          };

          const deletePaymentData = 'DELETE FROM payment WHERE employee_uuid = ? AND payroll_configuration_id = ?';
          const setPaymentData = 'INSERT INTO payment SET ?';
          const setRubricPaymentData = `INSERT INTO rubric_payment (payment_uuid, rubric_payroll_id, value)
            VALUES ?`;
          const setHolidayPayment = `INSERT INTO holiday_payment
            (holiday_id, holiday_nbdays, holiday_percentage, payment_uuid, label, value) VALUES ?`;
          const setOffDayPayment = `INSERT INTO offday_payment
            (offday_id, offday_percentage, payment_uuid, label, value) VALUES ?`;

          transaction
            .addQuery(deletePaymentData, [db.bid(employee.uuid), payrollConfigurationId])
            .addQuery(setPaymentData, [paymentData]);

          if (allRubrics.length) {
            transaction.addQuery(setRubricPaymentData, [allRubrics]);
          }

          if (holidaysElements.length) {
            transaction.addQuery(setHolidayPayment, [holidaysElements]);
          }

          if (offDaysElements.length) {
            transaction.addQuery(setOffDayPayment, [offDaysElements]);
          }

          return transaction.execute();
        })
        .then(() => {
          res.sendStatus(201);
        })
        .catch(next)
        
    });
}

// Configure Payment for Employee
exports.config = config;
