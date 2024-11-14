/*
  * Return BalanceSheet Elements for Reports
*/
const _ = require('lodash');
const db = require('../../../../lib/db');

function balanceSheetAssetTable() {
  const data = [
    { ref : 'AD', is_title : 1, note : 3 },
    { ref : 'AE', is_title : 0 },
    { ref : 'AF', is_title : 0 },
    { ref : 'AG', is_title : 0 },
    { ref : 'AH', is_title : 0 },
    { ref : 'AI', is_title : 1, note : 3 },
    { ref : 'AJ', is_title : 0 },
    { ref : 'AK', is_title : 0 },
    { ref : 'AL', is_title : 0 },
    { ref : 'AM', is_title : 0 },
    { ref : 'AN', is_title : 0 },
    { ref : 'AP', is_title : 0, note : 3 },
    { ref : 'AQ', is_title : 1, note : 4 },
    { ref : 'AR', is_title : 0 },
    { ref : 'AS', is_title : 0 },
    { ref : 'AZ', is_title : 1 },
    { ref : 'BA', is_title : 0, note : 5 },
    { ref : 'BB', is_title : 1, note : 6 },
    { ref : 'BC', is_title : 0 },
    { ref : 'BD', is_title : 0 },
    { ref : 'BE', is_title : 0 },
    { ref : 'BF', is_title : 0 },
    { ref : 'BG', is_title : 1 },
    { ref : 'BH', is_title : 0, note : 17 },
    { ref : 'BI', is_title : 0, note : 7 },
    { ref : 'BJ', is_title : 0, note : 8 },
    { ref : 'BK', is_title : 1 },
    { ref : 'BQ', is_title : 0 },
    { ref : 'BR', is_title : 0 },
    { ref : 'BS', is_title : 0, note : 11 },
    { ref : 'BT', is_title : 1 },
    { ref : 'BU', is_title : 0, note : 12 },
    { ref : 'BZ', is_title : 1 },
  ];

  return data;
}

function balanceSheetLiabilityTable() {
  const data = [
    { ref : 'CA', is_title : 0, note : 13 },
    { ref : 'CB', is_title : 0, note : 13 },
    { ref : 'CC', is_title : 1 },
    { ref : 'CD', is_title : 0, note : '3e' },
    { ref : 'CE', is_title : 0, note : 14 },
    { ref : 'CF', is_title : 0, note : 14 },
    { ref : 'CG', is_title : 0 },
    { ref : 'CH', is_title : 1, note : 15 },
    { ref : 'CI', is_title : 1, note : 15 },
    { ref : 'CK', is_title : 1 },
    { ref : 'CL', is_title : 0 },
    { ref : 'CM', is_title : 0 },
    { ref : 'CP', is_title : 1 },
    { ref : 'DA', is_title : 0, note : 16 },
    { ref : 'DB', is_title : 0 },
    { ref : 'DC', is_title : 0, note : 16 },
    { ref : 'DD', is_title : 0 },
    { ref : 'DF', is_title : 1 },
    { ref : 'DG', is_title : 1 },
    { ref : 'DH', is_title : 0, note : 5 },
    { ref : 'DI', is_title : 0, note : 7 },
    { ref : 'DJ', is_title : 0, note : 17 },
    { ref : 'DK', is_title : 0, note : 18 },
    { ref : 'DM', is_title : 0, note : 19 },
    { ref : 'DN', is_title : 0 },
    { ref : 'DP', is_title : 1 },
    { ref : 'DQ', is_title : 0 },
    { ref : 'DR', is_title : 0 },
    { ref : 'DS', is_title : 0 },
    { ref : 'DT', is_title : 1 },
    { ref : 'DV', is_title : 1, note : 12 },
    { ref : 'DZ', is_title : 1 },
  ];

  return data;
}

function getFiscalYearDetails(fiscalYearId) {
  const bundle = {};
  /**
   * This query get data from the period zero of the next
   * fiscal year which will correspond to the ending balance of the selected
   * fiscal year
   */
  const query = `
    SELECT
      p.id AS period_id, fy.end_date,
      fy.id, fy.label, fy.previous_fiscal_year_id
    FROM fiscal_year fy
    JOIN period p ON p.fiscal_year_id = fy.id
      AND p.number = 0
    WHERE fy.id = ?;
  `;

  /**
   * This query help to get temporary data from the last period
   * of the selected fiscal year which will correspond to the
   * temporary ending balance of the selected fiscal year
   */
  const queryTemporary = `
    SELECT
      p.id AS period_id, fy.end_date,
      fy.id, fy.label, fy.previous_fiscal_year_id
    FROM fiscal_year fy
    JOIN period p ON p.fiscal_year_id = fy.id
      AND p.number = (SELECT MAX(per.number) FROM period per WHERE per.fiscal_year_id = ?)
    WHERE fy.id = ?;
  `;

  /**
   * this query helps to get information about the selected fiscal year and
   * the previous fiscal year
   */
  const queryDetails = `
    SELECT
      cur.id, cur.label AS current_fiscal_year, cur.start_date, cur.end_date, cur.locked AS current_locked,
      pre.id AS previous_fiscal_id, pre.label AS previous_fiscal_year, pre.locked AS previous_locked
    FROM fiscal_year cur
    LEFT JOIN fiscal_year pre ON pre.id = cur.previous_fiscal_year_id
    WHERE cur.id = ?;
  `;

  /**
   * this query helps to get information about the next fiscal year
   */
  const queryNext = `
    SELECT id FROM fiscal_year WHERE previous_fiscal_year_id = ?;
  `;
  return db.one(queryDetails, [fiscalYearId])
    .then(details => {
      bundle.details = details;
      return db.exec(queryNext, [fiscalYearId]);
    })
    .then((rows) => {
      /**
       * get details of the next fiscal year for totals,
       * if the next fiscal year doesn't exists use the selected fiscal year until its last period
       */
      const nextFiscalYear = rows.length > 0 && bundle.details.current_locked === 1 ? rows[0] : {};
      return nextFiscalYear.id
        ? db.one(query, [nextFiscalYear.id]) : db.one(queryTemporary, [fiscalYearId, fiscalYearId]);
    })
    .then(fiscalYear => {
      /**
       * use data of the period zero of the next year as current
       * current referes to the selected fiscal year
       */
      bundle.current = fiscalYear;
      return fiscalYearId ? db.one(query, [fiscalYearId]) : {};
    })
    .then(previousFiscalYear => {
      /**
       * use data of the period zero of the selected year as previous
       * previous referes to the fiscal year before the selected one
       */
      bundle.previous = previousFiscalYear;
      return bundle;
    });
}

function formatReferences(references) {
  const values = {};
  _.forEach(references, (reference, key) => {
    const [brut] = reference.filter(elt => elt.is_amo_dep === 0);
    let [amortissement] = reference.filter(elt => elt.is_amo_dep === 1);

    if (!amortissement) {
      amortissement = { balance : 0 };
    }

    const net = {
      abbr : brut.abbr,
      description : brut.description,
      // reduce amortissement from brut
      // the amortissement is supposed to be < 0
      // that the reason we use brut + amortissement which is implicitly brut - amortissement
      balance : brut.balance + amortissement.balance,
    };

    values[key] = { brut, amortissement, net };
  });
  return values;
}

exports.balanceSheetAssetTable = balanceSheetAssetTable;
exports.balanceSheetLiabilityTable = balanceSheetLiabilityTable;
exports.getFiscalYearDetails = getFiscalYearDetails;
exports.formatReferences = formatReferences;
