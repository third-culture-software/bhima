/**
 * @overview ./finance/reports/client_debts/
*/

const _ = require('lodash');

const ReportManager = require('../../../../lib/ReportManager');
const db = require('../../../../lib/db');

module.exports.report = report;

// path to the template to render
const TEMPLATE = './server/controllers/finance/reports/client_debts/report.handlebars';

const SUPPORT_TRANSACTION_TYPE = 4;

/**
 * @method report
 *
 * @description
 * The HTTP interface which actually creates the report.
 */
async function report(req, res, next) {
  try {
    const qs = structuredClone(req.query);
    _.extend(qs, { filename : 'REPORT.CLIENT_SUMMARY.TITLE' });

    const groupUuid = db.bid(req.query.group_uuid);
    const showDetails = parseInt(req.query.shouldShowDebtsDetails, 10);
    const metadata = structuredClone(req.session);

    const rpt = new ReportManager(TEMPLATE, metadata, qs);

    const entitiesSQL = `
      SELECT BUID(debtor.uuid) as uuid, em.text AS reference,
        (SELECT patient.display_name FROM patient WHERE patient.debtor_uuid = debtor.uuid) AS display_name,
        (SELECT e.creditor_uuid FROM employee e
          JOIN patient p ON e.patient_uuid = p.uuid
          WHERE p.debtor_uuid = debtor.uuid
        ) AS is_employee
        FROM debtor JOIN entity_map em
        ON debtor.uuid = em.uuid
      WHERE debtor.group_uuid = ?
      ORDER BY display_name, em.text;
    `;
    const clientQuery = `
      SELECT BUID(uuid) AS uuid, name, account_id, account.number, account.label
      FROM debtor_group JOIN account ON debtor_group.account_id = account.id WHERE uuid = ?;
    `;

    const sql = `
      SELECT BUID(entity_uuid) AS uuid, IFNULL(SUM(ledger.debit_equiv), 0) AS debit,
        IFNULL(SUM(ledger.credit_equiv), 0) AS credit,
        IFNULL(SUM(ledger.debit_equiv) - SUM(ledger.credit_equiv), 0) AS balance
      FROM (
        SELECT entity_uuid, debit_equiv, credit_equiv FROM posting_journal
        WHERE entity_uuid IN (SELECT uuid FROM debtor WHERE group_uuid = ?)
       UNION ALL
        SELECT entity_uuid, debit_equiv, credit_equiv FROM general_ledger
        WHERE entity_uuid IN (SELECT uuid FROM debtor WHERE group_uuid = ?)
      ) AS ledger
      GROUP BY ledger.entity_uuid
      HAVING balance <> 0;
    `;

    const [client, entities, balances] = await Promise.all([
      await db.one(clientQuery, [groupUuid]),
      await db.exec(entitiesSQL, [groupUuid]),
      await db.exec(sql, [groupUuid, groupUuid]),
    ]);

    const employees = [];
    const patients = [];
    let patientDebts = 0;
    let employeeDebts = 0;

    // weave the entities together so that the balances are assigned properly
    entities.forEach(entity => {
      balances.forEach(record => {
        if (entity.uuid === record.uuid) {
          Object.assign(entity, record);
        }
      });

      // If there is no corresponding balance, exclude the debtor - they have
      // a balanced account.  If we ever want to show _all_ debtors, even those
      // with zero balances, this is the line to skip.
      if (!entity.balance) { return; }

      // classify debtors as patients or employees
      if (entity.is_employee !== null) {
        employees.push(entity);
        employeeDebts += entity.balance;
      } else {
        patients.push(entity);
        patientDebts += entity.balance;
      }
    });

    // only look up prise en charge if there are employees in this debtor group.
    let supported = [];
    let supportedDebts = 0;
    if (employees.length > 0) {
      supported = await getDebtsSupportedByEmployees(groupUuid);
      supportedDebts = supported.reduce((total, row) => total + row.balance, 0);
    }

    const grandTotal = patientDebts + employeeDebts + supportedDebts;
    const result = await rpt.render({
      client,
      employees,
      employeeDebts,
      patients,
      patientDebts,
      supported,
      supportedDebts,
      grandTotal,
      showDetails,
    });

    res.set(result.headers).send(result.report);
  } catch (e) {
    next(e);
  }
}

/**
 * @function getDebtsSupportedByEmployees
 *
 * @description
 * This function looks up the debts supported by the employees in the general ledger and the posting journal.
 * When a patient's debt is taken on by an employee, a transaction is passed crediting the patients debtor account
 * and debiting an account of the accountant's choosing.  The employee's creditor_uuid is put in the entity_uuid
 * column of the debiting writing.   Therefore, this query looks up all debts taken on by employees and groups them
 * by employee.
 */
function getDebtsSupportedByEmployees(groupUuid) {
  const sql = `
    SELECT BUID(entity_uuid) AS uuid, em.text AS reference, p.display_name,
      IFNULL(SUM(ledger.debit), 0) AS debit, IFNULL(SUM(ledger.credit), 0) AS credit,
      IFNULL(SUM(ledger.debit) - SUM(ledger.credit), 0) AS balance
    FROM (
      SELECT entity_uuid, SUM(debit_equiv) debit, SUM(credit_equiv) credit FROM posting_journal
      WHERE entity_uuid IN (
        SELECT creditor_uuid FROM employee
          JOIN patient ON employee.patient_uuid = patient.uuid
          JOIN debtor ON patient.debtor_uuid = debtor.uuid
        WHERE debtor.group_uuid = ?
      ) AND transaction_type_id = ${SUPPORT_TRANSACTION_TYPE}
      GROUP BY entity_uuid
     UNION ALL
      SELECT entity_uuid, SUM(debit_equiv) debit, SUM(credit_equiv) credit FROM general_ledger
      WHERE entity_uuid IN (
        SELECT creditor_uuid FROM employee
          JOIN patient ON employee.patient_uuid = patient.uuid
          JOIN debtor ON patient.debtor_uuid = debtor.uuid
        WHERE debtor.group_uuid = ?
      ) AND transaction_type_id = ${SUPPORT_TRANSACTION_TYPE}
      GROUP BY entity_uuid
    ) AS ledger
    JOIN entity_map em ON ledger.entity_uuid = em.uuid
    JOIN employee e ON ledger.entity_uuid = e.creditor_uuid
    JOIN patient p ON e.patient_uuid = p.uuid
    GROUP BY ledger.entity_uuid
    HAVING balance <> 0
    ORDER BY p.display_name;
  `;

  return db.exec(sql, [groupUuid, groupUuid]);
}
