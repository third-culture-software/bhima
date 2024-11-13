/**
* Fill form Controller
*
* This controller exposes an API to the client for reading and writing
* for Fill in the forms of the data
*/
const moment = require('moment');
const db = require('../../lib/db');
const util = require('../../lib/util');
const surveyForm = require('./surveyForm');
const { uuid } = require('../../lib/util');

// POST /fill_from
function create(req, res, next) {
  const data = req.body;

  let medicalSheet;
  const patientUuid = req.body.patient_uuid || null;
  if (req.body.patient_uuid) {
    delete req.body.patient_uuid;
  }

  const dataCollectorManagementId = {
    data_collector_management_id : data.data_collector_management_id,
  };

  const surveyUuid = uuid();
  surveyForm.getSurveyFormElement(dataCollectorManagementId)
    .then((survey) => {
      // Data Survey
      const surveyDataItem = [];
      Object.keys(data).forEach((key) => {
        survey.forEach(s => {

          if (key === s.name) {
            if (s.typeForm === 'date') {
              data[key] = moment(data[key]).format('YYYY-MM-DD');
            } else if (s.typeForm === 'time') {
              data[key] = moment(data[key]).format('HH:mm');
            } else if (s.typeForm === 'select_multiple') {
              // Set Element for multiple choice
              data[key].forEach((element) => {
                surveyDataItem.push([
                  db.bid(util.uuid()),
                  db.bid(surveyUuid),
                  s.id,
                  s.name,
                  element,
                ]);
              });
            }

            if (s.typeForm === 'calculation') {
              data[key] = surveyForm.getCalculation(s, req.body);
            }

            // Put In DataSurvey
            if (s.typeForm !== 'select_multiple' && s.typeForm !== 'image') {
              surveyDataItem.push([
                db.bid(util.uuid()),
                db.bid(surveyUuid),
                s.id,
                s.name,
                data[key],
              ]);
            }
          }
        });
      });

      if (patientUuid) {
        medicalSheet = {
          survey_data_uuid : db.bid(surveyUuid),
          patient_uuid : db.bid(patientUuid),
        };
      }

      const transaction = db.transaction();
      const sqlSurveyData = `INSERT INTO survey_data SET ?`;
      const surveyData = {
        uuid : db.bid(surveyUuid),
        data_collector_management_id : data.data_collector_management_id,
        user_id : req.session.user.id,
      };

      const sqlSurveyDataItem = `INSERT INTO survey_data_item
        (uuid, survey_data_uuid, survey_form_id, survey_form_label, value) VALUES ?`;

      const saveLinkSurveyPatient = `
        INSERT INTO medical_sheet SET ?`;

      transaction
        .addQuery(sqlSurveyData, [surveyData])
        .addQuery(sqlSurveyDataItem, [surveyDataItem]);

      if (patientUuid) {
        transaction
          .addQuery(saveLinkSurveyPatient, [medicalSheet]);
      }

      return transaction.execute();
    })
    .then(() => {
      res.status(201).json({ uuid : surveyUuid });
    })
    .catch(next)
    

}

function uploadImage(req, res, next) {
  const sqlSurveyDataItem = `INSERT INTO survey_data_item SET ?`;

  const surveyDataItem = {
    uuid : db.bid(util.uuid()),
    survey_data_uuid : db.bid(req.params.uuid),
    survey_form_id : req.params.key,
    value : req.files[0].link,
  };

  db.exec(sqlSurveyDataItem, [surveyDataItem])
    .then(() => {
      res.status(201);
    })
    .catch(next)
    
}

function restoreImage(req, res, next) {
  const sqlSurveyDataItem = `INSERT INTO survey_data_item SET ?`;
  const surveyDataItem = {
    uuid : db.bid(util.uuid()),
    survey_data_uuid : db.bid(req.body.data.uuid),
    survey_form_id : req.body.data.key,
    value : req.body.data.old,
  };

  db.exec(sqlSurveyDataItem, [surveyDataItem])
    .then(() => {
      res.status(201);
    })
    .catch(next)
    
}

/**
* GET /survey_form/:ID
*
* Returns the detail of a single survey_form
*/
function detail(req, res, next) {
  const surveyUuid = req.params.uuid;

  lookupFillForm(surveyUuid)
    .then((record) => {
      res.status(200).json(record);
    })
    .catch(next)
    
}

function lookupFillForm(surveyUuid) {
  const sql = `
    SELECT BUID(sdi.uuid) AS survey_data_item_uuid, sdi.survey_form_id, sdi.survey_form_label,
    BUID(sdi.survey_data_uuid) AS survey_data_uuid, sdi.value
    FROM survey_data_item AS sdi
    WHERE sdi.survey_data_uuid = ?
  `;

  return db.exec(sql, [db.bid(surveyUuid)]);
}

// PUT /fill_form /:uuid
function update(req, res, next) {
  let medicalSheet;

  const dataCollectorManagementId = {
    data_collector_management_id : req.body.new.data_collector_management_id,
  };

  if (req.body.new.patient_uuid) {
    medicalSheet = {
      survey_data_uuid : db.bid(req.params.uuid),
      patient_uuid : db.bid(req.body.new.patient_uuid),
    };
  }

  const newData = req.body.new;
  const oldData = req.body.old;

  const surveyUuid = req.params.uuid;

  surveyForm.getSurveyFormElement(dataCollectorManagementId)
    .then((survey) => {
      // Data Survey
      const surveyNewDataItem = [];
      const surveyOldDataItem = [];
      const logUuid = uuid();

      Object.keys(newData).forEach((key) => {
        survey.forEach(s => {
          if (key === s.name) {
            if (s.typeForm === 'date') {
              newData[key] = moment(newData[key]).format('YYYY-MM-DD');
              newData[key] = moment(newData[key]).format('YYYY-MM-DD');
            } else if (s.typeForm === 'time') {
              newData[key] = moment(newData[key]).format('HH:mm');
            } else if (s.typeForm === 'select_multiple') {
              // Set Element for multiple choice
              newData[key].forEach((element) => {
                surveyNewDataItem.push([
                  db.bid(util.uuid()),
                  db.bid(surveyUuid),
                  s.id,
                  s.name,
                  element,
                ]);
              });
            }

            if (s.typeForm === 'calculation') {
              newData[key] = surveyForm.getCalculation(s, newData);
            }

            // Put In DataSurvey
            if (s.typeForm !== 'select_multiple' && s.typeForm !== 'image') {
              surveyNewDataItem.push([
                db.bid(util.uuid()),
                db.bid(surveyUuid),
                s.id,
                s.name,
                newData[key],
              ]);
            }
          }
        });
      });

      Object.keys(oldData).forEach((key) => {
        survey.forEach(s => {
          if (key === s.name) {
            if (s.typeForm === 'date') {
              oldData[key] = moment(oldData[key]).format('YYYY-MM-DD');
              oldData[key] = moment(oldData[key]).format('YYYY-MM-DD');
            } else if (s.typeForm === 'time') {
              oldData[key] = moment(oldData[key]).format('HH:mm');
            } else if (s.typeForm === 'select_multiple') {
              // Set Element for multiple choice
              oldData[key].forEach((element) => {
                surveyOldDataItem.push([
                  db.bid(util.uuid()),
                  db.bid(logUuid),
                  s.id,
                  s.name,
                  db.bid(surveyUuid),
                  req.session.user.id,
                  'updated',
                  element,
                ]);
              });
            }

            if (s.typeForm !== 'select_multiple') {
              surveyOldDataItem.push([
                db.bid(util.uuid()),
                db.bid(logUuid),
                s.id,
                s.name,
                db.bid(surveyUuid),
                req.session.user.id,
                'updated',
                oldData[key],
              ]);
            }
          }
        });
      });

      const transaction = db.transaction();
      const deleteSurveyDataItem = `
        DELETE FROM survey_data_item WHERE survey_data_uuid = ?;
      `;
      const sqlSurveyDataItem = `INSERT INTO survey_data_item
        (uuid, survey_data_uuid, survey_form_id, survey_form_label, value) VALUES ?`;

      const sqlSurveyDataLog = `INSERT INTO survey_data_log
        (uuid, log_uuid, survey_form_id, survey_form_label, survey_data_uuid, user_id, status, value) VALUES ?`;

      const saveLinkSurveyPatient = `INSERT INTO medical_sheet SET ?`;

      if (req.body.new.patient_uuid) {
        transaction
          .addQuery(saveLinkSurveyPatient, [medicalSheet]);
      }

      transaction
        .addQuery(deleteSurveyDataItem, [db.bid(surveyUuid)])
        .addQuery(sqlSurveyDataItem, [surveyNewDataItem])
        .addQuery(sqlSurveyDataLog, [surveyOldDataItem]);
      return transaction.execute();
    })
    .then(() => {
      res.status(201).json({ uuid : surveyUuid });
    })
    .catch(next)
    
}
// create a new survey data
exports.create = create;
// get details of a survey form
exports.detail = detail;
// Upload Image
exports.uploadImage = uploadImage;
// Updated survey data with a backup of old data
exports.update = update;
// Restore image inchanged
exports.restoreImage = restoreImage;
