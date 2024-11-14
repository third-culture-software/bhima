const _ = require('lodash');
const ReportManager = require('../../../../lib/ReportManager');

const AccountsExtra = require('../../accounts/extra');
const AccountTransactions = require('../../accounts/transactions');
const Exchange = require('../../exchange');
const Currency = require('../../currencies');
const Fiscal = require('../../fiscal');

const TEMPLATE = './server/controllers/finance/reports/reportAccounts/report.handlebars';

/**
 * @method document
 *
 * @description
 * Renders the PDF template for the Account Statement Report.
 *
 * The report contains the following information:
 *  1. A header with the opening balance line.  This opening balance line is
 *  converted on the date of the `dateFrom` range.
 *  2. All general ledger transactions that
 */
function document(req, res, next) {
  let report;
  const bundle = {};

  const params = req.query;
  params.user = req.session.user;
  params.enterprise_id = req.session.enterprise.id;
  params.isEnterpriseCurrency = req.session.enterprise.currency_id === Number(params.currency_id);
  params.includeUnpostedValues = params.includeUnpostedValues ? Number(params.includeUnpostedValues) : 0;
  params.filename = 'REPORT.ACCOUNT';

  try {
    report = new ReportManager(TEMPLATE, req.session, params);
  } catch (e) {
    return next(e);
  }

  params.dateFrom = (params.dateFrom) ? new Date(params.dateFrom) : new Date();

  // first, we look up the currency to have all the parameters we need
  return Currency.lookupCurrencyById(params.currency_id)
    .then(currency => {
      _.extend(bundle, { currency });

      // get the exchange rate for the opening balance
      return Exchange.getExchangeRate(params.enterprise_id, params.currency_id, params.dateFrom);
    })
    .then(rate => {
      bundle.rate = rate.rate || 1;
      bundle.invertedRate = Exchange.formatExchangeRateForDisplay(bundle.rate);
      return AccountsExtra.getOpeningBalanceForDate(params.account_id, params.dateFrom, false);
    })
    .then(balance => {
      const { rate, invertedRate } = bundle;

      const header = {
        date            : params.dateFrom,

        balance         : Number(balance.balance),
        credit          : Number(balance.credit),
        debit           : Number(balance.debit),
        exchangedCredit : Number(balance.credit) * rate,
        exchangedDebit : Number(balance.debit) * rate,
        exchangedBalance : Number(balance.balance) * rate,
        isCreditBalance : Number(balance.balance) < 0,
        rate,
        invertedRate,
      };

      _.extend(bundle, { header });
      return AccountTransactions.getAccountTransactions(params, bundle.header.exchangedBalance);
    })
    .then(result => {
      _.extend(bundle, result, { params });
      return Fiscal.getNumberOfFiscalYears(params.dateFrom, params.dateTo);
    })
    .then((result) => {
      // check to see if this statement spans multiple fiscal years AND concerns
      // an income/ expense account
      // @TODO these constants should be system shared variables
      const incomeAccountId = 4;
      const expenseAccountId = 5;

      const warnMultipleFiscalYears = result.fiscalYearSpan > 1;

      const incomeExpenseAccount = (bundle.account.type_id === incomeAccountId)
      || (bundle.account.type_id === expenseAccountId);

      if (warnMultipleFiscalYears && incomeExpenseAccount) {
        _.extend(bundle, {
          warnMultipleFiscalYears,
        });
      }
      _.extend(bundle, {
        dateFrom     : params.dateFrom,
        dateTo       : params.dateTo,
        provisionary : params.includeUnpostedValues,
      });

      return report.render(bundle);
    })
    .then((result) => {
      res.set(result.headers).send(result.report);
    })
    .catch(next);

}

exports.document = document;
