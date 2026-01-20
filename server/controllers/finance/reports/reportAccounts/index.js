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
async function document(req, res) {
  const bundle = {};

  const params = req.query;
  params.user = req.session.user;
  params.enterprise_id = req.session.enterprise.id;
  params.isEnterpriseCurrency = req.session.enterprise.currency_id === Number(params.currency_id);
  params.includeUnpostedValues = params.includeUnpostedValues ? Number(params.includeUnpostedValues) : 0;
  params.filename = 'REPORT.ACCOUNT';

  const report = new ReportManager(TEMPLATE, req.session, params);

  params.dateFrom = (params.dateFrom) ? new Date(params.dateFrom) : new Date();

  // first, we look up the currency to have all the parameters we need
  const currency = await Currency.lookupCurrencyById(params.currency_id);
  Object.assign(bundle, { currency });

  // get the exchange rate for the opening balance
  const rate = await Exchange.getExchangeRate(params.enterprise_id, params.currency_id, params.dateFrom);
  bundle.rate = rate.rate || 1;
  bundle.invertedRate = Exchange.formatExchangeRateForDisplay(bundle.rate);
  const balance = await AccountsExtra.getOpeningBalanceForDate(params.account_id, params.dateFrom, false);
  const { invertedRate } = bundle;

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

  Object.assign(bundle, { header });
  const tranxs = await AccountTransactions.getAccountTransactions(params, bundle.header.exchangedBalance);
  Object.assign(bundle, tranxs, { params });
  const fiscal = await Fiscal.getNumberOfFiscalYears(params.dateFrom, params.dateTo);
  // check to see if this statement spans multiple fiscal years AND concerns
  // an income/ expense account
  // @TODO these constants should be system shared variables
  const incomeAccountId = 4;
  const expenseAccountId = 5;

  const warnMultipleFiscalYears = fiscal.fiscalYearSpan > 1;

  const incomeExpenseAccount = (bundle.account.type_id === incomeAccountId)
      || (bundle.account.type_id === expenseAccountId);

  if (warnMultipleFiscalYears && incomeExpenseAccount) {
    Object.assign(bundle, {
      warnMultipleFiscalYears,
    });
  }
  Object.assign(bundle, {
    dateFrom     : params.dateFrom,
    dateTo       : params.dateTo,
    provisionary : params.includeUnpostedValues,
  });

  const result = await report.render(bundle);
  res.set(result.headers).send(result.report);
}

exports.document = document;
