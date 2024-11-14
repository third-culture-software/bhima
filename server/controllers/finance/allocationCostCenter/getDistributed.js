/**
* Distribution Cost Center Controller
*
* This function searches all the distributions of the costs and profits made, in order to allow possible updates.
*/
const fiscal = require('../fiscal');
const db = require('../../../lib/db');
const FilterParser = require('../../../lib/filter');

async function getDistributed(req, res, next) {

  try {
    const options = req.query;

    const { periodFrom, periodTo } = options;
    options.is_cost = options.typeCostCenter;
    options.limit = 100;

    if (options.cost_center_id || options.trans_id) {
      delete options.limit;
    }
    // get max and min date from period ids.
    if (periodFrom && periodTo) {
      const periods = {
        periodFrom,
        periodTo,
      };

      const result = await fiscal.getDateRangeFromPeriods(periods);
      options.custom_period_start = result.dateFrom;
      options.custom_period_end = result.dateTo;
    }
    const filters = new FilterParser(options, { tableAlias : 'gl' });

    const sql = `
      SELECT fc.id, BUID(fc.row_uuid) AS row_uuid, fc.trans_id, fc.account_id, fc.is_cost, fc.is_variable,
      fc.is_turnover, fc.auxiliary_cost_center_id, fc.principal_cost_center_id, fc.debit_equiv, fc.credit_equiv,
      fc.date_distribution, fc.user_id, gl.project_id, gl.fiscal_year_id, gl.period_id, gl.trans_date,
      gl.description, gl.transaction_type_id, BUID(gl.record_uuid) AS record_uuid, gl.entity_uuid,
      BUID(gl.reference_uuid) AS reference_uuid, ac.number AS account_number, ac.label AS account_label,
      aux.label AS cost_center_label, pri.label AS principal_label, dm1.text AS hrRecord, dm2.text AS hrReference,
      u.display_name AS user_name
      FROM cost_center_allocation AS fc
      JOIN general_ledger AS gl ON gl.uuid = fc.row_uuid
      JOIN account AS ac ON ac.id = gl.account_id
      JOIN cost_center AS aux ON aux.id = fc.auxiliary_cost_center_id
      JOIN cost_center AS pri ON pri.id = fc.principal_cost_center_id
      JOIN user AS u ON u.id = fc.user_id
      LEFT JOIN document_map dm1 ON dm1.uuid = gl.record_uuid
      LEFT JOIN document_map dm2 ON dm2.uuid = gl.reference_uuid
    `;

    filters.dateFrom('custom_period_start', 'trans_date', 'gl');
    filters.dateTo('custom_period_end', 'trans_date', 'gl');
    filters.equals('trans_id');
    filters.equals('is_cost', 'is_cost', 'fc');
    filters.equals('cost_center_id', 'id', 'aux');
    filters.equals('account_id', 'account_id', 'fc');

    const query = filters.applyQuery(sql);

    const parameters = filters.parameters();

    const rows = await db.exec(query, parameters);
    res.status(200).json(rows);
  } catch (ex) {
    next(ex);
  }
}

exports.getDistributed = getDistributed;
