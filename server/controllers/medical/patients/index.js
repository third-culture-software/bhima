/**
 * @module medical/patient
 *
 * @description
 * The /patient HTTP API endpoint
 *
 * @description
 * This module is responsible for handling all crud operations relatives to patients
 * and define all patient API functions.
 *
 * @requires lodash
 * @requires jaro-winkler
 * @requires lib/db
 * @requires lib/util
 * @requires lib/errors/BadRequest
 * @requires lib/errors/NotFound
 * @requires lib/barcode
 * @requires lib/filter
 *
 * @requires config/identifiers
 *
 * @requires medical/patients/groups
 * @requires medical/patients/documents
 * @requires medical/patients/vists
 * @requires medical/patients/pictures
 */

const _ = require('lodash');
const debug = require('debug')('bhima:patient:find');

const distance = require('jaro-winkler');

const identifiers = require('../../../config/identifiers');

const { uuid } = require('../../../lib/util');
const barcode = require('../../../lib/barcode');
const db = require('../../../lib/db');
const FilterParser = require('../../../lib/filter');
const BadRequest = require('../../../lib/errors/BadRequest');
const Debtors = require('../../finance/debtors');

const groups = require('./groups');
const documents = require('./documents');
const visits = require('./visits');
const pictures = require('./pictures');
const merge = require('./merge');

// bind submodules
exports.groups = groups;
exports.documents = documents;
exports.visits = visits;
exports.merge = merge;
exports.pictures = pictures;
exports.stockMovementByPatient = stockMovementByPatient;
exports.stockConsumedPerPatient = stockConsumedPerPatient;

// create a new patient
exports.create = create;

// get details of a patient
exports.detail = detail;

// update patient informations
exports.update = update;

// get list of patients
// search patients
exports.read = read;

exports.searchByName = searchByName;
exports.find = find;

// check if a hospital file number is assigned to any patients
exports.hospitalNumberExists = hospitalNumberExists;

/** @todo discuss if these should be handled by the entity APIs or by patients. */
exports.invoicingFees = invoicingFees;
exports.subsidies = subsidies;

/** expose patient detail query internally */
exports.lookupPatient = lookupPatient;

/** expose custom method to lookup patients by their debtor uuid */
exports.lookupByDebtorUuid = lookupByDebtorUuid;

exports.getFinancialStatus = getFinancialStatus;
exports.getDebtorBalance = getDebtorBalance;
exports.getStockMovements = getStockMovements;

/** @todo Method handles too many operations */
function create(req, res, next) {
  const createRequestData = req.body;

  let { medical, finance } = createRequestData;

  // Debtor group required for financial modelling
  const invalidParameters = !finance || !medical;
  if (invalidParameters) {
    next(new BadRequest('Both financial and medical information must be provided to register a patient.'));
    return;
  }

  // optionally allow client to specify UUID
  const medicalUuid = medical.uuid || uuid();
  medical.uuid = medicalUuid;
  finance.uuid = medicalUuid;

  medical.user_id = req.session.user.id;

  if (medical.dob) {
    medical.dob = new Date(medical.dob);
  }

  if (medical.registration_date) {
    medical.registration_date = new Date(medical.registration_date);
  }

  finance = db.convert(finance, ['uuid', 'debtor_group_uuid']);
  medical = db.convert(medical, ['uuid', 'current_location_id', 'origin_location_id']);
  medical.debtor_uuid = finance.uuid;

  // Remove whitespace from Patient display_name
  if (medical.display_name) {
    medical.display_name = medical.display_name.trim();
  }

  const writeDebtorQuery = 'INSERT INTO debtor (uuid, group_uuid, text) VALUES (?, ?, ?)';
  const writePatientQuery = 'INSERT INTO patient SET ?';

  const transaction = db.transaction();

  transaction
    .addQuery(writeDebtorQuery, [finance.uuid, finance.debtor_group_uuid, generatePatientText(medical)])
    .addQuery(writePatientQuery, [medical]);

  transaction.execute()
    .then(() => {
      res.status(201).json({
        uuid : medicalUuid,
      });
    })
    .catch(next);

}

// generate default text for the patient's debtor entity.
function generatePatientText(patient) {
  const textLineDefault = 'Patient/';
  return textLineDefault.concat(patient.display_name);
}

/**
 * @method detail
 *
 * @description
 * Returns details associated to a patient directly and indirectly.
 */
function detail(req, res, next) {
  lookupPatient(req.params.uuid)
    .then((patient) => {
      res.status(200).json(patient);
    })
    .catch(next);
}

/**
 * @method update
 *
 * @description
 * Updates a patient group
 */
function update(req, res, next) {
  const data = db.convert(req.body, ['debtor_uuid', 'current_location_id', 'origin_location_id']);
  const patientUuid = req.params.uuid;
  const buid = db.bid(patientUuid);

  // sanitize date
  if (data.dob) {
    data.dob = new Date(data.dob);
  }

  // Remove whitespace from patient display_name
  if (data.display_name) {
    data.display_name = data.display_name.trim();
  }

  // prevent updating the patient's uuid
  delete data.uuid;
  delete data.reference;

  const updatePatientQuery = 'UPDATE patient SET ? WHERE uuid = ?';

  db.exec(updatePatientQuery, [data, buid])
    .then(() => updatePatientDebCred(patientUuid))
    .then(() => lookupPatient(patientUuid))
    .then((updatedPatient) => {
      res.status(200).json(updatedPatient);
    })
    .catch(next);
}

/**
 * @method lookupPatient
 *
 * @description
 * This function looks up a patient by its unique id.  If the patient doesn't
 * exist, it throws a NOT FOUND error.
 *
 * @param {String} patientUuid - the patient's unique id hex string
 * @returns {Promise} - the result of the database query
 */
async function lookupPatient(patientUuid) {
  const buid = db.bid(patientUuid);

  // TODO(@sfount) ALL patient queries should use the same column selection and guarantee the same information
  const sql = `
    SELECT BUID(p.uuid) as uuid, p.project_id, BUID(p.debtor_uuid) AS debtor_uuid, p.display_name, p.hospital_no,
      p.sex, p.registration_date, p.email, p.phone, p.dob, p.dob_unknown_date,
      p.health_zone, p.health_area, BUID(p.origin_location_id) as origin_location_id,
      BUID(p.current_location_id) as current_location_id, em.text AS reference,
      p.title, p.address_1, p.address_2, p.father_name, p.mother_name,
      p.religion, p.marital_status, p.profession, p.employer, p.spouse,
      p.spouse_profession, p.spouse_employer, p.notes, p.avatar, proj.abbr, d.text,
      dg.account_id, BUID(dg.price_list_uuid) AS price_list_uuid, dg.is_convention,
      BUID(dg.uuid) as debtor_group_uuid, dg.locked, dg.name as debtor_group_name, u.username,
      u.display_name AS userName, a.number, proj.name, p.health_zone, p.health_area, BUID(emp.uuid) AS employee_uuid,
      emp.locked
    FROM patient AS p
      JOIN project AS proj ON p.project_id = proj.id
      JOIN debtor AS d ON p.debtor_uuid = d.uuid
      JOIN debtor_group AS dg ON d.group_uuid = dg.uuid
      JOIN user AS u ON p.user_id = u.id
      JOIN account AS a ON a.id = dg.account_id
      JOIN entity_map AS em ON p.uuid = em.uuid
      LEFT JOIN employee AS emp ON emp.patient_uuid = p.uuid
    WHERE p.uuid = ?;
  `;

  const patient = await db.one(sql, buid, patientUuid, 'patient');

  _.extend(patient, {
    barcode : barcode.generate(identifiers.PATIENT.key, patient.uuid),
  });

  const priceList = await lookupPatientPriceList(buid);
  patient.price_list_uuid = patient.price_list_uuid || priceList;
  return patient;
}

/**
 * @method lookupPatientPriceLise
 *
 * @description
 * This method queries the price list for the patient, choosing the debtor price
 * list if it exists, or using a random patient group price list if those exist.
 *
 * TODO(@jniles) - how should this logic actually work?
 */
function lookupPatientPriceList(patientUuid) {
  const sql = `
    SELECT BUID(MAX(price_list_uuid)) as price_list_uuid FROM patient_assignment pa
      LEFT JOIN patient_group pg ON pa.patient_group_uuid = pg.uuid
    WHERE pa.patient_uuid = ?
    GROUP BY patient_uuid;
  `;

  return db.exec(sql, patientUuid)
    .then(([row]) => row && row.price_list_uuid);
}

/**
 * @method updatePatientDebCred
 *
 * @description
 * This function is used to update the text value of the creditor
 * and debtor tables in case the patient's name was changed.
 *
 * @param {String} patientUuid - the patient's unique id hex string
 */
async function updatePatientDebCred(patientUuid) {
  const buid = db.bid(patientUuid);

  const sql = `
    SELECT BUID(debtor.uuid) AS debtorUuid, BUID(employee.creditor_uuid) AS creditorUuid,
      patient.display_name, em.text as patientReference
    FROM debtor
      JOIN patient ON patient.debtor_uuid = debtor.uuid
      JOIN entity_map em ON em.uuid = patient.uuid
      LEFT JOIN employee ON employee.patient_uuid = patient.uuid
    WHERE patient.uuid = ?
  `;

  const [patient] = await db.exec(sql, buid);

  db.convert(patient, ['debtorUuid', 'creditorUuid']);

  const debtorText = {
    text : `Debiteur [${patient.display_name}]`,
  };

  const creditorText = {
    text : `Crediteur [${patient.display_name}]`,
  };

  const updateCreditor = `UPDATE creditor SET ? WHERE creditor.uuid = ?`;
  const updateDebtor = `UPDATE debtor SET ? WHERE debtor.uuid = ?`;
  const updateEntityMap = `UPDATE entity_map SET text = ? WHERE uuid = ?;`;

  const transaction = db.transaction();

  transaction
    .addQuery(updateDebtor, [debtorText, patient.debtorUuid]);

  if (patient.creditorUuid) {
    transaction.addQuery(updateCreditor, [creditorText, patient.creditorUuid]);
  }

  // update entity map tables
  transaction
    .addQuery(updateEntityMap, [patient.patientReference, patient.debtor_uuid])
    .addQuery(updateEntityMap, [patient.patientReference, patient.creditor_uuid])
    .addQuery(updateEntityMap, [patient.patientReference, buid]);

  return transaction.execute();
}

/**
 * @method lookupByDebtorUuid
 *
 * @description
 * This function looks up a patient by its debtor uuid.  Since uuids are
 * globally unique, there should be a 1->1 map of debtor_uuids to patients.  If
 * no record is found, it throws a NOT FOUND error.
 *
 * @param {String} debtorUuid - the patient's unique debtor id hex string
 * @returns {Promise} - the result of the database query
 */
function lookupByDebtorUuid(debtorUuid) {
  const buid = db.bid(debtorUuid);

  const sql = `
    SELECT BUID(p.uuid) as uuid, p.project_id, BUID(p.debtor_uuid) AS debtor_uuid, p.display_name,
      p.hospital_no, p.sex, p.registration_date, p.email, p.phone, p.dob,
      BUID(p.origin_location_id) as origin_location_id, p.title, p.address_1, p.address_2, em.text as reference,
      proj.name AS proj_name, p.father_name, p.mother_name, p.religion, p.marital_status, p.profession,
      p.employer, p.spouse, p.spouse_profession, p.spouse_employer, p.notes, p.avatar, proj.abbr, d.text,
      dg.account_id, BUID(dg.price_list_uuid) AS price_list_uuid, dg.is_convention, BUID(dg.uuid) as debtor_group_uuid,
      dg.locked, dg.name as debtor_group_name, u.username, a.number
    FROM patient AS p
    JOIN project AS proj JOIN debtor AS d JOIN debtor_group AS dg JOIN user AS u JOIN account AS a JOIN entity_map AS em
      ON p.debtor_uuid = d.uuid AND d.group_uuid = dg.uuid
      AND p.project_id = proj.id
      AND p.user_id = u.id
      AND a.id = dg.account_id
      AND p.uuid = em.uuid
    WHERE p.debtor_uuid = ?;
  `;

  return db.one(sql, buid, buid, 'debtor');
}

/**
 * This method implements the bhima unique API for hospital numbers; it is
 * responsible for informing the client if a hospital number has been used (is
 * found) or is available (is not found)
 *
 * Exists API:
 * GET /entity/attribute/:id/exists
 * This pattern will be used by the client side service and must be respected
 * by this route.
 *
 * The API here purposefully returns a 200 even if the hospital number cannot
 * be found, this is provide less convoluted logic for the client directive
 * (failure implying success).
 *
 * @returns {Boolean}   true - hospital number passed in has been found
 *                      false - hospital number passed in has not been found
 */
function hospitalNumberExists(req, res, next) {
  const hospitalNumber = req.params.id;

  const verifyQuery = 'SELECT uuid, hospital_no FROM patient WHERE hospital_no = ?';

  db.exec(verifyQuery, [hospitalNumber])
    .then((result) => {
      // if the result is not empty the hospital number exists (return this Boolean)
      res.status(200).json(!_.isEmpty(result));
    })
    .catch(next);

}

/*
 * @method searchByName
 *
 * @description
 * This method implements a patient search that will only ever return very limited
 * information, it does not require many JOINs and will respond with UUIDs for patients
 * that match the requested name.
 */
function searchByName(req, res, next) {
  // filter parser not implemented - all other params should be ignored
  const searchValue = req.query.display_name;
  const searchParameter = `%${searchValue}%`;

  if (_.isUndefined(searchValue)) {
    return next(new BadRequest('display_name attribute must be specified for a name search'));
  }

  // current default limit - this could be defined through req.query if there is a need for this
  const limit = 10;

  const sql = `
    SELECT
      BUID(patient.uuid) as uuid, display_name,
      CONCAT_WS('.', '${identifiers.PATIENT.key}', project.abbr, patient.reference) as reference, debtor_group.color
    FROM patient
      JOIN project ON patient.project_id = project.id
      JOIN debtor ON patient.debtor_uuid = debtor.uuid
      JOIN debtor_group ON debtor.group_uuid = debtor_group.uuid
    WHERE LOWER(display_name) LIKE ?
    LIMIT ${limit}
  `;

  return db.exec(sql, [searchParameter])
    .then((results) => res.send(results))
    .catch(next);

}

function findMatchingPatients(matchNameParts, patientNames) {
  // matchNameParts is an array of a proposed patient name parts (lower case, sorted)
  // patientNames is an associative array of
  //     patient_id => [patientNameParts]

  const matchCutoff = 0.92; // Based on experiments with jaro-winkler function

  const matches = []; // Array of matches:  [[pid, matchNameParts, distSum], etc]

  _.forEach(patientNames, (patientNameParts, pid) => {
    if (patientNameParts.length === 0) {
      // Ignore patient records with empty names
      // (These need to be purged or fixed!)
      return [];
    }

    if (matchNameParts.length === patientNameParts.length) {
      // This is the easy case, do one-to-one comparisons
      let distSum = 0;
      const matchCriterion = matchCutoff * matchNameParts.length;
      matchNameParts.sort().forEach((part, i) => {
        distSum += distance(part, patientNameParts[i]);
      });
      if (distSum > matchCriterion) {
        matches.push([pid, matchNameParts, distSum / matchNameParts.length]);
      }
    } else {
      // Not equal length
      // Compare each name part with all the patient name parts to find the best match
      // NOTE: This branch could be improved by doing enumerated search pairs based on
      //       permutations and taking advantage of the sorted order of both search and
      //       patient name  parts.

      const matchCriterion = matchCutoff * matchNameParts.length;
      const alreadyTried = new Set();
      let distSum = 0;
      matchNameParts.forEach((mname) => {
        let bestDist = 0;
        let bestName = null;
        patientNameParts.forEach((pname) => {
          if (alreadyTried.has(pname)) {
            // If we have already tried a match with this pname, move on
            // (Trying to prevent problems with repeated names skewing results)
            return;
          }
          const newDist = distance(mname, pname);
          if (newDist > bestDist) {
            bestDist = newDist;
            bestName = pname;
          }
        });
        alreadyTried.add(bestName);
        distSum += bestDist;
      });

      if (distSum > matchCriterion) {
        matches.push([pid, matchNameParts, distSum / matchNameParts.length]);
      }
    }
    return [];
  });

  matches.sort((a, b) => { return b[2] - a[2]; });

  return matches;
}

/*
 * @method findBestNameMatches
 *
 * @description
 * This method implements a patient search based on name and optionally
 * gender and date of birth.  Note that parts of names that are a single
 * letter are ignored. It tries to do 'fuzzy' search and can find names
 * that have their name parts in different order and is tolerant of
 * minor misspellings.
 *
 * This function supports these query parameters:
 *    - search_name      string [required]
 *    - sex              string [optional] ('F' / 'M')
 *    - dob              string [optional] (see note below)
 *    - dob_unknown_date string [optional] ('true'/'false')
 *
 * Note that dob can be an SQL date format string, a four-digit string
 * for the year (if dob_unknown_date is true), or a 4-digit number for
 * the year.
 *
 * The goal is to make the approximate name search work as robustly
 * as possible.
 *
 * The first step is to find potential patient name matches:
 *   - The search_name and potential matching patient names are split
 *     into name parts (eg, first  name, last name, etc) and
 *     alphabetized.
 *   - Then the names are compared in the alphabetical order and the
 *     'distance' (0-1) between them is determined using the
 *     jaro-winkler function.  This function gives exact matches
 *     if the names are the same (ignoring capitalization) and is
 *     tolerant of the order of the name parts.  Note that a
 *     variation of this approach is used if there are different
 *     numbers of name parts for the search and patient names.
 *   - The total score for the name is based sum of the distances
 *     between each pair of name parts divided by the number of parts
 *     in the search name.   The result is always between 0 and 1.
 *   - Matches that are off single or double misspellings generally
 *     score very close to 1.
 *   - The function findMatchingPatients() does the name part
 *     comparisons to construct a list of potential name matches,
 *     along with the score of each match.  Matches with scores above
 *     a cut off value are kept as a potential match is 'matchCutoff'
 *     (which is defined above in findMatchingPatients()).
 *
 * Once the potential name matches are determined, then the optional
 * gender and date of birth fields come into play.
 *   - If the 'sex' field is present, it is matched and the score is
 *     augmented by 50% (see sexWeight) below.
 *   - If the 'dob' field is present, it is also matched and the score
 *     is augmented by a maximum of 30% (see dobWeight below).  DOB
 *     matches that are exact count the maximum. Matches that are
 *     approximate are discounted the further off they are.  Currently
 *     dob the match needs to be within a few year for a reasonable
 *     increment.  There is extra logic below that deals with year
 *     year matches vs exact date matches.
 *   - In any case, the total score for each potential match is
 *     scaled to be between 0 and 1.
 *   - Specifying the sex and DOB can help to improve the ranking
 *     of potential matches.
 *
 * Finally, an additional score increment is added based on how many
 * name parts are involved.  If the number of name parts are the same
 * in both the query and the patient name matches, the name matching
 * score is unaffected.  If total score is reduced based on different
 * numbers of query and patient name parts.
 *
 * @returns array of potential matching patient objects.
 *          Each row has a additional 'matchScore' value that
 *          indicates the quality of the match (0-1).
 */
function findBestNameMatches(req, res, next) {

  const sexWeight = 0.5;
  const dobWeight = 0.3;
  const lenWeight = 0.1;

  const options = req.query;

  // Canonize the parts of the specified approximate name
  // Split by spaces, lowercase, sort alphabetically, and eliminate any single-letter names
  const searchNameParts = options.search_name.toLowerCase()
    .split(/[ ,]/).map(nm => nm.replace('.', ''))
    .filter(str => str.trim().length > 1)
    .sort();

  // Get the complete list of patient names, sex, dob, and patient uuids
  const sql = `
    SELECT
      HEX(uuid) as pid, display_name as pname, sex, dob, dob_unknown_date
    FROM patient;`;

  let matches = [];

  db.exec(sql, [])
    .then((patients) => {

      // Construct an dictionary of patient name parts
      const patientNames = {};
      patients.forEach((p) => {
        patientNames[p.pid] = p.pname.toLowerCase()
          .split(/[ ,]/).map(nm => nm.replace('.', ''))
          .filter(str => str.trim().length > 1)
          .sort();
      });

      // Find patients with matching names (or nearly matching names)
      const nameMatches = findMatchingPatients(searchNameParts, patientNames);

      // Determine the maximum name match score (for later scaling)
      let maxScore = 1.0 + lenWeight;
      if ('sex' in options) {
        maxScore += sexWeight;
      }
      if ('dob' in options) {
        maxScore += dobWeight;
      }

      nameMatches.forEach(([pid, /* nameParts */, nameScore]) => {
        debug('Name check (search,patient,nameScore,len): ',
          searchNameParts, patientNames[pid], nameScore, nameMatches.length);
        let score = nameScore;

        if ('sex' in options || 'dob' in options) {
          // Find the corresponding patient info
          const patientInfo = {};
          patientInfo[pid] = patients.find(row => row.pid === pid);

          // Check the gender
          if ('sex' in options) {
            if (options.sex === patientInfo[pid].sex) {
              // Full delta score for gender match, 0 if not
              score += sexWeight * 1.0;
            }
          }

          // Check the dob
          if ('dob' in options) {
            let dob = new Date(options.dob);
            if (options.dob.length === 4) {
              // Arbitrarily choose the middle of the year to
              // avoid problems with the time zone offsets causing
              // the wrong year to be used later.
              dob = new Date(`${options.dob}-06-01`);
            }
            const dobYearOnly = options.dob_unknown_date ? options.dob_unknown_date === 'true' : false;
            const patientDob = new Date(patientInfo[pid].dob);
            const patientDobYearOnly = patientInfo[pid].dob_unknown_date === 1;
            debug(' - DOBS (query,qYear,patient,pYear): ', dob, dobYearOnly, patientDob, patientDobYearOnly);

            if (dobYearOnly || patientDobYearOnly) {
              // If either specified only with the year
              // NOTE: Treating either as year-only the same way
              const dobYear = dob.getFullYear();
              const patientDobYear = patientDob.getFullYear();
              debug(' - DOBS years (query,patient): ', dobYear, patientDobYear);
              if (dobYear === patientDobYear) {
                // Full score if both years match and both are year-only
                score += dobWeight * 1.0;
                debug(' - Year match (year,score): ', dobYear, score);
              } else {
                // Downgrade the score by the number of years off
                const maxYearsDiff = 5;
                const yearsDiff = Math.abs(dobYear - patientDobYear);
                if (yearsDiff <= maxYearsDiff) {
                  // Discount year near matches proportionately
                  score += dobWeight * 0.8 * (1.0 - yearsDiff / maxYearsDiff);
                  debug(' - Near year match (diff,score): ', yearsDiff, score);
                }
                debug(' - No year match!', score);
              }
            } else {
              // We have exact dates for both
              const daysDiff = Math.round(Math.abs(dob - patientDob) / (1000 * 24 * 3600));
              debug(' - DaysDiff: ', daysDiff);
              if (daysDiff === 0) {
                // Count the same day as best dob match
                score += dobWeight * 1.0;
                debug(' - Day match score: ', score);
              } else {
                // Discount appropriately
                const maxDaysDiff = 730; // 2 years
                if (daysDiff <= maxDaysDiff) {
                  score += dobWeight * 0.8 * (1.0 - daysDiff / maxDaysDiff);
                  debug(' - Near day match (diff,score): ', daysDiff, score);
                }
              }
            }
          }
        }

        // Handle the name length increment
        const pnameLen = patientNames[pid].length;
        if (searchNameParts.length === pnameLen) {
          score += lenWeight * 1.0;
        } else {
          const lenDiff = Math.abs(searchNameParts.length - pnameLen);
          // NOTE: We want smaller differences in the number of name parts
          //       between the query and the patient names to produce
          //       higher scores.
          score += lenWeight * (1.0 - lenDiff / Math.max(searchNameParts.length, pnameLen));
        }

        debug('-->totalScore, (score / maxScore): ', score / maxScore, '(', score, '/', maxScore, ')');
        matches.push([pid, score / maxScore]);
      });

      // If there are no matches, return now
      if (matches.length === 0) {
        return [];
      }

      // Resort the matches
      matches = matches.sort((a, b) => { return b[1] - a[1]; });

      // Now get the info for these patients
      return find({ uuids : matches.map(x => x[0]) });
    })
    .then((data) => {

      if (typeof data === 'undefined') {
        return res.status(200).json([]);
      }

      // Insert the match score into each record
      data.forEach((row) => {
        const [/* name */, mscore] = matches.find(mrow => { return mrow[0] === row.uuid; });
        row.matchScore = mscore;
      });
      return res.status(200).json(data);
    })
    .catch(next);

}

/**
 * @method find
 *
 * @description
 * This function scans the patient table in the database to find all values
 * matching parameters provided in the options parameter.
 *
 * @param {Object} options - a JSON of query parameters
 * @returns {Promise} - the result of the promise query on the database.
 */
function find(options) {

  // ensure expected options are parsed appropriately as binary
  db.convert(options, [
    'patient_group_uuid', 'debtor_group_uuid', 'debtor_uuid', 'uuid', 'uuids',
  ]);

  const filters = new FilterParser(options, {
    tableAlias : 'p',
  });

  const sql = patientEntityQuery(options.detailed);

  filters.equals('debtor_uuid');
  filters.fullText('display_name');
  filters.dateFrom('dateBirthFrom', 'dob');
  filters.dateTo('dateBirthTo', 'dob');
  filters.equals('health_zone');
  filters.equals('health_area');
  filters.equals('project_id');
  filters.equals('uuid');
  filters.equals('uuids', 'uuid', 'p', true);

  // filters for location
  const originNameSql = `(originVillage.name LIKE ?) OR (originSector.name LIKE ?) OR (originProvince.name LIKE ?)`;
  const originNameParams = _.fill(Array(3), `%${options.originLocationLabel || ''}%`);
  filters.custom('originLocationLabel', originNameSql, originNameParams);
  // default registration date
  filters.period('period', 'registration_date');
  filters.dateFrom('custom_period_start', 'registration_date');
  filters.dateTo('custom_period_end', 'registration_date');

  const patientGroupStatement = `(
    SELECT COUNT(uuid) FROM patient_assignment where patient_uuid = p.uuid AND patient_group_uuid = ?
  ) = 1`;

  filters.custom('patient_group_uuid', patientGroupStatement);
  filters.equals('debtor_group_uuid', 'group_uuid', 'd');
  filters.equals('sex');
  filters.equals('hospital_no');
  filters.equals('user_id');
  filters.equals('reference', 'text', 'em');

  filters.setOrder('ORDER BY p.registration_date DESC');

  // applies filters and limits to defined sql, get parameters in correct order
  const query = filters.applyQuery(sql);
  const parameters = filters.parameters();

  return db.exec(query, parameters);
}

function patientEntityQuery(detailed) {
  let detailedColumns = '';

  // if the find should included detailed results
  if (detailed) {
    detailedColumns = `
      , proj.abbr, p.father_name, p.mother_name, p.profession, p.employer,
      p.spouse, p.spouse_profession, p.spouse_employer, p.religion, p.marital_status,
      p.phone, p.email, p.address_1, p.address_2, BUID(p.origin_location_id) as origin_location_id,
      BUID(p.current_location_id) as current_location_id, p.registration_date, p.title, p.notes, d.text,
      dg.account_id, BUID(dg.price_list_uuid) as price_list_uuid, dg.is_convention, dg.locked
    `;
  }

  // @TODO Investigate if this origin alias table as 'q' does JOINs on every single patient row
  //       _before_selecting.
  // build the main part of the SQL query
  const sql = `
    SELECT
      BUID(p.uuid) AS uuid, p.project_id, em.text AS reference, p.display_name, BUID(p.debtor_uuid) as debtor_uuid,
      p.sex, p.dob, p.dob_unknown_date, p.registration_date, BUID(d.group_uuid) as debtor_group_uuid, p.hospital_no,
      p.health_zone, p.health_area, u.display_name as userName, originVillage.name as originVillageName, dg.color,
      originSector.name as originSectorName, dg.name AS debtorGroupName, proj.name AS project_name, p.created_at,
      originProvince.name as originProvinceName ${detailedColumns}
    FROM patient AS p
      JOIN project AS proj ON p.project_id = proj.id
      JOIN debtor AS d ON p.debtor_uuid = d.uuid
      JOIN debtor_group AS dg ON d.group_uuid = dg.uuid
      JOIN village as originVillage ON originVillage.uuid = p.origin_location_id
      JOIN sector AS originSector ON originVillage.sector_uuid = originSector.uuid
      JOIN province AS originProvince ON originProvince.uuid = originSector.province_uuid
      JOIN user AS u ON p.user_id = u.id
      JOIN entity_map AS em ON p.uuid = em.uuid
  `;

  return sql;
}

/**
 * @method read
 *
 * @description
 * A multi-parameter function that uses find() to query the database for
 * patient records.  It is the HTTP interface to find().
 *
 * NOTE:  If 'search_name' is given in the query, the approximate search in
 *        findBestNameMatches() is used instead of the normal find().
 *        See the documentation for findBestNameMatches() above for more
 *        information on name approximate search capability.
 *
 * @example
 * // GET /patient/?name={string}&detail={boolean}&limit={number}
 * // GET /patient/?reference={string}&detail={boolean}&limit={number}
 * // GET /patient/?fields={object}
 * // GET /patient
 */
function read(req, res, next) {

  if ('search_name' in req.query) {
    // Handle the best match name queries separately
    return findBestNameMatches(req, res, next);
  }

  return find(req.query)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next);

}

function invoicingFees(req, res, next) {
  const uid = db.bid(req.params.uuid);

  // @todo (OPTIMISATION) Two additional SELECTs to select group uuids can be written as JOINs.
  // eslint-disable-next-line operator-linebreak
  const patientsServiceQuery =

    // get the final information needed to apply invoicing fees to an invoice
    'SELECT DISTINCT '
    + 'invoicing_fee_id, label, description, value, invoicing_fee.created_at '
    + 'FROM '

    // get all of the invoicing fees from patient group subscriptions
    + '(SELECT * '
    + 'FROM patient_group_invoicing_fee '
    + 'WHERE patient_group_invoicing_fee.patient_group_uuid in '

    // find all of the patients groups
    + '(SELECT patient_group_uuid '
    + 'FROM patient_assignment '
    + 'WHERE patient_uuid = ?) '
    + 'UNION '

    // get all of the invoicing fees from debtor group subscriptions
    + 'SELECT * '
    + 'FROM debtor_group_invoicing_fee '
    + 'WHERE debtor_group_uuid = '

    // find the debtor group uuid
    + '(SELECT debtor.group_uuid '
    + 'FROM patient '
    + 'LEFT JOIN debtor '
    + 'ON patient.debtor_uuid = debtor.uuid '
    + 'WHERE patient.uuid = ?)'
    + ') AS patient_services '

    // apply billing service information to rows retrieved from service subscriptions
    + 'LEFT JOIN invoicing_fee '
    + 'ON invoicing_fee_id = invoicing_fee.id';

  db.exec(patientsServiceQuery, [uid, uid])
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(next);

}

function subsidies(req, res, next) {
  const uid = db.bid(req.params.uuid);

  // eslint-disable-next-line operator-linebreak
  const patientsSubsidyQuery =

    // subsidy information required to apply subsidies to an invoice
    'SELECT DISTINCT '
    + 'subsidy_id, label, description, value, subsidy.created_at '
    + 'FROM '

    // get all of subsidies from patient group subscriptions
    + '(SELECT * '
    + 'FROM patient_group_subsidy '
    + 'WHERE patient_group_subsidy.patient_group_uuid in '

    // find all of the patients groups
    + '(SELECT patient_group_uuid '
    + 'FROM patient_assignment '
    + 'WHERE patient_uuid = ?) '
    + 'UNION '

    // get all subsidies from debtor group subscriptions
    + 'SELECT * '
    + 'FROM debtor_group_subsidy '
    + 'WHERE debtor_group_uuid = '

    // find the debtor group uuid
    + '(SELECT group_uuid '
    + 'FROM patient '
    + 'JOIN debtor '
    + 'ON patient.debtor_uuid = debtor.uuid '
    + 'WHERE patient.uuid = ?)'
    + ') AS patient_subsidies '

    // apply subsidy information to rows retrieved from subsidy subscriptions
    + 'LEFT JOIN subsidy '
    + 'ON subsidy_id = subsidy.id';

  db.exec(patientsSubsidyQuery, [uid, uid])
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(next);

}

/**
 * @function getFinancialStatus
 *
 * @description
 * returns the financial activity of the patient.
 */
function getFinancialStatus(req, res, next) {
  const uid = req.params.uuid;
  const data = {};

  lookupPatient(uid)
    .then(patient => {
      _.extend(data, { patient });
      return Debtors.getFinancialActivity(patient.debtor_uuid);
    })
    .then(({ transactions, aggregates }) => {
      _.extend(data, { transactions, aggregates });

      res.status(200).send(data);
    })
    .catch(next);
}

/**
 * @function getDebtorBalance
 *
 * @description
 * returns the patient's debtor balance with the enterprise.  Note that this
 * route provides a "real-time" balance, so it scans both the posting_journal
 * and general_ledger.
 */
function getDebtorBalance(req, res, next) {
  const uid = req.params.uuid;
  lookupPatient(uid)
    .then(patient => Debtors.balance(patient.debtor_uuid))
    .then(([balance]) => {
      res.status(200).json(balance);
    })
    .catch(next);
}

/**
 * @function getStockMovements
 *
 * @description
 * returns the stock Movements to the patient.
 */
function getStockMovements(req, res, next) {
  const uid = req.params.uuid;
  stockMovementByPatient(uid)
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(next);
}

function stockMovementByPatient(patientUuid) {
  const sql = `
      SELECT BUID(sm.document_uuid) AS document_uuid,
      dmi.text AS invoiceReference,
      BUID(sm.depot_uuid) AS depot_uuid, MAX(d.text) as depot_name,
      SUM(sm.quantity * sm.unit_cost) AS value,
      MAX(sm.date) AS date, MAX(dm.text) AS hrReference
    FROM stock_movement AS sm
      JOIN depot AS d ON d.uuid = sm.depot_uuid
      JOIN patient AS p ON p.uuid = sm.entity_uuid
      JOIN document_map AS dm ON dm.uuid = sm.document_uuid
      LEFT JOIN document_map AS dmi ON dmi.uuid = sm.invoice_uuid
    WHERE sm.entity_uuid = ?
    GROUP BY sm.document_uuid
    ORDER BY sm.date DESC
  `;

  return db.exec(sql, [db.bid(patientUuid)]);
}

function stockConsumedPerPatient(patientUuid) {
  const sql = `
    SELECT sm.document_uuid, sm.depot_uuid, sm.date, map.text AS reference_text,
    iv.text AS inventory_text, sm.quantity, sm.unit_cost,
    (sm.unit_cost * sm.quantity) AS total,
    l.label AS lotLabel, un.text AS inventoryUnit
    FROM stock_movement AS sm
      JOIN lot AS l ON l.uuid = sm.lot_uuid
      JOIN inventory AS iv ON iv.uuid = l.inventory_uuid
      JOIN inventory_unit AS un ON un.id = iv.unit_id
      JOIN depot AS d ON d.uuid = sm.depot_uuid
      JOIN patient AS p ON p.uuid = sm.entity_uuid
      JOIN document_map AS map ON map.uuid = sm.document_uuid
    WHERE sm.entity_uuid = ?
    ORDER BY sm.date, sm.reference desc, iv.text asc;
  `;

  return db.exec(sql, [db.bid(patientUuid)]);
}
