/**
 * this file allow to calculate indicators
 */
const _ = require('lodash');
const collect = require('./collect');

exports.processIndicators = processIndicators;
exports.processPeriodicIndicators = processPeriodicIndicators;

/**
 * @function processIndicators
 * @description this function helps to calculate all indicators
 * @param {object} options - may contain date_start, date_end, service_uuid
 * @returns {array}
 */
async function processIndicators(options) {
  const dependencies = {};
  const indicators = {};

  if (options.distinctProject) {
    const projects = await collect.getProjects();
    const hospitalizationByProject = {};
    const hospitalizationByProjectDependencies = {};
    indicators.hospitalizationByProject = {};

    projects.forEach(async p => {
      options.project_id = p.id;
      hospitalizationByProject[p.abbr] = await collect.hospitalization(options);
      hospitalizationByProjectDependencies[p.abbr] = mergeIndicatorsByPeriod(hospitalizationByProject[p.abbr]);

      _.keys(hospitalizationByProjectDependencies[p.abbr]).forEach(period => {
        const periodicDependencies = hospitalizationByProjectDependencies[p.abbr][period];
        indicators.hospitalizationByProject[p.abbr] = getHospitalizationIndicators(
          periodicDependencies, hospitalizationByProject[p.abbr].totalDaysOfPeriods.nb_days,
        );
      });
    });
  }

  const hospitalizationCollection = await collect.hospitalization(options);
  const staffCollection = await collect.staff(options);
  const financeCollection = await collect.finances(options);

  dependencies.hospitalization = mergeIndicatorsByPeriod(hospitalizationCollection);
  dependencies.staff = mergeIndicatorsByPeriod(staffCollection);
  dependencies.finance = mergeIndicatorsByPeriod(financeCollection);

  /**
     * for the given period range, calculate inducators
     * dependencies are objects with keys as period
     * dependencies :
     * { '2019-02-01':
     *   { total_day_realized: 30,
     *     total_hospitalized_patient: 30,
     *     total_death: 30,
     *     period_start: '2019-02-01',
     *     service_name: 'Administration',
     *     total_beds: 20
     *    }
     * }
     */
  _.keys(dependencies.hospitalization).forEach(period => {
    const periodicDependencies = dependencies.hospitalization[period];
    indicators.hospitalization = getHospitalizationIndicators(
      periodicDependencies, hospitalizationCollection.totalDaysOfPeriods.nb_days,
    );
  });

  // staff indicators
  _.keys(dependencies.staff).forEach(period => {
    const periodicDependencies = dependencies.staff[period];
    indicators.staff = getStaffIndicators(
      periodicDependencies, staffCollection.totalDaysOfPeriods.nb_days,
    );
  });

  // finance indicators
  _.keys(dependencies.finance).forEach(period => {
    const periodicDependencies = dependencies.finance[period];
    indicators.finance = getFinanceIndicators(
      periodicDependencies, financeCollection.totalDaysOfPeriods.nb_days,
    );
  });

  const periodicIndicators = await processPeriodicIndicators(options);

  return { indicators, periodicIndicators };
}

/**
 * processPeriodicIndicators
 */
async function processPeriodicIndicators(options) {
  options.groupByPeriod = true;

  const dependencies = {};
  const indicators = {};

  // hospitalization indicators
  const hospitalizationCollection = await collect.hospitalization(options);
  const staffCollection = await collect.staff(options);
  const financeCollection = await collect.finances(options);

  dependencies.hospitalization = mergeIndicatorsByPeriod(hospitalizationCollection);
  dependencies.staff = mergeIndicatorsByPeriod(staffCollection);
  dependencies.finance = mergeIndicatorsByPeriod(financeCollection);

  // hospitalization
  indicators.periodicHospitalization = {};
  _.keys(dependencies.hospitalization).forEach(period => {
    const periodicDependencies = dependencies.hospitalization[period];
    indicators.periodicHospitalization[period] = getHospitalizationIndicators(
      periodicDependencies, hospitalizationCollection.totalDaysOfPeriods.nb_days, period,
    );
  });

  // staff
  indicators.periodicStaff = {};
  _.keys(dependencies.staff).forEach(period => {
    const periodicDependencies = dependencies.staff[period];
    indicators.periodicStaff[period] = getStaffIndicators(
      periodicDependencies, staffCollection.totalDaysOfPeriods.nb_days, period,
    );
  });

  // finance
  indicators.periodicFinance = {};
  _.keys(dependencies.finance).forEach(period => {
    const periodicDependencies = dependencies.finance[period];
    indicators.periodicFinance[period] = getFinanceIndicators(
      periodicDependencies, financeCollection.totalDaysOfPeriods.nb_days, period,
    );
  });

  return {
    hospitalization : formatIndicatorsPeriodicValues(indicators.periodicHospitalization),
    staff : formatIndicatorsPeriodicValues(indicators.periodicStaff),
    finance : formatIndicatorsPeriodicValues(indicators.periodicFinance),
  };
}

/**
 * formatIndicatorsPeriodicValues
 * this function return an object which contains indicators as keys and having as
 * values an array like [{ value : ..., period : ... }, ...]
 *
 * this function help to convert this :
 * [ { idx_one: { value: 1, period: 2019 }, idx_two: { value: 2, period: 2019 } },
 *   { idx_one: { value: 3, period: 2020 }, idx_two: { value: 4, period: 2020 } } ]
 *
 * to :
 * { idx_one: [ { value: 1, period: 2019 }, { value: 3, period: 2020 } ],
 *   idx_two: [ { value: 2, period: 2019 }, { value: 4, period: 2020 } ] }
 * @param {object} periodicIndicators
 */
function formatIndicatorsPeriodicValues(periodicIndicators) {
  const periodicIndicatorsArray = _.flatMap(periodicIndicators);
  return periodicIndicatorsArray.reduce((prev, curr) => {
    Object.entries(curr).forEach(([index, value]) => {
      if (!Array.isArray(prev[index])) {
        prev[index] = [];
      }
      prev[index].push(value);
    });
    return prev;
  }, {});
}

/**
 * @method mergeIndicatorsByPeriod
 * @description
 * this method merge summary and last values indicators variables by periods
 * @param {object} collection
 * an object returned by collect.fn which must be { summaryIndicators: ..., lastValueIndicators: ... }
 */
function mergeIndicatorsByPeriod(collection) {
  const { summaryIndicators, lastValueIndicators } = collection;
  const merged = _.merge(objectize(lastValueIndicators), objectize(summaryIndicators));
  const grouped = _.groupBy(merged, 'period_start');

  _.keys(grouped).forEach(period => {
    [grouped[period]] = grouped[period];
  });

  return grouped;
}

function objectize(obj) {
  return structuredClone(obj);
}

/**
 * hospitalization indicators
 * @param {object} - dependencies
 * An object which contains indicators variables, returned by the mergeIndicatorsByPeriod function
 */
function getHospitalizationIndicators(dependencies, nbDays = 356, period = null) {
  const totalDaysOfPeriods = period ? dependencies.total_period_days : nbDays;
  const bedOccupation = dependencies.total_day_realized
    / (totalDaysOfPeriods || 1)
    / (dependencies.total_beds || 1);

  const bedOccupationRate = bedOccupation * 100;

  const averageHospitalizationDays = dependencies.total_day_realized / dependencies.total_hospitalized_patient;

  const dailyHospitalization = dependencies.total_hospitalized_patient / totalDaysOfPeriods;

  const deathRate = (dependencies.total_death / dependencies.total_hospitalized_patient) * 100;

  // format the result for having indicators and dependencies
  const indicators = {
    totalBeds : {
      value : dependencies.total_beds,
    },

    totalDayRealized : {
      value : dependencies.total_day_realized,
    },

    totalHospitalizedPatient : {
      value : dependencies.total_hospitalized_patient,
    },

    totalDeath : {
      value : dependencies.total_death,
    },

    bedOccupationRate : {
      value : bedOccupationRate,
      dependencies : [
        { key : 'HOSP_DAYS', value : dependencies.total_day_realized },
        { key : 'NB_DAYS', value : totalDaysOfPeriods },
        { key : 'TOTAL_BED', value : dependencies.total_beds },
      ],
      period : period || undefined,
    },

    averageHospitalizationDays : {
      value : averageHospitalizationDays,
      dependencies : [
        { key : 'HOSP_DAYS', value : dependencies.total_day_realized },
        { key : 'TOTAL_HOSPI_PATIENT', value : dependencies.total_hospitalized_patient },
      ],
      period : period || undefined,
    },

    dailyHospitalization : {
      value : dailyHospitalization,
      dependencies : [
        { key : 'TOTAL_HOSPI_PATIENT', value : dependencies.total_hospitalized_patient },
        { key : 'NB_DAYS', value : totalDaysOfPeriods },
      ],
      period : period || undefined,
    },

    deathRate : {
      value : deathRate,
      dependencies : [
        { key : 'TOTAL_DEATH', value : dependencies.total_death },
        { key : 'TOTAL_HOSPI_PATIENT', value : dependencies.total_hospitalized_patient },
      ],
      period : period || undefined,
    },
  };
  return indicators;
}

/**
 * staff indicators
 * @param {object} - dependencies
 * An object which contains indicators variables, returned by the mergeIndicatorsByPeriod function
 */
function getStaffIndicators(dependencies, nbDays = 356, period = null) {
  const totalDaysOfPeriods = period ? dependencies.total_period_days : nbDays;
  const totalMedicalStaff = dependencies.total_doctors + dependencies.total_nurses + dependencies.total_caregivers;

  const doctorOverStaff = (totalMedicalStaff / (dependencies.total_staff || 1)) * 100;

  const dailyVisit = dependencies.total_external_visit / (totalDaysOfPeriods || 1);

  const chargeOverStaff = (
    dependencies.total_visit + (dependencies.total_hospitalized_patient * 6)
  ) / (dependencies.total_staff || 1) / (totalDaysOfPeriods || 1);

  const chargeOverMedicalStaff = (
    dependencies.total_visit + (dependencies.total_hospitalized_patient * 6)
  ) / (totalMedicalStaff || 1) / (totalDaysOfPeriods || 1);

  const surgeryByDoctor = (
    dependencies.total_surgery_by_doctor
  ) / dependencies.total_doctors;

  const patientByDoctor = (
    dependencies.total_visit + dependencies.total_day_realized
  ) / dependencies.total_doctors / (totalDaysOfPeriods || 1);

  // format the result for having indicators and dependencies
  const indicators = {
    doctorOverStaff : {
      value : doctorOverStaff,
      dependencies : [
        { key : 'TOTAL_MEDECINS', value : dependencies.total_doctors },
        { key : 'TOTAL_NURSES', value : dependencies.total_nurses },
        { key : 'TOTAL_HELPERS', value : dependencies.total_caregivers },
        { key : 'TOTAL_STAFF', value : dependencies.total_staff },
      ],
      period : period || undefined,
    },

    dailyVisit : {
      value : dailyVisit,
      dependencies : [
        { key : 'TOTAL_EXTERNAL_CONSULTING', value : dependencies.total_external_visit },
        { key : 'NB_DAYS', value : totalDaysOfPeriods },
      ],
      period : period || undefined,
    },

    chargeOverStaff : {
      value : chargeOverStaff,
      dependencies : [
        { key : 'TOTAL_CONSULTING', value : dependencies.total_visit },
        { key : 'TOTAL_HOSPI_PATIENT', value : dependencies.total_hospitalized_patient },
        { key : 'TOTAL_STAFF', value : dependencies.total_staff },
        { key : 'NB_DAYS', value : totalDaysOfPeriods },
      ],
      period : period || undefined,
    },

    chargeOverMedicalStaff : {
      value : chargeOverMedicalStaff,
      dependencies : [
        { key : 'TOTAL_CONSULTING', value : dependencies.total_visit },
        { key : 'TOTAL_HOSPI_PATIENT', value : dependencies.total_hospitalized_patient },
        { key : 'TOTAL_MEDICAL_STAFF', value : totalMedicalStaff },
        { key : 'NB_DAYS', value : totalDaysOfPeriods },
      ],
      period : period || undefined,
    },

    patientByDoctor : {
      value : patientByDoctor,
      dependencies : [
        { key : 'TOTAL_CONSULTING', value : dependencies.total_visit },
        { key : 'HOSP_DAYS', value : dependencies.total_day_realized },
        { key : 'TOTAL_MEDECINS', value : dependencies.total_doctors },
        { key : 'NB_DAYS', value : totalDaysOfPeriods },
      ],
      period : period || undefined,
    },

    surgeryByDoctor : {
      value : surgeryByDoctor,
      dependencies : [
        { key : 'TOTAL_SURGERY_BY_DOCTOR', value : dependencies.total_surgery_by_doctor },
        { key : 'TOTAL_MEDECINS', value : dependencies.total_doctors },
      ],
      period : period || undefined,
    },
  };
  return indicators;
}

/**
 * finance indicators
 * @param {object} - dependencies
 * An object which contains indicators variables, returned by the mergeIndicatorsByPeriod function
 */
function getFinanceIndicators(dependencies, nbDays = 356, period = null) {
  const totalDaysOfPeriods = period ? dependencies.total_period_days : nbDays;
  const totalPeriods = Math.ceil(totalDaysOfPeriods / 31);

  const operatingRevenueOverStaffCharge = ((
    dependencies.total_revenue - dependencies.total_subsidies - dependencies.total_drugs_sale
  ) / dependencies.total_staff_charge) * 100;

  const staffChargeOverLocalRevenue = (
    dependencies.total_staff_charge / (dependencies.total_revenue - dependencies.total_subsidies)
  ) * 100;

  const averageSalary = dependencies.total_staff_charge / dependencies.total_staff / totalPeriods;

  const autoFinancing = (
    (dependencies.total_revenue - dependencies.total_subsidies) / dependencies.total_expenses
  ) * 100;

  const drugSalesOverPurchased = (dependencies.total_drugs_sale / dependencies.total_drugs_purchased) * 100;

  const ratioVariousExpense = (dependencies.total_other_charge / dependencies.total_expenses) * 100;

  const ratioCashHand = (dependencies.total_cash / (
    dependencies.total_operating_charge - dependencies.total_depreciation
  ) / totalDaysOfPeriods);

  const ratioTurnOver = (dependencies.total_revenue / (
    dependencies.total_cash + dependencies.total_stock_value
  ));

  const ratioTotalMarge = ((
    (dependencies.total_revenue - dependencies.total_expenses) / dependencies.total_revenue
  ));

  const ratioCurrent = ((
    (dependencies.total_cash + dependencies.total_stock_value) / dependencies.total_debts
  ));

  // format the result for having indicators and dependencies
  const indicators = {
    operatingRevenueOverStaffCharge : {
      value : operatingRevenueOverStaffCharge,
      dependencies : [
        { key : 'TOTAL_INCOMES', value : dependencies.total_revenue },
        { key : 'TOTAL_SUBVENTION', value : dependencies.total_subsidies },
        { key : 'TOTAL_DRUGS_SALES', value : dependencies.total_drugs_sale },
        { key : 'TOTAL_STAFF_CHARGE', value : dependencies.total_staff_charge },
      ],
      period : period || undefined,
    },

    staffChargeOverLocalRevenue : {
      value : staffChargeOverLocalRevenue,
      dependencies : [
        { key : 'TOTAL_INCOMES', value : dependencies.total_revenue },
        { key : 'TOTAL_SUBVENTION', value : dependencies.total_subsidies },
        { key : 'TOTAL_STAFF_CHARGE', value : dependencies.total_staff_charge },
      ],
      period : period || undefined,
    },

    averageSalary : {
      value : averageSalary,
      dependencies : [
        { key : 'TOTAL_STAFF', value : dependencies.total_staff },
        { key : 'TOTAL_STAFF_CHARGE', value : dependencies.total_staff_charge },
        { key : 'NB_PERIODS', value : totalPeriods },
      ],
      period : period || undefined,
    },

    autoFinancing : {
      value : autoFinancing,
      dependencies : [
        { key : 'TOTAL_INCOMES', value : dependencies.total_revenue },
        { key : 'TOTAL_SUBVENTION', value : dependencies.total_subsidies },
        { key : 'TOTAL_EXPENSES', value : dependencies.total_expenses },
      ],
      period : period || undefined,
    },

    drugSalesOverPurchased : {
      value : drugSalesOverPurchased,
      dependencies : [
        { key : 'TOTAL_DRUGS_SALES', value : dependencies.total_drugs_sale },
        { key : 'TOTAL_DRUGS_PURCHASE', value : dependencies.total_drugs_purchased },
      ],
      period : period || undefined,
    },

    ratioVariousExpense : {
      value : ratioVariousExpense,
      dependencies : [
        { key : 'TOTAL_OTHER_EXPENSES', value : dependencies.total_other_charge },
        { key : 'TOTAL_EXPENSES', value : dependencies.total_expenses },
      ],
      period : period || undefined,
    },

    ratioCashHand : {
      value : ratioCashHand,
      dependencies : [
        { key : 'TOTAL_CASH', value : dependencies.total_cash },
        { key : 'TOTAL_OPERATING_CHARGE', value : dependencies.total_operating_charge },
        { key : 'TOTAL_DEPRECIATION', value : dependencies.total_depreciation },
        { key : 'NB_DAYS', value : totalDaysOfPeriods },
      ],
      period : period || undefined,
    },

    ratioTurnOver : {
      value : ratioTurnOver,
      dependencies : [
        { key : 'TOTAL_INCOMES', value : dependencies.total_revenue },
        { key : 'TOTAL_CASH', value : dependencies.total_cash },
        { key : 'TOTAL_STOCK_VALUE', value : dependencies.total_stock_value },
      ],
      period : period || undefined,
    },

    ratioTotalMarge : {
      value : ratioTotalMarge,
      dependencies : [
        { key : 'TOTAL_INCOMES', value : dependencies.total_revenue },
        { key : 'TOTAL_EXPENSES', value : dependencies.total_expenses },
      ],
      period : period || undefined,
    },

    ratioCurrent : {
      value : ratioCurrent,
      dependencies : [
        { key : 'TOTAL_CASH', value : dependencies.total_cash },
        { key : 'TOTAL_STOCK_VALUE', value : dependencies.total_stock_value },
        { key : 'TOTAL_DEBTS', value : dependencies.total_debts },
      ],
      period : period || undefined,
    },
  };
  return indicators;
}
