const _ = require('lodash');
const db = require('../../../../lib/db');
const FilterParser = require('../../../../lib/filter');

module.exports.hospitalization = hospitalization;
module.exports.finances = finances;
module.exports.staff = staff;
module.exports.getProjects = getProjects;

function getDaysOfPeriods(options) {
  const query = `SELECT DATEDIFF(DATE(?), DATE(?)) + 1 AS nb_days;`;
  return db.one(query, [options.dateTo, options.dateFrom]);
}

function getProjects() { return db.exec('SELECT id, abbr FROM project;'); }

async function hospitalization(options) {
  // indicators variables are collected by summarized them according the given periods
  const sqlSumAggregated = `
      SELECT 
        SUM(IFNULL(hi.total_day_realized, 0)) AS total_day_realized,
        SUM(IFNULL(hi.total_hospitalized_patient, 0)) AS total_hospitalized_patient,
        SUM(IFNULL(hi.total_death, 0)) AS total_death,
        DATE_FORMAT(p.start_date, "%Y-%m-%d") as period_start,
        DATEDIFF(p.end_date, p.start_date) + 1 AS total_period_days,
        s.name as service_name
      FROM hospitalization_indicator hi  
      JOIN indicator ind ON ind.uuid = hi.indicator_uuid
      JOIN period p ON p.id = ind.period_id
      JOIN service s ON s.uuid = ind.service_uuid
    `;

  const sqlLastAggregated = `
      SELECT 
        SUM(IFNULL(hi.total_beds, 0)) AS total_beds,
        DATE_FORMAT(p.start_date, "%Y-%m-%d") as period_start,
        DATEDIFF(p.end_date, p.start_date) + 1 AS total_period_days,
        s.name as service_name
      FROM hospitalization_indicator hi  
      JOIN indicator ind ON ind.uuid = hi.indicator_uuid
      JOIN period p ON p.id = ind.period_id
      JOIN service s ON s.uuid = ind.service_uuid
    `;

  db.convert(options, ['uuid', 'indicator_uuid']);

  // this first filter will be used for the sums query
  let filters1 = new FilterParser(options, { tableAlias : 'hi' });

  // this second filter will be used for the last value query
  const limitedOptions = !options.groupByPeriod ? _.extend({ limit : 1 }, options) : options;
  let filters2 = new FilterParser(limitedOptions, { tableAlias : 'hi' });

  filters1 = defaultFilters(filters1);
  filters2 = defaultFilters(filters2);

  if (options.project_id) {
    filters1.equals('project_id', 'project_id', 's');
    filters2.equals('project_id', 'project_id', 's');
  }

  // group by periods
  if (options.groupByPeriod) {
    filters1.setGroup('GROUP BY p.id');
  }

  // allow to get data of the latest period only for this filter2
  filters2.setGroup('GROUP BY p.id');

  const sqlSummary = filters1.applyQuery(sqlSumAggregated);
  const sqlLast = filters2.applyQuery(sqlLastAggregated);

  // sums query
  const data1 = await db.exec(sqlSummary, filters1.parameters());
  // last value query
  const data2 = await db.exec(sqlLast, filters2.parameters());
  // number of days between end date and start date
  const totalDaysOfPeriods = await getDaysOfPeriods({ dateFrom : options.dateFrom, dateTo : options.dateTo });

  return { summaryIndicators : data1, lastValueIndicators : data2, totalDaysOfPeriods };
}

async function finances(options) {

  // get the sum value for each column
  const sqlSumAggregated = `
      SELECT 
        SUM(IFNULL(fi.total_revenue, 0)) AS total_revenue,
        SUM(IFNULL(fi.total_subsidies, 0)) AS total_subsidies,
        SUM(IFNULL(fi.total_drugs_sale, 0)) AS total_drugs_sale,
        SUM(IFNULL(fi.total_expenses, 0)) AS total_expenses,
        SUM(IFNULL(fi.total_other_charge, 0)) AS total_other_charge,
        SUM(IFNULL(fi.total_drugs_purchased, 0)) AS total_drugs_purchased,
        SUM(IFNULL(fi.total_staff_charge, 0)) AS total_staff_charge,
        SUM(IFNULL(fi.total_operating_charge, 0)) AS total_operating_charge,
        SUM(IFNULL(fi.total_depreciation, 0)) AS total_depreciation,
        SUM(IFNULL(fi.total_debts, 0)) AS total_debts,
        DATE_FORMAT(p.start_date, "%Y-%m-%d") as period_start,
        DATEDIFF(p.end_date, p.start_date) AS total_period_days
      FROM finance_indicator fi  
      JOIN indicator ind ON ind.uuid = fi.indicator_uuid
      JOIN period p ON p.id = ind.period_id
    `;

  // indicators variables are collected by considering just values of the last period
  const sqlLastAggregated = `
      SELECT 
        IFNULL(fi.total_cash, 0) AS total_cash,
        IFNULL(fi.total_staff, 0) AS total_staff,
        IFNULL(fi.total_stock_value, 0) AS total_stock_value,
        DATE_FORMAT(p.start_date, "%Y-%m-%d") as period_start,
        DATEDIFF(p.end_date, p.start_date) AS total_period_days
      FROM finance_indicator fi  
      JOIN indicator ind ON ind.uuid = fi.indicator_uuid
      JOIN period p ON p.id = ind.period_id
    `;

  db.convert(options, ['uuid', 'indicator_uuid']);

  // this filter will be used for the sums query
  let filters1 = new FilterParser(options, { tableAlias : 'fi' });

  // this second filter will be used for the last value query
  const limitedOptions = !options.groupByPeriod ? _.extend({ limit : 1 }, options) : options;
  let filters2 = new FilterParser(limitedOptions, { tableAlias : 'fi' });

  filters1 = defaultFilters(filters1);
  filters2 = defaultFilters(filters2);

  // groupByPeriod key specify if it is necessary to group by period
  if (options.groupByPeriod) {
    filters1.setGroup('GROUP BY p.id');
  }
  // sums query
  const data1 = await db.exec(filters1.applyQuery(sqlSumAggregated), filters1.parameters());
  // last value query
  const data2 = await db.exec(filters2.applyQuery(sqlLastAggregated), filters2.parameters());
  // number of days between end date and start date
  const totalDaysOfPeriods = await getDaysOfPeriods({ dateFrom : options.dateFrom, dateTo : options.dateTo });

  return { summaryIndicators : data1, lastValueIndicators : data2, totalDaysOfPeriods };
}

async function staff(options) {

  // get the sum value for each column
  const sqlSumAggregated = `
      SELECT 
        SUM(IFNULL(si.total_external_visit, 0)) AS total_external_visit,
        SUM(IFNULL(si.total_visit, 0)) AS total_visit,
        SUM(IFNULL(si.total_surgery_by_doctor, 0)) AS total_surgery_by_doctor,
        SUM(IFNULL(si.total_day_realized, 0)) AS total_day_realized,
        SUM(IFNULL(si.total_hospitalized_patient, 0)) AS total_hospitalized_patient,
        DATE_FORMAT(p.start_date, "%Y-%m-%d") as period_start,
        DATEDIFF(p.end_date, p.start_date) AS total_period_days
      FROM staff_indicator si
      JOIN indicator ind ON ind.uuid = si.indicator_uuid
      JOIN period p ON p.id = ind.period_id
    `;

  // indicators variables are collected by considering just values of the last period
  const sqlLastAggregated = `
      SELECT 
        IFNULL(si.total_doctors, 0) AS total_doctors,
        IFNULL(si.total_nurses, 0) AS total_nurses,
        IFNULL(si.total_caregivers, 0) AS total_caregivers ,
        IFNULL(si.total_staff, 0) AS total_staff,
        DATE_FORMAT(p.start_date, "%Y-%m-%d") as period_start,
        DATEDIFF(p.end_date, p.start_date) AS total_period_days
      FROM staff_indicator si  
      JOIN indicator ind ON ind.uuid = si.indicator_uuid
      JOIN period p ON p.id = ind.period_id
    `;

  db.convert(options, ['uuid', 'indicator_uuid']);

  // this filter will be used for the sums query
  let filters1 = new FilterParser(options, { tableAlias : 'si' });

  // this second filter will be used for the last value query
  const limitedOptions = !options.groupByPeriod ? _.extend({ limit : 1 }, options) : options;
  let filters2 = new FilterParser(limitedOptions, { tableAlias : 'si' });

  filters1 = defaultFilters(filters1);
  filters2 = defaultFilters(filters2);

  // groupByPeriod only for sqlSumAggregated
  if (options.groupByPeriod) {
    filters1.setGroup('GROUP BY p.id');
  }
  // sums query
  const data1 = await db.exec(filters1.applyQuery(sqlSumAggregated), filters1.parameters());
  // last value query
  const data2 = await db.exec(filters2.applyQuery(sqlLastAggregated), filters2.parameters());
  // number of days between end date and start date
  const totalDaysOfPeriods = await getDaysOfPeriods({ dateFrom : options.dateFrom, dateTo : options.dateTo });

  return { summaryIndicators : data1, lastValueIndicators : data2, totalDaysOfPeriods };
}

// add default filters used for every indicator
function defaultFilters(filters) {
  filters.equals('indicator_uuid');
  filters.custom('user_id', 'ind.user_id=?');
  filters.custom('status_id', 'ind.status_id=?');
  filters.custom('period_id', 'ind.period_id=?');
  filters.custom('dateFrom', 'DATE(p.start_date) >= DATE(?)');
  filters.custom('dateTo', 'DATE(p.end_date) <= DATE(?)');
  filters.equals('service_uuid', 'service_uuid', 'ind');
  filters.setOrder('ORDER BY p.start_date DESC');
  return filters;
}
