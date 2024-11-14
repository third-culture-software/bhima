/**
 * @module medical/patients/groups
 *
 * @description
 * This module is concerned with all group operations that require a patient
 * prefix.  These operations include finding a patient's groups, updating a
 * patient's group associations, and listing a patient's groups.
 *
 * @requires lodash
 * @requires lib/db
 * @requires lib/util
 * @requires lib/errors/BadRequest
 * @requires lib/errors/NotFound
 */

const _ = require('lodash');

const { uuid } = require('../../../lib/util');
const db = require('../../../lib/db');
const BadRequest = require('../../../lib/errors/BadRequest');
const NotFound = require('../../../lib/errors/NotFound');

// GET /patients/:uuid/groups
exports.list = list;

// POST /patients/:uuid/groups
exports.update = update;
exports.bulkUpdate = bulkUpdate;
/**
 * @method list
 *
 * @description
 * Given a patient, this will list the groups to which they are registered.
 */
function list(req, res, next) {
  const id = db.bid(req.params.uuid);

  // just check if the patient exists
  const patientExistenceQuery = 'SELECT uuid FROM patient WHERE uuid = ?;';

  // read patient groups
  const patientGroupsQuery = `
    SELECT patient_group.name, patient_group.note, patient_group.created_at, BUID(patient_group.uuid) as uuid
    FROM patient_assignment LEFT JOIN patient_group ON patient_group_uuid = patient_group.uuid
    WHERE patient_uuid = ?;
  `;

  db.exec(patientExistenceQuery, [id])
    .then(rows => {
      if (_.isEmpty(rows)) {
        throw new NotFound(`Could not find an assignation patient with uuid ${req.params.uuid}.`);
      }

      return db.exec(patientGroupsQuery, [id]);
    })
    .then(patientGroups => {
      res.status(200).json(patientGroups);
    })
    .catch(next);

}

/**
 * @method update
 *
 * @description
 * This endpoint accepts an array of patient group unique ids that will be
 * assigned to the patient id provided in the route.  If no ids are provided,
 * the route will simply remove all patient group assignments from the patient.
 */
function update(req, res, next) {
  const patientId = db.bid(req.params.uuid);

  // TODO make sure assignments is an array etc. - test for these cases
  if (!req.body.assignments) {
    next(new BadRequest(
      `Request must specify an "assignments" object containing an array of patient group ids.`,
      'ERROR.ERR_MISSING_INFO',
    ));

    return;
  }

  // Clear assigned groups
  const deleteAssignmentsQuery = 'DELETE FROM patient_assignment WHERE patient_uuid = ?';

  // Insert new relationships
  const createAssignmentsQuery = 'INSERT INTO patient_assignment (uuid, patient_uuid, patient_group_uuid) VALUES ?';

  // map each requested patient group uuid to the current patient uuid to be
  // inserted into the database
  const assignmentData = req.body.assignments.map(patientGroupId => {
    return [
      db.bid(uuid()),
      patientId,
      db.bid(patientGroupId),
    ];
  });

  const transaction = db.transaction();

  transaction.addQuery(deleteAssignmentsQuery, [patientId]);

  // Create query is not executed unless patient groups have been specified
  if (assignmentData.length) {
    transaction.addQuery(createAssignmentsQuery, [assignmentData]);
  }

  transaction.execute()
    .then(result => {
      // TODO send back correct ids
      res.status(200).json(result);
    })
    .catch(next);

}

// assign multiple patient to a group
function bulkUpdate(req, res, next) {

  const { patientUuids, subscribedGroups, removeAssignedGroups } = req.body;

  const uuids = [].concat(patientUuids);
  const groups = [].concat(subscribedGroups);

  // Clear assigned groups
  const deleteAssignmentsQuery = 'DELETE FROM patient_assignment WHERE patient_uuid = ?';
  //
  const removeAlreadyAssignedGroupsQuery = `
    DELETE FROM patient_assignment WHERE patient_uuid = ? AND patient_group_uuid = ?
  `;
  // Insert new relationships
  const createAssignmentsQuery = `INSERT INTO patient_assignment SET ?`;

  const transaction = db.transaction();

  uuids.forEach(patientUuid => {
    if (removeAssignedGroups) {
      transaction.addQuery(deleteAssignmentsQuery, db.bid(patientUuid));
    }

    // assign groups
    groups.forEach(groupUuid => {
      const assignment = {
        uuid : db.uuid(),
        patient_uuid : db.bid(patientUuid),
        patient_group_uuid : db.bid(groupUuid),
      };

      transaction.addQuery(removeAlreadyAssignedGroupsQuery, [db.bid(patientUuid), db.bid(groupUuid)]);
      transaction.addQuery(createAssignmentsQuery, assignment);
    });
  });

  transaction.execute()
    .then(() => {
      res.sendStatus(200);
    })
    .catch(next);
}
