/**
 * @overview
 * indicator Reports
 *
 * @description
 * report for indicators(staff, hospitalization and finances)
 *
 * @todo - implement the filtering portion of this.  See patient registrations
 * for inspiration.
 */

const moment = require('moment');
const process = require('./process');
const ReportManager = require('../../../../lib/ReportManager');
const service = require('../../../admin/services');

const REPORT_TEMPLATE = './server/controllers/finance/indicator/dashboard/report.handlebars';

exports.report = report;

/**
 * @function report
 * @desc build a report for invoice patient report of metadata
 * @param {array} data invoice patient report of metadata
 * @return {object} promise
 */
async function report(req, res) {

  const query = structuredClone(req.query);
  const options = req.query;
  const data = { display : {} };

  Object.assign(query, {
    filename : 'REPORT.REPORT_INDICATORS.TITLE',
    csvKey : 'rows',
  });

  const indicatorTypes = ['finances', 'hospitalization', 'staff'];

  const reportInstance = new ReportManager(REPORT_TEMPLATE, req.session, query);

  options.distinctProject = true;

  const result = await lookupIndicators(options);
  if (options.type) { // a specific indicator type is defined
    data.display[options.type] = true; // only this type of indicator will be displayed
    indicatorTypes.forEach(tp => {
      if (options.type !== tp) {
        data.display[tp] = false;
      }
    });
  } else {
    indicatorTypes.forEach(tp => {
      data.display[tp] = true;
    });
  }
  data.indicators = result.indicators;
  data.dateFrom = options.dateFrom;
  data.dateTo = options.dateTo;

  if (options.service_uuid) {
    data.serviceName = (await service.lookupService(options.service_uuid)).name;
  }

  const r = await reportInstance.render(data);
  res.set(r.headers).send(r.report);
}

function lookupIndicators(options) {
  options.dateFrom = moment(options.dateFrom).format('YYYY-MM-DD');
  options.dateTo = moment(options.dateTo).format('YYYY-MM-DD');
  return process.processIndicators(options);
}
