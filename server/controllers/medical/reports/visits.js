/**
 * @overview reports/visits
 *
 * @description
 * This file contains code to create a PDF report of all patient visits,
 * matching query conditions passed from the patient registry UI grid.
 *
 * @requires lib/db
 * @requires lib/ReportManager
 * @requires Patients
 * @requires Locations
 */

const db = require('../../../lib/db');
const ReportManager = require('../../../lib/ReportManager');

const Locations = require('../../admin/locations');
const Patients = require('../patients');

// path to the template to render
const TEMPLATE = './server/controllers/medical/reports/visits.handlebars';

/**
 * @function getReportData
 *
 * @description
 * Compiles the data for the visits report from the patient table and previous
 * visits.
 *
 * @param {String} uuid - the patient uuid to look up
 */
async function getReportData(uuid) {
  // data to be passed to the report
  const data = {
    metadata : { timestamp : new Date() },
  };

  const patient = await Patients.lookupPatient(uuid);
  data.patient = patient;

  // make sure the patient year is set properly
  data.patient.year = new Date(patient.registration_date).getFullYear();

  // allow logical switches in patient sex
  data.patient.isMale = patient.sex === 'M';

  const location = await Locations.lookupVillage(patient.origin_location_id);
  // bind location
  data.location = location;

  const sql = `
        SELECT BUID(patient_uuid) AS patient_uuid, start_date, YEAR(start_date) AS year,
          end_date, user.display_name,
          DATEDIFF(IFNULL(patient_visit.end_date, CURRENT_DATE()), patient_visit.start_date) AS duration,
          IFNULL(patient_visit.end_date, 1) AS in_progress,
          patient_visit.hospitalized, patient_visit.start_notes, patient_visit.end_notes,
          icds.label AS start_diagnosis_label, icds.code AS start_diagnosis_code,
          icde.label AS end_diagnosis_label, icde.code AS end_diagnosis_code
        FROM patient_visit
        JOIN user ON patient_visit.user_id = user.id
        LEFT JOIN icd10 icds ON icds.id = patient_visit.start_diagnosis_id
        LEFT JOIN icd10 icde ON icde.id = patient_visit.end_diagnosis_id
        WHERE patient_uuid = ?
        ORDER BY start_date DESC;
      `;

  const visits = await db.exec(sql, [db.bid(uuid)]);
  // grouping by year allows pretty table groupings
  // data.visits = _.groupBy(visits, 'year');
  data.visits = visits;
  data.total = visits.length;
  data.showMedicalInfo = true;
  return data;
}

/**
 * @method build
 *
 * @description
 * This function builds a patient checkin report.  The checkin report begins
 * with the patient registration and lists all visits since the initial
 * registration.
 *
 * GET /reports/patients/:uuid/visits
 */
async function build(req, res) {
  const options = req.query;
  Object.assign(options, { filename : 'PATIENT_RECORDS.VISITS.TITLE' });

  const report = new ReportManager(TEMPLATE, req.session, options);

  // gather data and template into report
  const data = await getReportData(req.params.uuid);
  const result = await report.render(data);
  res.set(result.headers).send(result.report);
}

module.exports = build;
