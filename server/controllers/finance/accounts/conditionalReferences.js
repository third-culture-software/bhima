/**
  * @description
  * This request allows to look for certain accounts which will be
  * considered only if they have a balance Debiteur or Crediteur
*/

const db = require('../../../lib/db');
const references = require('./references.compute');

function compute(periodId) {
  const glb = {};
  const transaction = db.transaction();

  const queryFiscalYear = `
    SELECT fy.id, p.number AS period_number FROM fiscal_year fy
    JOIN period p ON p.fiscal_year_id = fy.id
    WHERE p.id = ?
  `;

  return db.one(queryFiscalYear, [periodId])
    .then(fiscalYear => {
      glb.fiscalYear = fiscalYear;

      const getDebCredRefAccounts = `
        SELECT rf.abbr, ar.account_reference_id, ar.credit_balance, ar.debit_balance, ar.account_id, a.number
        FROM account_reference_item AS ar
        JOIN account_reference AS rf ON rf.id = ar.account_reference_id
        JOIN account AS a ON a.id = ar.account_id
        WHERE ar.credit_balance = 1 OR ar.debit_balance = 1;
      `;

      return db.exec(getDebCredRefAccounts);
    })
    .then(accountReferences => {
      glb.accountReferences = accountReferences;

      const dbPromises = accountReferences.map(ar => {
        return references.getAccountsForReference(
          ar.abbr,
          ar.is_amo_dep,
        );
      });
      return Promise.all(dbPromises);
    })
    .then(accountReferences => {

      glb.accountReferences.forEach((ref, index) => {

        const accountIds = accountReferences[index].map(a => a.account_id);

        const getBalance = `
          SELECT '${ref.abbr}' AS abbr, '${ref.credit_balance}' AS credit_balance,
          '${ref.debit_balance}' AS debit_balance , pt.fiscal_year_id, pt.account_id, SUM(pt.credit) AS credit,
          SUM(pt.debit) AS debit, SUM(pt.debit - pt.credit) AS balance
          FROM period_total AS pt
          JOIN account AS a ON a.id = pt.account_id
          JOIN period p ON p.id = pt.period_id
          WHERE pt.fiscal_year_id = ? AND a.number LIKE '?%' AND p.number BETWEEN 0 AND ? AND a.id IN (?);`;

        const parameters = [
          glb.fiscalYear.id,
          ref.number,
          glb.fiscalYear.period_number,
          accountIds.length ? accountIds : null,
        ];

        transaction
          .addQuery(getBalance, parameters);
      });

      return transaction.execute();
    });
}

exports.compute = compute;
