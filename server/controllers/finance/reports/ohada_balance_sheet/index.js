/**
 * Ohada Balance sheet Controller
 *
 * This controller is responsible for processing
 * the ohada balance sheet (bilan) report.
 *
 * @module reports/ohada_balance_sheet
 *
 * @requires lodash
 * @requires lib/ReportManager
 * @requires lib/errors/BadRequest
 */

const _ = require('lodash');
const AccountReference = require('../../accounts/references');
const ReportManager = require('../../../../lib/ReportManager');
const conditionalReferences = require('../../accounts/conditionalReferences');
const balanceSheetElement = require('./balanceSheetElement');

// report template
const TEMPLATE = './server/controllers/finance/reports/ohada_balance_sheet/report.handlebars';

// default report parameters
const DEFAULT_PARAMS = {
  csvKey : 'accounts',
  filename : 'REPORT.OHADA.BALANCE_SHEET',
  orientation : 'landscape',
};

const balanceSheetAssetTable = balanceSheetElement.balanceSheetAssetTable();

const balanceSheetLiabilityTable = balanceSheetElement.balanceSheetLiabilityTable();

// expose to the API
exports.document = document;
exports.reporting = reporting;
exports.aggregateReferences = aggregateReferences;

/**
 * @function reporting
 * @description this function helps to get html document of the report in server side
 * so that we can use it with others modules on the server side
 * @param {object} options the report options
 * @param {object} session the session
 */
function reporting(options, session) {
  const params = options;
  const context = {};

  _.defaults(params, DEFAULT_PARAMS);
  const report = new ReportManager(TEMPLATE, session, params);

  return balanceSheetElement.getFiscalYearDetails(params.fiscal_id)
    .then(fiscalYear => {
      _.merge(context, { fiscalYear });
      const currentPeriodReferences = AccountReference.computeAllAccountReference(fiscalYear.current.period_id);
      const currentConditionalReferences = conditionalReferences.compute(fiscalYear.current.period_id);

      const previousPeriodReferences = fiscalYear.previous.period_id
        ? AccountReference.computeAllAccountReference(fiscalYear.previous.period_id) : [];

      const previousConditionalReferences = fiscalYear.previous.period_id
        ? conditionalReferences.compute(fiscalYear.previous.period_id) : [];

      return Promise.all([
        currentPeriodReferences,
        previousPeriodReferences,
        currentConditionalReferences,
        previousConditionalReferences,
      ]);
    })
    .then(([currentData, previousData, currentConditional, previousConditional]) => {
      if (currentConditional.length) {
        currentConditional.forEach(cond => {
          const conditional = cond[0];
          currentData.forEach(current => {
            if (current.abbr === conditional.abbr) {
              if ((parseInt(conditional.credit_balance, 10) === 1) && (conditional.balance > 0)) {
                current.balance -= conditional.balance;
              }

              if ((parseInt(conditional.debit_balance, 10) === 1) && (conditional.balance < 0)) {
                current.balance -= conditional.balance;
              }
            }
          });
        });
      }

      if (previousConditional.length) {
        previousConditional.forEach(cond => {
          const conditional = cond[0];

          previousData.forEach(previous => {
            if (previous.abbr === conditional.abbr) {
              if ((parseInt(conditional.credit_balance, 10) === 1) && (conditional.balance > 0)) {
                previous.balance -= conditional.balance;
              }

              if ((parseInt(conditional.debit_balance, 10) === 1) && (conditional.balance < 0)) {
                previous.balance -= conditional.balance;
              }
            }
          });
        });
      }

      let list = [];
      const currentReferences = balanceSheetElement.formatReferences(_.groupBy(currentData, 'abbr'));
      const previousReferences = balanceSheetElement.formatReferences(_.groupBy(previousData, 'abbr'));

      const assetTable = balanceSheetAssetTable.map(item => {
        item.label = 'REPORT.OHADA.REF_DESCRIPTION.'.concat(item.ref);
        const current = currentReferences[item.ref];
        const previous = previousReferences[item.ref];
        if (current) {
          item.currentBrut = current.brut.balance;
          item.currentAmo = current.amortissement.balance;
          item.currentNet = current.net.balance;
          item.previousNet = previous ? previous.net.balance : 0;
        }

        // process manually totals
        if (item.ref === 'AA') {
          list = ['AX', 'AY', 'AZ'];
          _.extend(item, aggregateReferences(list, currentReferences, previousReferences));
        }

        if (item.ref === 'AD') {
          list = ['AE', 'AF', 'AG', 'AH'];
          _.extend(item, aggregateReferences(list, currentReferences, previousReferences));
        }

        if (item.ref === 'AI') {
          list = ['AJ', 'AK', 'AL', 'AM', 'AN', 'AP'];
          _.extend(item, aggregateReferences(list, currentReferences, previousReferences));
        }

        if (item.ref === 'AQ') {
          list = ['AR', 'AS'];
          _.extend(item, aggregateReferences(list, currentReferences, previousReferences));
        }

        if (item.ref === 'AZ') {
          list = ['AE', 'AF', 'AG', 'AH', 'AJ', 'AK', 'AL', 'AM', 'AN', 'AP', 'AR', 'AS'];
          _.extend(item, aggregateReferences(list, currentReferences, previousReferences));
        }

        if (item.ref === 'BB') {
          list = ['BC', 'BD', 'BE', 'BF'];
          _.extend(item, aggregateReferences(list, currentReferences, previousReferences));
        }

        if (item.ref === 'BG') {
          list = ['BH', 'BI', 'BJ'];
          _.extend(item, aggregateReferences(list, currentReferences, previousReferences));
        }

        if (item.ref === 'BK') {
          list = ['BA', 'BC', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ'];
          _.extend(item, aggregateReferences(list, currentReferences, previousReferences));
        }

        if (item.ref === 'BT') {
          list = ['BQ', 'BR', 'BS'];
          _.extend(item, aggregateReferences(list, currentReferences, previousReferences));
        }

        if (item.ref === 'BZ') {
          list = ['AE', 'AF', 'AG', 'AH', 'AJ', 'AK', 'AL', 'AM', 'AN', 'AP', 'AR', 'AS']
            .concat(['BA', 'BC', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BQ', 'BR', 'BS']);
          _.extend(item, aggregateReferences(list, currentReferences, previousReferences));
        }
        return item;
      });

      const liabilityTable = balanceSheetLiabilityTable.map(item => {
        item.label = 'REPORT.OHADA.REF_DESCRIPTION.'.concat(item.ref);
        const current = currentReferences[item.ref];
        const previous = previousReferences[item.ref];
        if (current) {
          item.currentBrut = current.brut.balance;
          item.currentAmo = current.amortissement.balance;
          item.currentNet = current.net.balance;
          item.previousNet = previous ? previous.net.balance : 0;
        }

        // process manually totals
        if (item.ref === 'CC') {
          list = ['CD', 'CE', 'CF', 'CG'];
          _.extend(item, aggregateReferences(list, currentReferences, previousReferences));
        }

        if (item.ref === 'CK') {
          list = ['CL', 'CM'];
          _.extend(item, aggregateReferences(list, currentReferences, previousReferences));
        }

        if (item.ref === 'CP') {
          list = ['CA', 'CB', 'CD', 'CE', 'CF', 'CH', 'CI', 'CK', 'CG', 'CL', 'CM'];
          _.extend(item, aggregateReferences(list, currentReferences, previousReferences));
        }

        if (item.ref === 'DF') {
          list = ['DA', 'DB', 'DC', 'DD'];
          _.extend(item, aggregateReferences(list, currentReferences, previousReferences));
        }

        if (item.ref === 'DG') {
          list = ['CA', 'CB', 'CD', 'CE', 'CF', 'CH', 'CI', 'CK', 'CG', 'CL', 'CM', 'DA', 'DB', 'DC', 'DD'];
          _.extend(item, aggregateReferences(list, currentReferences, previousReferences));
        }

        if (item.ref === 'DP') {
          list = ['DH', 'DI', 'DJ', 'DK', 'DM', 'DN'];
          _.extend(item, aggregateReferences(list, currentReferences, previousReferences));
        }

        if (item.ref === 'DT') {
          list = ['DQ', 'DR', 'DS'];
          _.extend(item, aggregateReferences(list, currentReferences, previousReferences));
        }

        if (item.ref === 'DZ') {
          list = ['CA', 'CB', 'CD', 'CE', 'CF', 'CH', 'CI', 'CK', 'CG', 'CL', 'CM', 'DA', 'DB', 'DC', 'DD']
            .concat(['DH', 'DI', 'DJ', 'DK', 'DM', 'DN'])
            .concat(['DQ', 'DR', 'DS']);
          _.extend(item, aggregateReferences(list, currentReferences, previousReferences));
        }
        return item;
      });
      /**
       * displays depreciation in positive values
       */
      assetTable.forEach(item => {
        if (item.currentAmo) {
          item.currentAmo *= -1;
        }
      });

      /**
       * liabilities have by default a creditor balance (negative value),
       * in order to present them correctly to users they must be converted into positive
       * values, so for doing that we will multiply them by -1
       */
      liabilityTable.forEach(item => {
        if (item.currentNet) {
          item.currentNet *= -1;
        }
        if (item.previousNet) {
          item.previousNet *= -1;
        }
      });

      _.merge(context, { assetTable, liabilityTable });
      return report.render(context);
    });
}

/**
 * @function document
 * @description process and render the balance report document
 */
function document(req, res, next) {
  reporting(req.query, req.session)
    .then(result => {
      res.set(result.header).send(result.report);
    })
    .catch(next);
}

function aggregateReferences(references, currentDb, previousDb) {
  const item = {
    currentBrut : 0, currentAmo : 0, currentNet : 0, previousNet : 0,
  };

  references.forEach(ref => {
    item.currentBrut += currentDb[ref] ? currentDb[ref].brut.balance : 0;
    item.currentAmo += currentDb[ref] ? currentDb[ref].amortissement.balance : 0;
    item.currentNet += currentDb[ref] ? currentDb[ref].net.balance : 0;
    item.previousNet += previousDb[ref] ? previousDb[ref].net.balance : 0;
  });

  return item;
}
