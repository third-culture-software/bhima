/**
 * @module patientGroups
 *
 * @description
 * This controller is responsible for implementing all crud and others custom
 * requests on the patient groups table through the `/patients/groups` endpoint.
 *
 * The /patient_groups HTTP API endpoint
 *
 * @requires db
 * @requires lib/util
 * @requires NotFound
 */

const { uuid } = require('../../lib/util');
const db = require('../../lib/db');
const FilterParser = require('../../lib/filter');
const NotFound = require('../../lib/errors/NotFound');

/**
 * @method list
 *
 * @description
 * Returns an array of patient groups.
 */
function list(req, res, next) {
  const filters = new FilterParser(req.query, { tableAlias : 'pg' });
  const sql = `
    SELECT BUID(pg.uuid) as uuid, pg.name, BUID(pg.price_list_uuid) AS price_list_uuid,
      pg.note, pg.created_at, pl.label AS priceListLabel, pl.description,
      assignment.patientNumber
    FROM patient_group AS pg 
    LEFT JOIN price_list AS pl ON pg.price_list_uuid = pl.uuid
    LEFT JOIN (
      SELECT count(uuid) as patientNumber , patient_group_uuid
      FROM patient_assignment
      GROUP BY patient_group_uuid
    )assignment ON assignment.patient_group_uuid = pg.uuid
  `;

  filters.equals('name');
  filters.fullText('note');
  filters.fullText('label');
  filters.fullText('description');

  filters.setOrder(' ORDER BY pg.name;');

  const [query, parameters] = [filters.applyQuery(sql), filters.parameters()];

  db.exec(query, parameters)
    .then(rows => {
      res.status(200).json(rows);
    })
    .catch(next)
    
}

/**
 * @method create
 *
 * @description
 * Create a patient group in the database.  If the patient group has associated
 * subsidies or invoicing fees.
 */
function create(req, res, next) {
  const record = db.convert(req.body, ['price_list_uuid']);
  const sql = 'INSERT INTO patient_group SET ?;';
  const subsidySql = 'INSERT INTO patient_group_subsidy (subsidy_id, patient_group_uuid) VALUES ?;';
  const invoicingFeeSql = 'INSERT INTO patient_group_invoicing_fee (invoicing_fee_id, patient_group_uuid) VALUES ?;';

  // provide UUID if the client has not specified
  const uid = record.uuid || uuid();
  record.uuid = db.bid(uid);

  const hasSubsidies = record.subsidies && record.subsidies.length > 0;
  const hasInvoicingFees = record.invoicingFees && record.invoicingFees.length > 0;

  const { subsidies, invoicingFees } = record;

  delete record.subsidies;
  delete record.invoicingFees;

  const transaction = db.transaction();

  transaction
    .addQuery(sql, [record]);

  // link up subsidies if they exist
  if (hasSubsidies) {
    const subs = subsidies
      .map(subsidyId => ([
        subsidyId,
        record.uuid,
      ]));

    transaction.addQuery(subsidySql, [subs]);
  }

  // link up invoicing fees if they exist
  if (hasInvoicingFees) {
    const fees = invoicingFees
      .map(invoicingFeeId => ([
        invoicingFeeId,
        record.uuid,
      ]));

    transaction.addQuery(invoicingFeeSql, [fees]);
  }

  transaction.execute()
    .then(() => {
      res.status(201).json({ uuid : uid });
    })
    .catch(next)
    
}

/**
 * @method update
 *
 * @description
 * Update a patient group in the database.  It will also recreate the subsidies
 * and invoicing fees based on any lists passed from the client-side.
 */
function update(req, res, next) {
  const sql = 'UPDATE patient_group SET ? WHERE uuid = ?';
  const deleteSubsidySql = 'DELETE FROM patient_group_subsidy WHERE patient_group_uuid = ?';
  const deleteInvoicingFeeSql = 'DELETE FROM patient_group_invoicing_fee WHERE patient_group_uuid = ?';

  const subsidySql = 'INSERT INTO patient_group_subsidy (subsidy_id, patient_group_uuid) VALUES ?;';
  const invoicingFeeSql = 'INSERT INTO patient_group_invoicing_fee (invoicing_fee_id, patient_group_uuid) VALUES ?;';

  const data = db.convert(req.body, ['price_list_uuid']);
  const { subsidies, invoicingFees } = data;

  const hasSubsidies = data.subsidies && data.subsidies.length > 0;
  const hasInvoicingFees = data.invoicingFees && data.invoicingFees.length > 0;

  // make sure we aren't updating the uuid
  delete data.uuid;
  delete data.created_at;
  delete data.subsidies;
  delete data.invoicingFees;

  const patientGroupUuid = db.bid(req.params.uuid);

  const transaction = db.transaction();
  transaction
    .addQuery(sql, [data, patientGroupUuid])
    .addQuery(deleteSubsidySql, patientGroupUuid)
    .addQuery(deleteInvoicingFeeSql, patientGroupUuid);

  // TODO(@jniles) - clean up repeated code

  // link up subsidies if they exist
  if (hasSubsidies) {
    const subs = subsidies
      .map(subsidyId => ([
        subsidyId,
        patientGroupUuid,
      ]));

    transaction.addQuery(subsidySql, [subs]);
  }

  // link up invoicing fees if they exist
  if (hasInvoicingFees) {
    const fees = invoicingFees
      .map(invoicingFeeId => ([
        invoicingFeeId,
        patientGroupUuid,
      ]));

    transaction.addQuery(invoicingFeeSql, [fees]);
  }

  transaction.execute()
    .then(() => lookupPatientGroup(req.params.uuid))
    .then(group => {
      res.status(200).json(group);
    })
    .catch(next)
    
}

/**
 * @method remove
 *
 * @description
 * Remove a patient group in the database
 */
function remove(req, res, next) {
  const id = db.bid(req.params.uuid);
  const sql = 'DELETE FROM patient_group WHERE uuid = ?';

  db.exec(sql, [id])
    .then(rows => {
      if (!rows.affectedRows) {
        throw new NotFound(`No patient group found with uuid ${req.params.uuid}`);
      }
      res.sendStatus(204);
    })
    .catch(next)
    
}

/**
 * @method detail
 *
 * @description
 * Return a patient group details from the database
 */
function detail(req, res, next) {
  lookupPatientGroup(req.params.uuid)
    .then(row => {
      res.status(200).json(row);
    })
    .catch(next)
    
}

/**
 * @method lookupPatientGroup
 *
 * @description
 * Return a patient group instance from the database
 *
 * @param {String} uid - the uuid of the patient group
 * @returns {Promise} - the result of the database query database
 */
function lookupPatientGroup(uid) {
  const sql = `
    SELECT BUID(pg.uuid) as uuid, pg.name, pg.enterprise_id,
      BUID(pg.price_list_uuid) as price_list_uuid, pg.note, pg.created_at
    FROM patient_group AS pg WHERE pg.uuid = ?;
  `;

  const subsidiesSql = `
    SELECT subsidy.id, subsidy.label, subsidy.description
    FROM patient_group_subsidy pgs JOIN subsidy ON pgs.subsidy_id = subsidy.id
    WHERE pgs.patient_group_uuid = ?;
  `;

  const invoicingFeeSql = `
    SELECT fee.id, fee.label, fee.description
    FROM patient_group_invoicing_fee pgif JOIN invoicing_fee fee ON pgif.invoicing_fee_id = fee.id
    WHERE pgif.patient_group_uuid = ?;
  `;

  const patientGroupUuid = db.bid(uid);

  return Promise.all([
    db.one(sql, patientGroupUuid, uid, 'patient group'),
    db.exec(subsidiesSql, patientGroupUuid),
    db.exec(invoicingFeeSql, patientGroupUuid),
  ])
    .then(([patientGroup, subsidies, invoicingFees]) => {
      patientGroup.subsidies = subsidies;
      patientGroup.invoicingFees = invoicingFees;
      return patientGroup;
    });
}

exports.list = list;
exports.create = create;
exports.update = update;
exports.remove = remove;
exports.detail = detail;
