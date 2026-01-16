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
const { lookupEnterprise } = require('../../admin/enterprises');

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

async function build(req, res) {
  const options = { ...req.query };
  // Retrieve the latest enterprise settings directly from the database
  // to ensure the "Payment by Index" flag reflects the current state,
  // instead of relying on the potentially outdated session value.
  const enterpriseFromDb = await lookupEnterprise(req.session.enterprise.id);
  const paymentIndexSystem = enterpriseFromDb.settings.enable_index_payment_system;
  const templatePayslip = paymentIndexSystem ? templatePayslipIndex : templatePayslipDefault;

  options.employees = ([].concat(options.employees)).map(uid => db.bid(uid));

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
      const rate = isSameCurrency ? exchange.rate : 1;

      employee.net_salary_equiv = employee.net_salary / rate;
      employee.daily_salary_equiv = employee.daily_salary / rate;
      employee.base_taxable_equiv = employee.base_taxable / rate;
      employee.basic_salary_equiv = employee.basic_salary / rate;
      employee.gross_salary_equiv = employee.gross_salary / rate;
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
      const rate = exchange.currency_id === item.currency_id ? exchange.rate : 1;
      item.result_equiv = item.result / rate;
    });
  });

  data.rubrics = rubEmployees;

  data.rubrics.forEach(rub => {
    rub.total = rubrics
      .reduce((agg, item) => agg + (rub.abbr === item.abbr ? item.result_equiv : 0), 0);
  });

  data.rubEnterprises = rubEnterprises;
  data.rubEnterprises.forEach(rub => {
    rub.total = rubrics
      .reduce((agg, item) => agg + (rub.abbr === item.abbr ? item.result_equiv : 0), 0);
  });

  data.dataEmployees.forEach(employee => {
    const employeeCurrencyId = parseInt(employee.currency_id, 10);

    employee.rubricTaxable = [];
    employee.rubricNonTaxable = [];
    employee.rubricDiscount = [];
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
      const rate = isSameCurrency ? exchange.rate : 1;

      employee.somRubTaxable_equiv = employee.somRubTaxable / rate;
      employee.somRubNonTaxable_equiv = employee.somRubNonTaxable / rate;
      employee.somChargeEnterprise_equiv = employee.somChargeEnterprise / rate;
      employee.somChargeEmployee_equiv = employee.somChargeEmployee / rate;
    });

    TotalChargeEnterprise += somChargeEnterprise;

    employee.holidaysPaid = holidays
      .filter(holiday => employee.payment_uuid === holiday.payment_uuid)
      .map(holiday => {
        holiday.dailyRate = holiday.value / holiday.holiday_nbdays;
        return holiday;
      });

    employee.offDaysPaid = offDays.filter(offDay => employee.payment_uuid === offDay.payment_uuid);
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
}
module.exports = build;
