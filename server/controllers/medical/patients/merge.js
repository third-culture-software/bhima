/**
 * This controller is responsible of handling merge of patients into
 * one patient.
 *
 * The merge consists to :
 * - get debtor_uuids of the selected patient (patient to keep) and others patients (patients to remove)
 * - replace all occurences of debtor_uuid of patient to remove by the debtor_uuid
 *   of the selected patient (patient to keep) in journal and general ledger
 *   cash, debtor_group_history, invoice, patient, employee, patient_assignment,
 *   patient_document, patient_hospitalization, patient_visit
 * - remove the patient to remove
 * - remove the debtor relate to patient to remove
 */
const debug = require('debug')('bhima:patients:merge');
const express = require('express');
const db = require('../../../lib/db');

// router is mounted at /patients/merge
const router = express.Router();

router.get('/count_employees', async (req, res) => {
  const query = `
    SELECT COUNT(*) AS total_employees
    FROM employee
    WHERE patient_uuid IN (?);
  `;
  const patients = req.query.patients.map(uuid => db.bid(uuid));
  const [data] = await db.exec(query, [patients]);
  res.status(200).json(data);
});

router.get('/duplicates', async (req, res) => {
  const sensitivity = req.query.sensitivity || 2;
  const limit = parseInt(req.query.limit, 10) || 25;
  const duplicateSQL = `
    SELECT COUNT(p.uuid) AS num_patients, p.display_name,
    GROUP_CONCAT(CONCAT(BUID(p.uuid), ':', em.text)) AS others
    FROM patient p LEFT JOIN entity_map em ON p.uuid = em.uuid
    GROUP BY LOWER(p.display_name) HAVING COUNT(p.uuid) > ?
    ORDER BY COUNT(p.uuid) DESC
    LIMIT ?;
  `;

  const patients = await db.exec(duplicateSQL, [sensitivity, limit]);
  res.status(200).json(patients);
});

/**
 * @function mergePatients
 *
 * @description
 * Receives a POST request from the client with "selected" and "other" as the two options
 * and merges all "other" patients into the "selected" patient.
 *
 * POST /patients/merge
 */
router.post('/', async (req, res) => {
  const { selected, other } = req.body;

  debug(`#mergePatients(): merging ${other.length + 1} patients together.`);

  const selectedPatientUuid = db.bid(selected);
  const otherPatientUuids = other.map(uuid => db.bid(uuid));

  const getSelectedDebtorUuid = `SELECT debtor_uuid FROM patient WHERE uuid = ?`;
  const getOtherDebtorUuids = `SELECT debtor_uuid FROM patient WHERE uuid IN (?)`;

  const replaceDebtorInPostingJournal = `
    UPDATE posting_journal SET entity_uuid = ? WHERE entity_uuid IN (?);
  `;
  const replaceDebtorInGeneralLedger = `
    UPDATE general_ledger SET entity_uuid = ? WHERE entity_uuid IN (?);
  `;
  const replaceDebtorInCash = `
    UPDATE cash SET debtor_uuid = ? WHERE debtor_uuid IN (?);
  `;
  const replaceDebtorInDebtorGroupHistory = `
    UPDATE debtor_group_history SET debtor_uuid = ? WHERE debtor_uuid IN (?);
  `;
  const replaceDebtorInInvoice = `
    UPDATE invoice SET debtor_uuid = ? WHERE debtor_uuid IN (?);
  `;
  const replaceDebtorInStockAssign = `
    UPDATE stock_assign SET entity_uuid = ? WHERE entity_uuid IN (?);
  `;
  const replaceDebtorInVoucherItem = `
    UPDATE voucher_item SET entity_uuid = ? WHERE entity_uuid IN (?);
  `;

  const replaceDebtorInPatient = `
    UPDATE patient SET debtor_uuid = ? WHERE debtor_uuid IN (?);
  `;
  const replacePatientInEmployee = `
    UPDATE employee SET patient_uuid = ? WHERE patient_uuid IN (?);
  `;
  const replacePatientInPatientAssignment = `
    UPDATE patient_assignment SET patient_uuid = ? WHERE patient_uuid IN (?);
  `;
  const replacePatientInPatientDocument = `
    UPDATE patient_document SET patient_uuid = ? WHERE patient_uuid IN (?);
  `;
  const replacePatientInPatientHospitalization = `
    UPDATE patient_hospitalization SET patient_uuid = ? WHERE patient_uuid IN (?);
  `;
  const replacePatientInPatientVisit = `
    UPDATE patient_visit SET patient_uuid = ? WHERE patient_uuid IN (?);
  `;
  const replacePatientInMedicalSheet = `
    UPDATE medical_sheet SET patient_uuid = ? WHERE patient_uuid IN (?);
  `;
  const replacePatientInStockMovement = `
    UPDATE stock_movement SET entity_uuid = ? WHERE entity_uuid IN (?);
  `;

  const removeOtherDebtors = `
    DELETE FROM debtor WHERE uuid IN (?);
  `;
  const removeOtherPatients = `
    DELETE FROM patient WHERE uuid IN (?);
  `;
  const removeOtherEntityMap = `
    DELETE FROM entity_map WHERE uuid IN (?);
  `;

  const patient = await db.one(getSelectedDebtorUuid, [selectedPatientUuid]);
  const debtorUuid = patient.debtor_uuid;

  debug(`#mergePatient(): keeping "${patient.display_name}" (${debtorUuid}).`);

  const rows = await db.exec(getOtherDebtorUuids, otherPatientUuids);
  const otherDebtorUuids = rows.map(row => row.debtor_uuid);
  const otherDebtorNames = rows
    .map(row => `${row.display_name} (${row.debtor_uuid})`)
    .join(',');

  debug(`#mergePatient(): removing ${otherDebtorNames}.`);

  const transaction = db.transaction()
    .addQuery(replaceDebtorInCash, [debtorUuid, [otherDebtorUuids]])
    .addQuery(replaceDebtorInDebtorGroupHistory, [debtorUuid, [otherDebtorUuids]])
    .addQuery(replaceDebtorInInvoice, [debtorUuid, [otherDebtorUuids]])
    .addQuery(replaceDebtorInPostingJournal, [debtorUuid, [otherDebtorUuids]])
    .addQuery(replaceDebtorInGeneralLedger, [debtorUuid, [otherDebtorUuids]])
    .addQuery(replaceDebtorInPatient, [debtorUuid, [otherDebtorUuids]])
    .addQuery(replaceDebtorInStockAssign, [debtorUuid, [otherDebtorUuids]])
    .addQuery(replaceDebtorInVoucherItem, [debtorUuid, [otherDebtorUuids]])

    .addQuery(replacePatientInEmployee, [selectedPatientUuid, [otherPatientUuids]])
    .addQuery(replacePatientInMedicalSheet, [selectedPatientUuid, [otherPatientUuids]])
    .addQuery(replacePatientInPatientAssignment, [selectedPatientUuid, [otherPatientUuids]])
    .addQuery(replacePatientInPatientDocument, [selectedPatientUuid, [otherPatientUuids]])
    .addQuery(replacePatientInPatientHospitalization, [selectedPatientUuid, [otherPatientUuids]])
    .addQuery(replacePatientInPatientVisit, [selectedPatientUuid, [otherPatientUuids]])
    .addQuery(replacePatientInStockMovement, [debtorUuid, [otherDebtorUuids]])

    .addQuery(removeOtherDebtors, [otherDebtorUuids])
    .addQuery(removeOtherEntityMap, [otherDebtorUuids])
    .addQuery(removeOtherPatients, [otherPatientUuids]);

  await transaction.execute();
  debug(`#mergePatient(): Merged patients successfully.`);
  res.sendStatus(204);
});

exports.router = router;
