/* eslint-disable no-useless-catch */
/**
 * Ohada Profit loss Controller
 *
 * This controller is responsible for processing
 * the ohada profit loss report.
 *
 * @module reports/ohada_profit_loss
 *
 * @requires lodash
 * @requires lib/db
 * @requires lib/ReportManager
 * @requires lib/errors/BadRequest
 */

const _ = require('lodash');
const db = require('../../../../lib/db');
const AccountReference = require('../../accounts/references');
const ReportManager = require('../../../../lib/ReportManager');

// expose to the API
exports.document = document;
exports.reporting = reporting;

// report template
const TEMPLATE = './server/controllers/finance/reports/ohada_profit_loss/report.handlebars';

// default report parameters
const DEFAULT_PARAMS = {
  csvKey : 'accounts',
  filename : 'REPORT.OHADA.PROFIT_LOSS',
  orientation : 'landscape',
};

// RB, RD, RF
const profitLossTable = [
  {
    ref : 'TA', is_title : 0, sign : '+', note : 21,
  },
  {
    ref : 'RA', is_title : 0, sign : '-', note : 22,
  },
  {
    ref : 'RB', is_title : 0, sign : '-/+', note : 6,
  },
  {
    ref : 'XA', is_title : 1, sign : '', note : '',
  },
  {
    ref : 'TB', is_title : 0, sign : '+', note : 21,
  },
  {
    ref : 'TC', is_title : 0, sign : '+', note : 21,
  },
  {
    ref : 'TD', is_title : 0, sign : '+', note : 21,
  },
  {
    ref : 'XB', is_title : 1, sign : '', note : '',
  },
  {
    ref : 'TE', is_title : 0, sign : '+', note : 6,
  },
  {
    ref : 'TF', is_title : 0, sign : '+', note : 21,
  },
  {
    ref : 'TG', is_title : 0, sign : '+', note : 21,
  },
  {
    ref : 'TH', is_title : 0, sign : '+', note : 21,
  },
  {
    ref : 'TI', is_title : 0, sign : '+', note : 12,
  },
  {
    ref : 'RC', is_title : 0, sign : '-', note : 22,
  },
  {
    ref : 'RD', is_title : 0, sign : '-/+', note : 6,
  },
  {
    ref : 'RE', is_title : 0, sign : '-', note : 22,
  },
  {
    ref : 'RF', is_title : 0, sign : '-/+', note : 6,
  },
  {
    ref : 'RG', is_title : 0, sign : '-', note : 23,
  },
  {
    ref : 'RH', is_title : 0, sign : '-', note : 24,
  },
  {
    ref : 'RI', is_title : 0, sign : '-', note : 25,
  },
  {
    ref : 'RJ', is_title : 0, sign : '-', note : 26,
  },
  {
    ref : 'XC', is_title : 1, sign : '', note : '',
  },
  {
    ref : 'RK', is_title : 0, sign : '-', note : 27,
  },
  {
    ref : 'XD', is_title : 1, sign : '', note : '',
  },
  {
    ref : 'TJ', is_title : 0, sign : '+', note : 28,
  },
  {
    ref : 'RL', is_title : 0, sign : '-', note : '3C&28',
  },
  {
    ref : 'XE', is_title : 1, sign : '', note : '',
  },
  {
    ref : 'TK', is_title : 0, sign : '+', note : 29,
  },
  {
    ref : 'TL', is_title : 0, sign : '+', note : 28,
  },
  {
    ref : 'TM', is_title : 0, sign : '+', note : 12,
  },
  {
    ref : 'RM', is_title : 0, sign : '-', note : 29,
  },
  {
    ref : 'RN', is_title : 0, sign : '-', note : '3C&28',
  },
  {
    ref : 'XF', is_title : 1, sign : '', note : '',
  },
  {
    ref : 'XG', is_title : 1, sign : '', note : '',
  },
  {
    ref : 'TN', is_title : 0, sign : '+', note : '3D',
  },
  {
    ref : 'TO', is_title : 0, sign : '+', note : 30,
  },
  {
    ref : 'RO', is_title : 0, sign : '-', note : '3D',
  },
  {
    ref : 'RP', is_title : 0, sign : '-', note : 30,
  },
  {
    ref : 'XH', is_title : 1, sign : '', note : '',
  },
  {
    ref : 'RQ', is_title : 0, sign : '-', note : 30,
  },
  {
    ref : 'RS', is_title : 0, sign : '-', note : '',
  },
  {
    ref : 'XI', is_title : 1, sign : '', note : '',
  },
];

const mapTable = {};

profitLossTable.forEach(item => {
  mapTable[item.ref] = item.sign;
});

/**
 * @description this function helps to get html document of the report in server side
 * so that we can use it with others modules on the server side
 * @param {*} options the report options
 * @param {*} session the session
 */
async function reporting(options, session) {
  const params = { ...DEFAULT_PARAMS, ...options };
  const context = {};

  const report = new ReportManager(TEMPLATE, session, params);

  const fiscalYear = await getFiscalYearDetails(params.fiscal_id);
  Object.assign(context, { fiscalYear });

  const currentData = await AccountReference.computeAllAccountReference(fiscalYear.current.period_id);
  const previousData = fiscalYear.previous.period_id
    ? await AccountReference.computeAllAccountReference(fiscalYear.previous.period_id) : [];

  const currentReferences = formatReferences(_.groupBy(currentData, 'abbr'));
  const previousReferences = formatReferences(_.groupBy(previousData, 'abbr'));

  const totals = {
    currentNet : 0,
    previousNet : 0,
  };

  const assetTable = profitLossTable.map(item => {
    item.label = 'REPORT.OHADA.REF_DESCRIPTION.'.concat(item.ref);
    const current = currentReferences[item.ref];
    const previous = previousReferences[item.ref];

    if (current) {
      item.currentBrut = current.brut.balance;
      item.currentAmo = current.amortissement.balance;
      item.currentNet = current.net.balance;
      item.previousNet = previous ? previous.net.balance : 0;

      totals.currentNet += item.currentNet;
      totals.previousNet += item.previousNet;

      setSign(item);
    }

    // process manually totals
    let list = [];
    if (item.ref === 'XA') {
      list = ['TA', 'RA', 'RB'];
      _.extend(item, aggregateReferences(list, currentReferences, previousReferences, mapTable));
    }

    if (item.ref === 'XB') {
      list = ['TA', 'TB', 'TC', 'TD'];
      _.extend(item, aggregateReferences(list, currentReferences, previousReferences, mapTable));
    }

    if (item.ref === 'XC') {
      list = [
        'TA', 'TB', 'TC', 'TD', 'RA', 'RB',
        'TE', 'TF', 'TG', 'TH', 'TI', 'RC', 'RD', 'RE', 'RF', 'RG', 'RH', 'RI', 'RJ',
      ];
      _.extend(item, aggregateReferences(list, currentReferences, previousReferences, mapTable));
    }

    if (item.ref === 'XD') {
      list = [
        'TA', 'TB', 'TC', 'TD', 'RA', 'RB',
        'TE', 'TF', 'TG', 'TH', 'TI', 'RC', 'RD', 'RE', 'RF', 'RG', 'RH', 'RI', 'RJ',
        'RK'];
      _.extend(item, aggregateReferences(list, currentReferences, previousReferences, mapTable));
    }

    if (item.ref === 'XE') {
      list = [
        'TA', 'TB', 'TC', 'TD', 'RA', 'RB',
        'TE', 'TF', 'TG', 'TH', 'TI', 'RC', 'RD', 'RE', 'RF', 'RG', 'RH', 'RI', 'RJ',
        'RK',
        'TJ', 'RL'];
      _.extend(item, aggregateReferences(list, currentReferences, previousReferences, mapTable));
    }

    if (item.ref === 'XF') {
      list = ['TK', 'TL', 'TM', 'RM', 'RN'];
      _.extend(item, aggregateReferences(list, currentReferences, previousReferences, mapTable));
    }

    if (item.ref === 'XG') {
      list = [
        'TA', 'TB', 'TC', 'TD', 'RA', 'RB',
        'TE', 'TF', 'TG', 'TH', 'TI', 'RC', 'RD', 'RE', 'RF', 'RG', 'RH', 'RI', 'RJ',
        'RK',
        'TJ', 'RL',
        'TK', 'TL', 'TM', 'RM', 'RN',
      ];
      _.extend(item, aggregateReferences(list, currentReferences, previousReferences, mapTable));
    }

    if (item.ref === 'XH') {
      list = ['TN', 'TO', 'RO'];
      _.extend(item, aggregateReferences(list, currentReferences, previousReferences, mapTable));
    }

    if (item.ref === 'XI') {
      list = [
        'TA', 'TB', 'TC', 'TD', 'RA', 'RB',
        'TE', 'TF', 'TG', 'TH', 'TI', 'RC', 'RD', 'RE', 'RF', 'RG', 'RH', 'RI', 'RJ',
        'RK',
        'TJ', 'RL',
        'TK', 'TL', 'TM', 'RM', 'RN',
        'TN', 'TO', 'RO',
        'RQ', 'RS'];

      _.extend(item, aggregateReferences(list, currentReferences, previousReferences, mapTable));
    }

    return item;
  });

  Object.assign(context, { assetTable }, { totals });

  return report.render(context);

}

/**
 * @function document
 * @description process and render the balance report document
 */
async function document(req, res) {
  const result = await reporting(req.query, req.session);
  res.set(result.headers).send(result.report);
}

function setSign(item) {
  if (item.sign === '+') {
    item.currentNet = (item.currentNet || 0) * -1;
    item.previousNet = (item.previousNet || 0) * -1;
  } else if (item.sign === '-') {
    item.currentNet = Math.abs(item.currentNet);
    item.previousNet = Math.abs(item.previousNet);
  }
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

async function getFiscalYearDetails(fiscalYearId) {
  const bundle = {};
  try {
    // get fiscal year details and the last period id of the fiscal year
    const query = `
    SELECT
      p.id AS period_id, fy.end_date,
      fy.id, fy.label, fy.previous_fiscal_year_id
    FROM fiscal_year fy
    JOIN period p ON p.fiscal_year_id = fy.id
      AND p.number = (
        SELECT MAX(period.number)
        FROM period
        WHERE period.fiscal_year_id = ? AND period.number < 13)
    WHERE fy.id = ?;
  `;
    bundle.current = await db.one(query, [fiscalYearId, fiscalYearId]);
    const detailsParams = [bundle.current.previous_fiscal_year_id, bundle.current.previous_fiscal_year_id];
    bundle.previous = bundle.current.previous_fiscal_year_id ? await db.one(query, detailsParams) : {};
    return bundle;
  } catch (error) {
    throw error;
  }
}

function aggregateReferences(references, currentDb, previousDb, mapRef) {
  const item = {
    currentBrut : 0, currentAmo : 0, currentNet : 0, previousNet : 0,
  };

  references.forEach(ref => {
    item.currentBrut += currentDb[ref] ? currentDb[ref].brut.balance : 0;
    item.currentAmo += currentDb[ref] ? currentDb[ref].amortissement.balance : 0;

    const signElement = mapRef[ref];
    const dataExists = (currentDb[ref] && previousDb[ref]);
    let curr = 0;
    let prev = 0;

    if (signElement === '+' && dataExists) {
      curr = -1 * (currentDb[ref].net.balance || 0);
      prev = -1 * (previousDb[ref].net.balance || 0);
    } else if (signElement === '-' && dataExists) {
      curr = Math.abs(currentDb[ref].net.balance || 0);
      prev = Math.abs(previousDb[ref].net.balance || 0);
    } else if (signElement === '-/+' && dataExists) {
      curr = currentDb[ref].net.balance || 0;
      prev = previousDb[ref].net.balance || 0;
    }

    if (signElement === '+') {
      item.currentNet += curr;
      item.previousNet += prev;
    } else if (signElement === '-' || signElement === '-/+') {
      item.currentNet -= curr;
      item.previousNet -= prev;
    }
  });

  return item;
}
