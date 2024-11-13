const _ = require('lodash');
const moment = require('moment');
const db = require('../../../lib/db');
const ReportManager = require('../../../lib/ReportManager');
const surveyForm = require('../surveyForm');
const dataCollectorManagement = require('../dataCollectorManagement');
const displayMetaData = require('../displayMetadata');

const template = './server/controllers/admin/metadataReport/metadatacard.handlebars';
const templateReport = './server/controllers/admin/metadataReport/metadataReport.handlebars';

const DEFAULT_OPTS = {
  orientation     : 'landscape',
  filename        : 'TREE.DISPLAY_METADATA',
  csvKey          : 'metadata',
};

function metadataCard(req, res, next) {
  const options = _.clone(req.query);

  const data = {};
  const params = {
    uuid : options.uuid,
  };

  if (typeof options.patient === 'string') {
    data.patient = JSON.parse(options.patient);
  }

  let report;
  _.extend(options, DEFAULT_OPTS);

  // set up the report with report manager
  try {
    report = new ReportManager(template, req.session, options);
  } catch (e) {
    next(e);
    return;
  }

  const sql = `
    SELECT BUID(sd.uuid) AS uuid, sd.date AS surveyDate, dcm.label, dcm.version_number, u.display_name AS userName,
    sd.data_collector_management_id
    FROM survey_data AS sd
    JOIN data_collector_management AS dcm ON dcm.id = sd.data_collector_management_id
    JOIN user AS u ON u.id = sd.user_id
    WHERE sd.uuid = ?
  `;

  const sqlData = `
    SELECT BUID(sd.uuid) AS uuid, sd.date AS dateSurvey, sd.data_collector_management_id, sd.user_id,
    BUID(sdi.uuid) AS survey_data_item_uuid, sdi.value,
    GROUP_CONCAT(IF (clm.label IS NULL, sdi.value, clm.label) SEPARATOR ', ') AS datavalue,
    sf.id AS survey_form_id, sf.name AS columnName, sf.label AS columnLabel, ms.patient_uuid
    FROM survey_data AS sd
    JOIN survey_data_item AS sdi ON sdi.survey_data_uuid = sd.uuid
    JOIN survey_form AS sf ON sf.id = sdi.survey_form_id
    LEFT JOIN choices_list_management clm ON (clm.id = sdi.value AND (sf.type = 3 OR sf.type = 4))
    LEFT JOIN medical_sheet AS ms ON ms.survey_data_uuid = sd.uuid
    WHERE sd.uuid = ?
    GROUP BY sf.id
  `;

  const dbPromises = [
    db.one(sql, [db.bid(params.uuid)]),
    db.exec(sqlData, [db.bid(params.uuid)]),
  ];

  Promise.all(dbPromises)
    .then(([survey, surveyData]) => {
      data.survey = survey;
      data.surveyData = surveyData;

      return surveyForm.getSurveyFormElement({ data_collector_management_id : survey.data_collector_management_id });
    })
    .then((surveyFormElements) => {
      surveyFormElements.forEach(element => {
        data.surveyData.forEach(item => {
          if (element.name === item.columnName) {
            // Delete 'client' in the beggining of path
            if (element.typeForm === 'image') {
              element.value = item.datavalue.replace('client', '');
            } else {
              element.value = item.datavalue;
            }
          }
        });
      });

      data.surveyFormElements = surveyFormElements;

      return report.render(data);
    })
    .then(result => {
      res.set(result.headers).send(result.report);
    });
}

function reportMetadata(req, res, next) {
  const params = req.query;
  const filterQuery = [];
  const includePatientData = parseInt(params.includePatientData, 10);

  if (!params.downloadMode) {
    params.changes = {};
    params.changes.loggedChanges = [];

    // Include Patient DATA
    if (includePatientData) {
      params.changes.includePatientData = includePatientData;
    }

    const queryLength = Object.keys(req.query).length;
    if (queryLength) {
      Object.keys(req.query).forEach((key) => {
        if (key === 'data_collector_id') {
          params.data_collector_management_id = req.query[key];
        } else if (key === 'searchDateFrom') {
          params.changes[key] = JSON.parse(req.query[key]);

          Object.keys(params.changes[key]).forEach((index) => {
            filterQuery.push({ key : index, value : moment(params.changes[key][index]).format('DD/MM/YYYY') });
          });

        } else if (key === 'searchDateTo') {
          params.changes[key] = JSON.parse(req.query[key]);
          filterQuery.forEach(filter => {
            Object.keys(params.changes[key]).forEach((index) => {
              if (filter.key === index) {
                filter.value = `[ ${filter.value} - ${moment(params.changes[key][index]).format('DD/MM/YYYY')} ]`;
              }
            });
          });
        } else if (key === 'multipleChoice') {
          params.changes[key] = JSON.parse(req.query[key]);

          Object.keys(params.changes[key]).forEach((index) => {
            filterQuery.push({ key : index, value : params.changes[key][index].join(', ') });
          });
        } else if (key === 'loggedChanges') {
          const loggedChanges = JSON.parse(req.query[key]);
          const loggedChangesLn = Object.keys(loggedChanges).length;

          if (loggedChangesLn) {
            Object.keys(loggedChanges).forEach((index) => {
              params.changes.loggedChanges.push({ key : index, value : loggedChanges[index] });
              if (loggedChanges[index]) {
                filterQuery.push({ key : index, value : loggedChanges[index] });
              }
            });
          }
        }
      });
    }
  }

  const data = {};
  data.filterQuery = filterQuery;

  if (typeof params.filterClient === 'string') {
    const filterClient = JSON.parse(params.filterClient);
    data.filterClient = [filterClient];
  } else if (typeof params.filterClient === 'object') {
    params.filterClient.forEach((item, index) => {
      params.filterClient[index] = JSON.parse(item);
    });
    data.filterClient = params.filterClient;
  }

  if (typeof params.patient === 'string') {
    data.patient = JSON.parse(params.patient);
  }

  let report;

  const options = {
    orientation   : 'landscape',
    lang          : req.query.lang,
    renderer      : req.query.renderer,
    filename      : 'TREE.DATA_KIT_REPORT',
    csvKey        : 'rows',
  };

  _.defaults(params, options);
  // set up the report with report manager

  try {
    report = new ReportManager(templateReport, req.session, params);
  } catch (e) {
    next(e);
    return;
  }

  displayMetaData.lookupData(params)
    .then(rows => {
      rows.columns = rows.columns.filter(item => item.statusReport === 1);

      data.filterQuery.forEach(filter => {
        rows.columns.forEach(columns => {
          if (filter.key === columns.field) {
            filter.key = columns.displayName;
          }
        });
      });

      // data.filterQuery
      data.resultFound = rows.surveyData.length;

      rows.surveyData.forEach(surveyData => {
        surveyData.rowValue = [];
        rows.columns.forEach(columns => {
          Object.keys(surveyData).forEach((key) => {
            if (columns.field === key) {
              if (columns.type === 'date') {
                surveyData.rowValue.push({ value : moment(surveyData[key]).format('DD/MM/YYYY HH:mm') });
              } else {
                surveyData.rowValue.push({ value : surveyData[key] });
              }
            }
          });
        });
      });

      data.rows = rows;

      return dataCollectorManagement.lookupDataCollectorManagement(params.data_collector_management_id);
    })
    .then(dataCollector => {
      data.dataCollector = dataCollector;
      return report.render(data);
    })
    .then(result => {
      res.set(result.headers).send(result.report);
    });
}

// Display Metadata Card
exports.metadataCard = metadataCard;
exports.reportMetadata = reportMetadata;
