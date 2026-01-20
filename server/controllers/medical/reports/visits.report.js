/**
 * Visits Report
 */
const moment = require('moment');
const ReportManager = require('../../../lib/ReportManager');
const db = require('../../../lib/db');

// path to the template to render
const TEMPLATE = './server/controllers/medical/reports/visits.report.handlebars';

exports.document = document;

async function document(req, res) {
  const params = req.query;

  const optionReport = Object.assign(params, {
    filename : 'PATIENT_RECORDS.REPORT.VISITS',
  });

  const report = new ReportManager(TEMPLATE, req.session, optionReport);

  const visits = await getData(params);
  const result = await report.render({ visits, params });
  res.set(result.headers).send(result.report);
}

async function getData(options) {
  const queryData = `
    SELECT
      s.name AS service_name,
      SUM(1) AS total,
      SUM(IF(is_new_case, 1, 0)) AS total_new_case,
      SUM(IF(is_new_case, 0, 1)) AS total_old_case,
      SUM(IF(is_pregnant, 1, 0)) AS total_pregnant,
      SUM(IF(is_refered, 1, 0)) AS total_referred,
      SUM(IF(hospitalized, 1, 0)) AS total_hospitalized,
      SUM(IF(hospitalized = 0, 1, 0)) AS total_ambulatory,
      SUM(IF(inside_health_zone, 1, 0)) AS total_inside_health_zone,
      SUM(IF(inside_health_zone = 0, 1, 0)) AS total_outside_health_zone
    FROM service s
      LEFT JOIN patient_visit_service pvs ON s.uuid = pvs.service_uuid
      JOIN patient_visit pv ON pvs.patient_visit_uuid = pv.uuid
    WHERE DATE(pvs.created_at) BETWEEN DATE(?) AND DATE(?)
    GROUP BY s.uuid;
  `;

  const queryTotal = `
    SELECT
      s.name AS service_name,
      SUM(1) AS total,
      SUM(IF(is_new_case, 1, 0)) AS total_new_case,
      SUM(IF(is_new_case, 0, 1)) AS total_old_case,
      SUM(IF(is_pregnant, 1, 0)) AS total_pregnant,
      SUM(IF(is_refered, 1, 0)) AS total_referred,
      SUM(IF(hospitalized, 1, 0)) AS total_hospitalized,
      SUM(IF(hospitalized = 0, 1, 0)) AS total_ambulatory,
      SUM(IF(inside_health_zone, 1, 0)) AS total_inside_health_zone,
      SUM(IF(inside_health_zone = 0, 1, 0)) AS total_outside_health_zone
    FROM service s
      LEFT JOIN patient_visit_service pvs ON s.uuid = pvs.service_uuid
      JOIN patient_visit pv ON pvs.patient_visit_uuid = pv.uuid
    WHERE DATE(pvs.created_at) BETWEEN DATE(?) AND DATE(?);
  `;

  const queryParams = [
    moment(options.dateFrom).format('YYYY-MM-DD'),
    moment(options.dateTo).format('YYYY-MM-DD'),
  ];

  const [data, [total]] = await Promise.all([
    db.exec(queryData, queryParams),
    db.exec(queryTotal, queryParams),
  ]);

  return { data, total };
}
