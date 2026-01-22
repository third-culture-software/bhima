const _ = require('lodash');
const ReportManager = require('../../../../lib/ReportManager');

const AccountsExtra = require('../../accounts/extra');
const AccountsUtil = require('../../accounts/utility');
const Exchange = require('../../exchange');
const Currency = require('../../currencies');

const TEMPLATE = './server/controllers/finance/reports/reportAccountsMultiple/report.handlebars';

const { getAccountTransactions } = require('../../accounts/transactions');

/**
 * @method document
 *
 * @description
 * Renders the PDF template for the Accounts Statement Report.
 *
 * The report contains the following information:
 *  1. headers with the opening balance line and All general ledger transactions
 *  for each account.  This opening balance line is
 *  converted on the date of the `dateFrom` range.
 *
 */
async function document(req, res) {
  const bundle = {};

  const params = req.query;
  params.user = req.session.user;
  params.enterprise_id = req.session.enterprise.id;
  params.isEnterpriseCurrency = (req.session.enterprise.currency_id === Number(params.currency_id));
  params.filename = 'REPORT.REPORT_ACCOUNTS_MULTIPLE.TITLE';
  params.includeUnpostedValues = params.includeUnpostedValues ? Number(params.includeUnpostedValues) : 0;

  const report = new ReportManager(TEMPLATE, req.session, params);

  params.dateFrom = (params.dateFrom) ? new Date(params.dateFrom) : new Date();

  const accountIds = [].concat(params.accountIds);

  const [currency, rates] = await Promise.all([
    Currency.lookupCurrencyById(params.currency_id),
    Exchange.getExchangeRate(params.enterprise_id, params.currency_id, params.dateFrom),
  ]);

  _.extend(bundle, { currency });

  const rate = rates.rate || 1;
  const invertedRate = Exchange.formatExchangeRateForDisplay(rate);

  const sharedHeader = {
    date            : params.dateFrom,
    rate,
    invertedRate,
  };

  // get all the opening balances for the accounts concerned
  const balances = await Promise.all(
    accountIds
      .map(accountId => AccountsExtra.getOpeningBalanceForDate(accountId, params.dateFrom, false)),
  );

  // get the transactions for each account
  const transactions = await Promise.all(
    balances.map(
      ({ balance, accountId }) => {
        return getAccountTransactions(_.extend({ account_id : accountId }, params, bundle), +balance * rate);
      },
    ),
  );

  // get the account metadata
  const details = await Promise.all(accountIds.map(AccountsUtil.lookupAccount));

  // stores the total of all accounts
  let globalBalance = 0;

  // zip the balances and accounts together
  const accounts = _
    .zip(balances, transactions, details)
    .map(([balance, rows, meta]) => {
      const header = _.extend({}, sharedHeader, {
        balance         : Number(balance.balance),
        credit          : Number(balance.credit),
        debit           : Number(balance.debit),
        exchangedCredit : Number(balance.credit) * rate,
        exchangedDebit  : Number(balance.debit) * rate,
        exchangedBalance : Number(balance.balance) * rate,
        isCreditBalance : Number(balance.balance) < 0,
      });

      // increase the global balance by the exchanged amount
      globalBalance += rows.footer.exchangedCumSum;

      return {
        header,
        meta,
        balance,
        transactions : rows.transactions,
        footer : rows.footer,
      };
    });

  _.extend(bundle, {
    accounts,
    globalBalance,
    dateFrom : params.dateFrom,
    dateTo : params.dateTo,
    provisionary : params.includeUnpostedValues,
  }, { params });

  const result = await report.render(bundle);
  res.set(result.headers).send(result.report);
}

exports.document = document;
