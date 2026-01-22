/**
* Distribution Cost Center Configuration
*
* The configuration function first looks for accounts belonging to account references belonging to auxiliary
* cost centers, then finds all existing transactions in the ledger
* related to the accounts found at the end of the distributed
*/
const referenceAccount = require('./referenceAccount');
const generalLedger = require('../generalLedger');
const fiscal = require('../fiscal');

async function configuration(req, res) {
  const { query } = req;
  const params = {
    typeCostCenter : query.typeCostCenter,
    cost_center_id : query.cost_center_id,
  };

  const accounts = await referenceAccount.auxilliary(params);

  const refAccounts = accounts;
  const accountsId = accounts.map(account => account.account_id);

  if (accountsId.length === 0) {
    res.status(200).json([]);
    return;
  }

  const options = {
    accounts_id : accountsId,
    excludes_distributed : true,
    account_id : query.account_id,
    trans_id : query.trans_id,
    hrRecord : query.hrRecord,
    limit : 100,
  };

  // get max and min date from period ids.
  if (query.periodFrom && query.periodTo) {
    const periods = {
      periodFrom : query.periodFrom,
      periodTo : query.periodTo,
    };

    const result = await fiscal.getDateRangeFromPeriods(periods);
    options.custom_period_start = result.dateFrom;
    options.custom_period_end = result.dateTo;
  }

  if (query.cost_center_id || query.trans_id) {
    delete options.limit;
  }

  const rows = await generalLedger.findTransactions(options);

  rows.forEach(item => {
    refAccounts.forEach(ref => {
      if (ref.account_id === item.account_id) {
        item.cost_center_id = ref.id;
        item.cost_center_label = ref.label;
        item.is_variable = ref.is_variable;
        item.is_turnover = ref.is_turnover;
        item.is_cost = ref.is_cost;
      }
    });

    item.amount = item.credit ? item.credit : item.debit;
    item.amount_equiv = item.credit_equiv ? item.credit_equiv : item.debit_equiv;
  });

  res.status(200).json(rows);

}

exports.configuration = configuration;
