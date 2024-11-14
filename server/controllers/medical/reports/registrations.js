/**
 * @overview reports/registrations
 *
 * @description
 * This file contains code to create a PDF report of all patient registrations,
 * matching query conditions passed from the patient registry UI grid.
 *
 * @requires lodash
 * @requires moment
 * @requires Patients
 * @requires ReportManager
 */

const _ = require('lodash');
const moment = require('moment');

const ReportManager = require('../../../lib/ReportManager');
const db = require('../../../lib/db');

const Patients = require('../patients');
const shared = require('../../finance/reports/shared');

const TEMPLATE = './server/controllers/medical/reports/registrations.handlebars';

/**
 * @method build
 *
 * @description
 * This method builds the report of patient registrations to be shipped back to
 * the client.  This method will eventually use the Patients.search() method to
 * specify query conditions.
 *
 * GET /reports/patient/registrations
 */
async function build(req, res, next) {
  const options = _.clone(req.query);

  _.extend(options, {
    filename : 'PATIENT_REG.PAGE_TITLE',
    csvKey : 'patients',
    orientation : 'landscape',
  });

  let report;

  // set up the report with report manager
  try {
    report = new ReportManager(TEMPLATE, req.session, options);
    delete options.orientation;

    const filters = shared.formatFilters(options);

    // enforce detailed columns
    options.detailed = 1;

    const sql = `
    SELECT COUNT(patient.uuid) AS numPatients, MIN(patient.created_at) AS minDate, MAX(patient.created_at) AS maxDate,
      COUNT(DISTINCT(DATE(patient.created_at))) AS numDays,
      SUM(sex = 'F') AS numFemales, ROUND(SUM(sex = 'F') / COUNT(patient.uuid) * 100) AS percentFemales,
      SUM(sex = 'M') AS numMales, ROUND(SUM(sex = 'M') / COUNT(patient.uuid) * 100) AS percentMales,
      COUNT(DISTINCT(patient.current_location_id)) AS numDistinctResidences,
      COUNT(DISTINCT(debtor.group_uuid)) AS numDebtorGroups
    FROM patient JOIN debtor ON patient.debtor_uuid = debtor.uuid
    WHERE patient.uuid IN (?);
  `;

    const patients = await Patients.find(options);

    // calculate ages with moment
    patients.forEach(patient => {
      patient.age = moment().diff(patient.dob, 'years');
    });

    let aggregates = {};
    if (patients.length !== 0) {
      // gather the uuids for the aggregate queries
      const uuids = patients.map(p => db.bid(p.uuid));
      aggregates = await db.one(sql, [uuids]);
    }

    const result = await report.render({ patients, filters, aggregates });
    res.set(result.headers).send(result.report);
  } catch (e) {
    next(e);

  }
}

module.exports = build;
