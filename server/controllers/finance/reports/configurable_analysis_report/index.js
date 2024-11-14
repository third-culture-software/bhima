const _ = require('lodash');
const db = require('../../../../lib/db');
const ReportManager = require('../../../../lib/ReportManager');
const NotFound = require('../../../../lib/errors/NotFound');

const TEMPLATE = './server/controllers/finance/reports/configurable_analysis_report/report.handlebars';
const cashboxes = require('../../cashboxes');
const AccountExtras = require('../../accounts/extra');

// expose to the API
exports.report = report;

// default report parameters
const DEFAULT_PARAMS = {
  csvKey : 'configurable_analysis_report',
  filename : 'REPORT.CONFIGURABLE_ANALYSIS_REPORT.TITLE',
};

/**
 * @function report
 *
 * @description
 *
 */
function report(req, res, next) {
  const params = req.query;
  const data = {};
  let reporting;

  data.period = {
    start_date : new Date(params.start_date),
    end_date : new Date(params.end_date),
    period_start_label : params.start_label,
    period_end_label : params.end_label,
    start_year : params.start_year,
    end_year : params.end_year,
    fiscal_year_id : params.fiscalYearId,
  };

  params.includeUnpostedValues = parseInt(params.includeUnpostedValues, 10);

  // convert cashboxesIds parameters in array format ['', '', ...]
  // this parameter can be sent as a string or an array we force the conversion into an array
  const cashboxesIds = _.values(req.query.cashboxesIds);

  data.options = {
    display_account_details : parseInt(params.hide_account_details, 10),
    display_details_types : parseInt(params.hide_details_types, 10),
  };

  params.start_date = new Date(params.start_date);
  data.currencyId = params.currency_id;

  _.defaults(params, DEFAULT_PARAMS);

  try {
    reporting = new ReportManager(TEMPLATE, req.session, params);
  } catch (e) {
    next(e);
    return;
  }

  cashboxes.getCashboxesDetails(cashboxesIds)
    .then(rows => {
      const getOpening = [];
      data.cashboxes = rows;
      data.cashboxes.forEach(cash => {
        getOpening.push(AccountExtras.getOpeningBalanceForDate(cash.account_id, data.period.end_date));
      });

      return Promise.all(getOpening);
    })
    .then(cashBoxOpeningBalances => {
      data.cashboxesAggregate = {
        debit : 0,
        credit : 0,
        balance : 0,
      };

      data.cashboxes.forEach(cash => {
        cash.debit = 0;
        cash.credit = 0;
        cash.balance = 0;

        cashBoxOpeningBalances.forEach(opening => {
          if (cash.account_id === opening.accountId) {
            cash.debit = opening.debit;
            cash.credit = opening.credit;
            cash.balance = opening.balance;
          }
        });
      });

      data.cashboxes.forEach(cash => {
        data.cashboxesAggregate.debit += parseFloat(cash.debit);
        data.cashboxesAggregate.credit += parseFloat(cash.credit);
        data.cashboxesAggregate.balance += parseFloat(cash.balance);
      });

      const sqlType = `
        SELECT tt.id, tt.label, tt.is_balance_sheet, tt.rank,
        NOT(tt.is_balance_sheet) is_income_expense
        FROM analysis_tool_type tt
        ORDER BY tt.rank ASC
      `;

      const sqlConfig = `
        SELECT id, account_reference_id, label,
        analysis_tool_type_id
        FROM configuration_analysis_tools
        ORDER BY label ASC
      `;

      const sqlReferences = `
        SELECT at.id, at.account_reference_id,
        a.number, a.label, ari.is_exception,
        at.analysis_tool_type_id
        FROM configuration_analysis_tools AS at
        JOIN account_reference AS ar ON ar.id = at.account_reference_id
        JOIN account_reference_item AS ari ON ari.account_reference_id = ar.id
        JOIN account AS a ON a.id = ari.account_id
        ORDER BY a.label ASC
      `;

      const promises = [
        db.exec(sqlType),
        db.exec(sqlConfig),
        db.exec(sqlReferences)];

      return Promise.all(promises);
    })
    .then(([type, config, dataConfig]) => {
      data.type = type;
      data.config = config;
      data.dataConfig = dataConfig;
      data.provisionary = params.includeUnpostedValues;

      const checkConfiguration = (data.type.length && data.config.length && data.dataConfig.length);

      if (!checkConfiguration) {
        throw new NotFound(`The necessary configurations are missing`);
      }

      const dbPromises = [];
      const accountsNumber = dataConfig.map(row => row.number);

      accountsNumber.forEach(item => {
        const sqlGetAccounts = `
          SELECT a.id, a.number
          FROM account AS a
          WHERE a.number LIKE '${item}%' AND a.type_id <> 6;
        `;
        dbPromises.push(db.exec(sqlGetAccounts));
      });

      return Promise.all(dbPromises);
    })
    .then(accountsFound => {
      const accountReferences = [];
      accountsFound.forEach(account => {
        account.forEach(item => {
          accountReferences.push(item.id);
        });
      });

      const paramsGeneralLedger = [
        data.period.start_date,
        data.period.end_date,
        data.period.start_date,
        data.period.start_date,
        data.period.start_date,
      ];

      const paramsCombinedLedger = [
        data.period.start_date,
        data.period.end_date,
        accountReferences,
        data.period.start_date,
        data.period.start_date,
        data.period.start_date,
        data.period.start_date,
        data.period.end_date,
        accountReferences,
        data.period.start_date,
        data.period.start_date,
        data.period.start_date,
      ];

      const paramFilterOpening = [
        data.period.start_date,
        data.period.fiscal_year_id,
        accountReferences,
      ];

      const sqlOpeningBalanceSheet = `
        SELECT (a.id) AS account_id, a.number, p.translate_key, a.label, SUM(pt.debit) AS debit,
        SUM(pt.credit) AS credit, SUM(pt.debit - pt.credit) AS balance
        FROM period_total AS pt
        JOIN period AS p ON p.id = pt.period_id
        JOIN account AS a ON a.id = pt.account_id
        WHERE (DATE(p.end_date) < DATE(?) OR p.number = 0) AND pt.fiscal_year_id = ?
        AND a.type_id <= 3 AND a.id IN (?)
        GROUP BY a.number;
      `;

      const sqlGeneralLedger = `
        SELECT a.number, a.label, gl.account_id, SUM(gl.debit_equiv) AS debit, SUM(gl.credit_equiv) AS credit,
        SUM(gl.debit_equiv - gl.credit_equiv) AS balance,
        gl.record_uuid, gl.trans_date
        FROM general_ledger AS gl
        JOIN account AS a ON a.id = gl.account_id
        WHERE DATE(gl.trans_date) >= DATE(?) AND DATE(gl.trans_date) <= DATE(?)
        AND gl.transaction_type_id <> 10
        AND gl.record_uuid NOT IN (
          SELECT rev.uuid
          FROM (
              SELECT v.uuid FROM voucher v WHERE v.reversed = 1
              AND DATE(v.date) >= DATE(?)
            UNION
              SELECT c.uuid FROM cash c WHERE c.reversed = 1
              AND DATE(c.date) >= DATE(?)
            UNION
              SELECT i.uuid FROM invoice i WHERE i.reversed = 1
              AND DATE(i.date) >= DATE(?)
          ) AS rev
        )
        GROUP BY gl.account_id
        ORDER BY a.number ASC, a.label
      `;

      const sqlCombinedLedger = `
        SELECT a.number, a.label, cl.account_id, SUM(cl.debit) AS debit, SUM(cl.credit) AS credit,
        SUM(cl.debit - cl.credit) AS balance, cl.record_uuid, cl.trans_date
        FROM
        (
          SELECT gl.account_id, gl.debit_equiv AS debit, gl.credit_equiv AS credit, gl.record_uuid, gl.trans_date
          FROM general_ledger AS gl
          WHERE DATE(gl.trans_date) >= DATE(?) AND DATE(gl.trans_date) <= DATE(?)
          AND gl.account_id iN (?)
          AND gl.transaction_type_id <> 10
          AND gl.record_uuid NOT IN (
              SELECT rev.uuid
              FROM (
                  SELECT v.uuid FROM voucher v WHERE v.reversed = 1
                  AND DATE(v.date) >= DATE(?)
                UNION
                  SELECT c.uuid FROM cash c WHERE c.reversed = 1
                  AND DATE(c.date) >= DATE(?)
                UNION
                  SELECT i.uuid FROM invoice i WHERE i.reversed = 1
                  AND DATE(i.date) >= DATE(?)
              ) AS rev
            )
            UNION
            SELECT ps.account_id, ps.debit_equiv AS debit, ps.credit_equiv AS credit, ps.record_uuid, ps.trans_date
            FROM posting_journal AS ps
            WHERE DATE(ps.trans_date) >= DATE(?) AND DATE(ps.trans_date) <= DATE(?)
            AND ps.account_id iN (?)
            AND ps.transaction_type_id <> 10
            AND ps.record_uuid NOT IN (
                SELECT rev.uuid
                FROM (
                    SELECT v.uuid FROM voucher v WHERE v.reversed = 1
                    AND DATE(v.date) >= DATE(?)
                  UNION
                    SELECT c.uuid FROM cash c WHERE c.reversed = 1
                    AND DATE(c.date) >= DATE(?)
                  UNION
                    SELECT i.uuid FROM invoice i WHERE i.reversed = 1
                    AND DATE(i.date) >= DATE(?)
                ) AS rev
              )
        ) AS cl
        JOIN account AS a ON a.id = cl.account_id
          GROUP BY cl.account_id
          ORDER BY a.number ASC, a.label
      `;

      const sqlBalanceAccounts = params.includeUnpostedValues ? sqlCombinedLedger : sqlGeneralLedger;
      const paramFilter = params.includeUnpostedValues ? paramsCombinedLedger : paramsGeneralLedger;

      const gettingBalanceAccount = [
        db.exec(sqlBalanceAccounts, paramFilter),
        db.exec(sqlOpeningBalanceSheet, paramFilterOpening)];

      return Promise.all(gettingBalanceAccount);
    })
    .then(([balance, openingBalance]) => {

      data.config.forEach(config => {
        config.displayLabel = 'FORM.LABELS.BALANCE';

        config.balance = [];
        config.sumDebit = 0;
        config.sumCredit = 0;
        config.sumBalance = 0;
        config.sumOpenBalance = 0;
        config.sumFinalBalance = 0;

        balance.forEach(item => {
          item.openingDebit = 0;
          item.openingCredit = 0;
          item.openingBalance = 0;
          openingBalance.forEach(opening => {
            if (item.account_id === opening.account_id) {
              item.openingDebit = opening.debit;
              item.openingCredit = opening.credit;
              item.openingBalance = opening.balance;
            }
          });
        });

        balance.forEach(item => {
          const accountNumber = item.number.toString();
          let checkIncluded = true;
          let checkValidy = false;

          data.dataConfig.forEach(dataConfig => {
            const checkAccountStartsWith = accountNumber.startsWith(dataConfig.number);
            if (config.id === dataConfig.id && dataConfig.is_exception && checkAccountStartsWith) {
              checkIncluded = false;
            }

            if (config.id === dataConfig.id && !dataConfig.is_exception && checkAccountStartsWith) {
              checkValidy = true;
            }
          });

          if (checkIncluded && checkValidy) {
            if (item.openingBalance) {
              item.openingBalanceDebCred = item.openingBalance;
              item.finalBalanceDebCred = item.openingBalanceDebCred + item.balance;

              config.sumOpenBalance += item.openingBalanceDebCred;
              config.sumFinalBalance += item.finalBalanceDebCred;
            } else {
              item.finalBalanceDebCred = item.balance;
              config.sumFinalBalance += item.balance;
            }

            config.sumDebit += item.debit;
            config.sumCredit += item.credit;
            config.sumBalance += item.balance;

            config.balance.push(item);
          }
        });
      });

      data.type.forEach(type => {
        type.totalDebit = 0;
        type.totalCredit = 0;
        type.totalBalance = 0;
        type.totalOpenBalance = 0;
        type.totalFinalBalance = 0;

        type.report = [];
        data.config.forEach(config => {
          if (type.id === config.analysis_tool_type_id) {
            type.totalDebit += config.sumDebit;
            type.totalCredit += config.sumCredit;
            type.totalBalance += config.sumBalance;
            type.totalOpenBalance += config.sumOpenBalance;
            type.totalFinalBalance += config.sumFinalBalance;
            type.report.push(config);
          }
        });
      });

      return reporting.render(data);
    })
    .then(result => {
      res.set(result.headers).send(result.report);
    })
    .catch(next);

}
