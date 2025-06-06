/**
 * @method build
 *
 * @description
 * Generates employee pay slips, reports of pay slips for selected employees,
 * and reports of payroll taxes related to employee payments
 *
 * GET /reports/payroll/employees
 */

const _ = require('lodash');
const ReportManager = require('../../../lib/ReportManager');
const db = require('../../../lib/db');
const Exchange = require('../../finance/exchange');

const templatePayslipDefault = './server/controllers/payroll/reports/payslipGenerator.handlebars';
const templatePayslipIndex = './server/controllers/payroll/reports/payslipGeneratorIndex.handlebars';
const templatePayrollReport = './server/controllers/payroll/reports/payrollReportGenerator.handlebars';
const templateSocialCharge = './server/controllers/payroll/reports/payrollReportSocialCharge.handlebars';
const PayrollConfig = require('../configuration');
const configurationData = require('../multiplePayroll/find');

const DEFAULT_OPTS = {
  orientation     : 'landscape',
  filename        : 'FORM.LABELS.PAYSLIP',
  csvKey          : 'payslipGenerator',
};

async function build(req, res, next) {
  const options = _.clone(req.query);
  const paymentIndexSystem = req.session.enterprise.settings.enable_index_payment_system;

  const templatePayslip = paymentIndexSystem ? templatePayslipIndex : templatePayslipDefault;

  options.employees = [].concat(options.employees);
  options.employees = options.employees.map(uid => db.bid(uid));

  options.idPeriod = options.idPeriod || options.payroll_configuration_id;

  const params = {
    payroll_configuration_id : options.idPeriod,
    employeesUuid : options.employees,
  };

  let template;
  _.extend(options, DEFAULT_OPTS);

  // TODO(@jniles): what is "socialCharge" in this case?
  if (!options.payslip && options.socialCharge) {
    template = templateSocialCharge;
    options.orientation = 'portrait';
    options.filename = 'FORM.LABELS.REPORT_SOCIAL_CHARGES';
  } else if (!options.payslip && !options.socialCharge) {
    template = templatePayrollReport;
    options.filename = 'FORM.LABELS.REPORT';
  } else {
    template = templatePayslip;
  }

  const data = {
    enterprise : req.session.enterprise,
    user : req.session.user,
    lang : options.lang,
    conversionRate : options.conversionRate,
  };

  if (options.renderer === 'xls') {
    data.optionsRenderer = options.renderer;
    data.exchangeRate = parseFloat(options.conversion_rate);
    data.currency = options.currency_id;
    data.xlsReport = true;
  } else {
    data.otherRenderer = true;
    data.currency = options.currency;
  }

  // set up the report with report manager
  try {
    const report = new ReportManager(template, req.session, options);

    const payrollPeriodData = await PayrollConfig.lookupPayrollConfig(options.idPeriod);
    data.payrollPeriod = payrollPeriodData;

    const exchangeData = await Exchange.getExchangeRate(
      data.enterprise.id,
      options.currency,
      new Date(data.payrollPeriod.dateTo),
    );

    // If the convertion rate is not defined, the rate of exchange
    // of the period of configuration will be taken into account
    exchangeData.rate = data.conversionRate ? data.conversionRate : exchangeData.rate;
    data.payrollPeriod.exchangeRate = parseInt(options.currency, 10) === data.enterprise.currency_id
      ? 1 : exchangeData.rate;

    const exchangeRatesByCurrencyData = await Exchange.getCurrentExchangeRateByCurrency(
      new Date(data.payrollPeriod.dateTo),
    );

    const dataEmployees = await configurationData.find(params);

    // Set Aggregate of Rubrics
    let totalNetSalary = 0;
    let totalBasicSalary = 0;
    let totalBaseTaxable = 0;
    let totalGrossSalary = 0;

    dataEmployees.forEach(employee => {
      const employeeCurrencyId = parseInt(employee.currency_id, 10);
      exchangeRatesByCurrencyData.forEach(exchange => {
        const isSameCurrency = exchange.currency_id === employeeCurrencyId;

        employee.net_salary_equiv = isSameCurrency
          ? employee.net_salary / exchange.rate : employee.net_salary;

        employee.daily_salary_equiv = isSameCurrency
          ? employee.daily_salary / exchange.rate : employee.daily_salary;

        employee.base_taxable_equiv = isSameCurrency
          ? employee.base_taxable / exchange.rate : employee.base_taxable;

        employee.basic_salary_equiv = isSameCurrency
          ? employee.basic_salary / exchange.rate : employee.basic_salary;

        employee.gross_salary_equiv = isSameCurrency
          ? employee.gross_salary / exchange.rate : employee.gross_salary;
      });

      totalNetSalary += employee.net_salary_equiv;
      totalBasicSalary += employee.basic_salary_equiv;
      totalBaseTaxable += employee.base_taxable_equiv;
      totalGrossSalary += employee.gross_salary_equiv;
    });

    data.dataEmployees = dataEmployees;

    // Set Aggregate of Rubrics
    data.total_basic_salary = totalBasicSalary;
    data.total_taxable = totalBaseTaxable - totalBasicSalary;
    data.total_gross_salary = totalGrossSalary;
    data.total_net_salary = totalNetSalary;
    data.total_non_taxable = totalGrossSalary - totalBaseTaxable;
    data.total_deduction = totalGrossSalary - totalNetSalary;

    // Get payment_uuid for Selected Employee
    const employeesPaymentUuid = dataEmployees.map(emp => db.bid(emp.payment_uuid));
    const [
      rubrics, holidays, offDays, rubEmployees, rubEnterprises, rubricsIndexes,
    ] = await PayrollConfig.payrollReportElements(
      options.idPeriod,
      options.employees,
      employeesPaymentUuid,
    );

    let TotalChargeEnterprise = 0;
    rubrics.forEach(item => {
      exchangeRatesByCurrencyData.forEach(exchange => {
        item.result_equiv = exchange.currency_id === item.currency_id ? item.result / exchange.rate : item.result;
      });
    });

    data.rubrics = rubEmployees;

    data.rubrics.forEach(rub => {
      let totalRub = 0;
      rubrics.forEach(item => {
        if (rub.abbr === item.abbr) {
          totalRub += item.result_equiv;
        }
      });
      rub.total = totalRub;
    });

    data.rubEnterprises = rubEnterprises;
    data.rubEnterprises.forEach(rub => {
      let totalRub = 0;
      rubrics.forEach(item => {
        if (rub.abbr === item.abbr) {
          totalRub += item.result_equiv;
        }
      });
      rub.total = totalRub;
    });

    data.dataEmployees.forEach(employee => {
      const employeeCurrencyId = parseInt(employee.currency_id, 10);

      employee.rubricTaxable = [];
      employee.rubricNonTaxable = [];
      employee.rubricDiscount = [];
      employee.holidaysPaid = [];
      employee.offDaysPaid = [];
      employee.rubricsChargeEmployee = [];
      employee.rubricsChargeEnterprise = [];
      employee.daily_salary = employee.basic_salary / employee.total_day;
      employee.dailyWorkedValue = employee.daily_salary * employee.working_day;
      let somRubTaxable = 0;
      let somRubNonTaxable = 0;
      let somChargeEmployee = 0;
      let somChargeEnterprise = 0;

      if (paymentIndexSystem) {
        employee.otherProfits = [];

        rubricsIndexes.forEach(item => {
          if (employee.employee_uuid === item.employee_uuid && item.indice_type === 'is_other_profits') {
            employee.otherProfits.push({ value : item.rubric_value, label : item.rubric_label });
          } else if (employee.employee_uuid === item.employee_uuid && item.indice_type !== 'is_other_profits') {
            employee[item.indice_type] = { value : item.rubric_value, label : item.rubric_label };
          }
        });
      }

      rubrics.forEach(item => {
        if (employee.employee_uuid === item.employee_uuid) {
          item.ratePercentage = item.is_percent ? item.value : 0;
          // Get Rubric Taxable
          if (!item.is_discount && !item.is_social_care) {
            somRubTaxable += item.result;
            employee.rubricTaxable.push(item);
          }
          // Get Rubric Non Taxable
          if (!item.is_discount && item.is_social_care) {
            somRubNonTaxable += item.result;
            employee.rubricNonTaxable.push(item);
          }
          // Get Charge
          if (item.is_discount) {
            if (item.is_employee) {
              item.chargeEmployee = item.result;
              employee.rubricsChargeEmployee.push(item);
              somChargeEmployee += item.result;
            } else {
              item.chargeEnterprise = item.result;
              employee.rubricsChargeEnterprise.push(item);
              somChargeEnterprise += item.result;
            }
            employee.rubricDiscount.push(item);
          }
        }
      });

      employee.somRubTaxable = somRubTaxable;
      employee.somRubNonTaxable = somRubNonTaxable;
      employee.somChargeEnterprise = somChargeEnterprise;
      employee.somChargeEmployee = somChargeEmployee;
      exchangeRatesByCurrencyData.forEach(exchange => {
        const isSameCurrency = exchange.currency_id === employeeCurrencyId;

        employee.somRubTaxable_equiv = isSameCurrency
          ? employee.somRubTaxable / exchange.rate : employee.somRubTaxable;
        employee.somRubNonTaxable_equiv = isSameCurrency
          ? employee.somRubNonTaxable / exchange.rate : employee.somRubNonTaxable;
        employee.somChargeEnterprise_equiv = isSameCurrency
          ? employee.somChargeEnterprise / exchange.rate : employee.somChargeEnterprise;
        employee.somChargeEmployee_equiv = isSameCurrency
          ? employee.somChargeEmployee / exchange.rate : employee.somChargeEmployee;
      });
      TotalChargeEnterprise += somChargeEnterprise;
      holidays.forEach(holiday => {
        if (employee.payment_uuid === holiday.payment_uuid) {
          holiday.dailyRate = holiday.value / holiday.holiday_nbdays;
          employee.holidaysPaid.push(holiday);
        }
      });
      offDays.forEach(offDay => {
        if (employee.payment_uuid === offDay.payment_uuid) {
          employee.offDaysPaid.push(offDay);
        }
      });
    });

    if (data.optionsRenderer === 'xls') {
      data.payrollPeriod.exchangeRate = parseFloat(data.exchangeRate) || 1;
      data.payrollPeriod.currency = parseInt(data.currency, 10);
    }

    if (!data.payrollPeriod.currency && data.optionsRenderer !== 'xls') {
      data.payrollPeriod.currency = parseInt(data.currency, 10);
    }

    // Total Of Enterprise Charge
    data.TotalChargeEnterprise = TotalChargeEnterprise;
    data.shouldRenderExchangeRate = data.payrollPeriod.exchangeRate !== 1;

    const result = await report.render(data);
    res.set(result.headers).send(result.report);
  } catch (e) {
    next(e);
  }
}
module.exports = build;
