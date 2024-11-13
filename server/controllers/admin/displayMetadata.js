/**
* DISPLAY METADATA Controller
*
* This controller exposes an API to the client for reading and writing DISPLAY METADATA
*/
const moment = require('moment');
const FilterParser = require('../../lib/filter');
const db = require('../../lib/db');

let surveyFormElement = [];

function lookupData(params) {
  if (typeof params.changes === 'string') {
    params.changes = JSON.parse(params.changes);
  }

  let paramDateFrom = {};
  let paramDateTo = {};
  let paramsMultipleChoice = {};
  const findParameters = {};
  let includePatientData = 0;

  if (params.changes) {
    if (params.changes.includePatientData) {
      includePatientData = parseInt(params.changes.includePatientData, 10);
    }
  }

  if (params.changes) {
    if (params.changes.searchDateFrom) {
      paramDateFrom = params.changes.searchDateFrom;
    }

    if (params.changes.searchDateTo) {
      paramDateTo = params.changes.searchDateTo;
    }

    if (params.changes.multipleChoice) {
      paramsMultipleChoice = params.changes.multipleChoice;
    }

    if (params.changes.loggedChanges) {
      params.changes.loggedChanges.forEach(item => {
        if (item.key !== 'data_collector_id') {
          findParameters[item.key] = item.value;
        }
      });
    }
  }

  const filters1 = new FilterParser(params, { tableAlias : 's' });

  const sqlSurveyForm = `
    SELECT s.id, s.data_collector_management_id, s.type, s.name AS surveyName,
    s.label AS surveyLabel
    FROM survey_form AS s
  `;

  filters1.equals('data_collector_management_id');
  filters1.setOrder('ORDER BY s.id ASC');

  const query1 = filters1.applyQuery(sqlSurveyForm);
  const parameters1 = filters1.parameters();

  return db.exec(query1, parameters1)
    .then(surveyForm => {
      surveyFormElement = surveyForm;
      let sqlColumn = '';
      let filterCondition = ``;

      const parametersLength = Object.keys(findParameters).length;
      const paramDateFromLength = Object.keys(paramDateFrom).length;
      const paramDateToLength = Object.keys(paramDateTo).length;
      const paramsMultipleChoiceLength = Object.keys(paramsMultipleChoice).length;

      const havingCondition = (parametersLength || paramDateFromLength || paramsMultipleChoiceLength) ? 'HAVING ' : '';

      if (parametersLength) {
        let indexA = parametersLength;

        Object.keys(findParameters).forEach((key) => {
          indexA--;
          const andCondition = (indexA > 0) ? `AND` : ``;

          surveyFormElement.forEach(element => {
            if (key === element.surveyName) {
              if (element.type === '1' || element.type === '9') {
                filterCondition += ` ${element.surveyName} = '${findParameters[key]}' ${andCondition}`;
              } else if (
                element.type === '2' || element.type === '7' || element.type === '10') {
                const checkIfApostrophes = findParameters[key].indexOf('\'');
                if (checkIfApostrophes !== (-1)) {
                  // This is a hack to avoid apostrophes in the search parameter
                  findParameters[key] = findParameters[key].replace(`'`, `''`);
                }

                filterCondition += ` ${element.surveyName} LIKE '%${findParameters[key]}%' ${andCondition}`;
              } else if (element.type === '3' || element.type === '4') {
                filterCondition += ` ${element.surveyName} = '${findParameters[key]}' ${andCondition}`;
              }
            }
          });
        });
      }

      if (paramDateFromLength) {
        if (parametersLength) {
          filterCondition += ` AND `;
        }

        let indexB = paramDateFromLength;
        Object.keys(paramDateFrom).forEach((key) => {
          indexB--;
          const andCondition = (indexB > 0) ? ` AND ` : ``;
          const dateFrom = moment(paramDateFrom[key]).format('YYYY-MM-DD');

          filterCondition += `DATE(${key}) >= DATE('${dateFrom}') ${andCondition}`;
        });

        // Pour les dates from
        filterCondition += ` AND `;
        let indexC = paramDateToLength;
        Object.keys(paramDateTo).forEach((key) => {
          indexC--;
          const andCondition = (indexC > 0) ? ` AND ` : ``;
          const dateTo = moment(paramDateTo[key]).format('YYYY-MM-DD');

          filterCondition += `DATE(${key}) <= DATE('${dateTo}') ${andCondition}`;
        });
      }

      if (paramsMultipleChoiceLength) {
        if (parametersLength || paramDateFromLength) {
          filterCondition += ` AND `;
        }

        let indexC = paramsMultipleChoiceLength;
        Object.keys(paramsMultipleChoice).forEach((key) => {
          indexC--;
          const andCondition = (indexC > 0) ? `AND` : ``;
          let orFilter = ``;
          for (let i = 0; i < paramsMultipleChoice[key].length; i++) {
            const orCondition = (i < (paramsMultipleChoice[key].length - 1)) ? `OR` : ``;
            orFilter += ` ${key} LIKE '%${paramsMultipleChoice[key][i]}%' ${orCondition} `;
          }

          filterCondition += `((${orFilter})) ${andCondition}`;
        });
      }

      const filterPatient = params.patient_uuid ? ` AND ms.patient_uuid = HUID('${params.patient_uuid}') ` : '';

      surveyForm.forEach(item => {
        sqlColumn += `
          , MAX(IF(transpose.columnName = '${item.surveyName}', transpose.datavalue, NULL)) AS ${item.surveyName}`;
      });

      const sqlSurveyData = `
        SELECT uuid, patient_name, transpose.user_id, transpose.user_name, BUID(patient_uuid) AS patient_uuid,
        transpose.dateSurvey, transpose.data_collector_management_id ${sqlColumn}
        FROM (
          SELECT BUID(sd.uuid) AS uuid, p.display_name AS patient_name, sd.date AS dateSurvey,
          sd.data_collector_management_id, sd.user_id, u.display_name AS user_name,
          BUID(sdi.uuid) AS survey_data_item_uuid, sdi.value,
          GROUP_CONCAT(IF (clm.label IS NULL, sdi.value, clm.label) SEPARATOR ', ') AS datavalue,
          sf.id AS survey_form_id, sf.name AS columnName, sf.label AS columnLabel, ms.patient_uuid
          FROM survey_data AS sd
          JOIN survey_data_item AS sdi ON sdi.survey_data_uuid = sd.uuid
          JOIN survey_form AS sf ON sf.id = sdi.survey_form_id
          JOIN user AS u ON u.id = sd.user_id
          LEFT JOIN choices_list_management clm ON (clm.id = sdi.value AND (sf.type = 3 OR sf.type = 4))
          LEFT JOIN medical_sheet AS ms ON ms.survey_data_uuid = sd.uuid
          LEFT JOIN patient AS p ON p.uuid = ms.patient_uuid
          WHERE sd.is_deleted <> 1 AND sd.data_collector_management_id = ${params.data_collector_management_id}
          ${filterPatient}
          GROUP BY sd.uuid, sf.id
        ) AS transpose
        GROUP BY transpose.uuid ${havingCondition} ${filterCondition}
        ORDER BY dateSurvey ASC
      `;

      return db.exec(sqlSurveyData);
    })
    .then(surveyData => {
      const columns = [];

      columns.push({
        field : 'dateSurvey',
        displayName : 'TABLE.COLUMNS.DATE',
        headerCellFilter : 'translate',
        type : 'date',
        statusReport : 1,
        cellTemplate : 'modules/display_metadata/templates/date.cell.html',
      });

      if (includePatientData) {
        columns.push({
          field : 'patient_name',
          displayName : 'TABLE.COLUMNS.PATIENT_NAME',
          headerCellFilter : 'translate',
          cellTemplate : '/modules/display_metadata/templates/patient.cell.html',
          statusReport : 1,
        });
      }

      surveyFormElement.forEach(element => {
        if (element.type === '8') {
          columns.push({
            field : element.surveyName,
            displayName : element.surveyLabel,
            enableFiltering : true,
            statusReport : 0,
            cellTemplate : '<img width="50px" ng-src="{{grid.getCellValue(row, col)}}" lazy-src>',
          });

        } else if (element.type === '6') {
          columns.push({
            field : element.surveyName,
            displayName : element.surveyLabel,
            enableFiltering : true,
            type : 'date',
            statusReport : 1,
            cellTemplate :
              '<span style="text-align: center">{{ grid.appScope.format(grid.getCellValue(row, col))}}</span>',
          });
        } else if (element.type !== '5' && element.type !== '8' && element.type !== '6') {
          columns.push({
            field : element.surveyName,
            displayName : element.surveyLabel,
            statusReport : 1,
            enableFiltering : true,
          });
        }
      });

      columns.push(
        {
          field : 'user_name',
          displayName : 'TABLE.COLUMNS.REGISTERED_BY',
          headerCellFilter : 'translate',
          cellTemplate : '/modules/display_metadata/templates/user.cell.html',
          statusReport : 1,
        }, {
          field : 'action',
          displayName : '',
          width : 100,
          enableFiltering : 'false',
          statusReport : 0,
          cellTemplate : '/modules/display_metadata/templates/action.cell.html',
        },
      );

      const dataSurvey = {
        columns,
        surveyData,
      };

      return dataSurvey;
    });

}

function list(req, res, next) {
  const params = req.query;

  lookupData(params)
    .then((dataSurvey) => {
      res.status(200).json(dataSurvey);
    })
    .catch(next)
    

}

// DELETE /display_metadata/:uuid
function remove(req, res, next) {
  const sql = `UPDATE survey_data SET is_deleted = 1 WHERE uuid = ?;`;

  db.exec(sql, [db.bid(req.params.uuid)])
    .then(() => {
      res.status(204).json();
    })
    .catch(next)
    
}

// get list of Display Metadata
exports.list = list;

// Delete a Metadata
exports.delete = remove;

// lookupData
exports.lookupData = lookupData;
