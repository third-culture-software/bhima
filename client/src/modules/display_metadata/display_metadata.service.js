angular.module('bhima.services')
  .service('DisplayMetadataService', DisplayMetadataService);

DisplayMetadataService.$inject = ['PrototypeApiService', '$uibModal', 'moment',
  '$translate', '$httpParamSerializer', 'LanguageService'];

/**
 * @class DisplayMetadataService
 * @extends PrototypeApiService
 *
 * @description
 * Encapsulates common requests to the /display_metadata/ URL.
 */
function DisplayMetadataService(Api, Modal, moment, $translate, $httpParamSerializer, Languages) {
  const service = new Api('/display_metadata/');
  service.listSurveyformtype = listSurveyformtype;
  service.openSearchModal = openSearchModal;
  service.displayFilters = displayFilters;
  service.download = download;
  service.removeFilters = removeFilters;

  function download(opts) {
    const options = {
      renderer : opts.renderer,
      changes : opts.changes,
      lang : Languages.key,
      patient_uuid : opts.patient_uuid,
      downloadMode : true,
      data_collector_management_id : opts.data_collector_management_id,
      filterClient : opts.filterClient,
      patient : opts.patient,
    };

    // return  serialized options
    return $httpParamSerializer(options);
  }

  function listSurveyformtype() {
    const url = 'listSurveyformtype';
    return Api.read.call(service, url);
  }

  /**
   * @function openSearchModal
   * @description
   * This functions opens the search modal form for Display Metadata registry.
   */
  function openSearchModal(filters) {
    return Modal.open({
      templateUrl : 'modules/display_metadata/modals/search.modal.html',
      size : 'md',
      animation : false,
      keyboard : false,
      backdrop : 'static',
      controller : 'DisplayMetadataSearchModalController as $ctrl',
      resolve : {
        filters : function filtersProvider() { return filters; },
      },
    }).result;
  }

  function displayFilters(survey, search) {

    const surveyMap = new Map(survey.map(item => ([item.name, item])));
    const dateLabel = $translate.instant('FORM.LABELS.DATE');
    const customFilters = [];

    if (search) {
      if (search.searchDateFrom) {
        const dateFromLength = Object.keys(search.searchDateFrom).length;
        if (dateFromLength) {
          Object.keys(search.searchDateFrom).forEach((key) => {
            if (key === 'dateSurvey') {
              const formatDateFrom = moment(search.searchDateFrom[key]).format('DD MMM YYYY');
              const formatDateTo = moment(search.searchDateTo[key]).format('DD MMM YYYY');
              const dateFilters = `[${formatDateFrom} - ${formatDateTo}]`;

              customFilters.push(
                {
                  _key : 'dateSurvey',
                  _label : dateLabel,
                  _displayValue : dateFilters,
                  _isCacheable : true,
                  displayValue : dateFilters,
                  comparitorLabel : ':',
                },
              );
            }

            const item = surveyMap.get(key);
            if (item) {
              const formatDateFrom = moment(search.searchDateFrom[key]).format('DD MMM YYYY');
              const formatDateTo = moment(search.searchDateTo[key]).format('DD MMM YYYY');
              const dateFormats = `[${formatDateFrom} - ${formatDateTo}]`;

              customFilters.push(
                {
                  _key : key,
                  _label : item.label,
                  _displayValue : dateFormats,
                  _isCacheable : true,
                  displayValue : dateFormats,
                  comparitorLabel : ':',
                },
              );
            }
          });
        }
      }

      if (search.loggedChanges) {
        search.loggedChanges.forEach(element => {
          const item = surveyMap.get(element.key);
          if (item) {
            customFilters.push(
              {
                _key : item.name,
                _label : item.label,
                _displayValue : element.value,
                _isCacheable : true,
                displayValue : element.value,
                comparitorLabel : ':',
              },
            );
          }
        });
      }

      if (search.multipleChoice) {
        const multipleChoiceLength = Object.keys(search.multipleChoice).length;
        if (multipleChoiceLength) {
          Object.keys(search.multipleChoice).forEach((key) => {
            const item = surveyMap.get(key);
            if (item) {
              let multiChoice = '';
              for (let i = 0; i < search.multipleChoice[key].length; i++) {
                multiChoice += ` ${search.multipleChoice[key][i]}; `;
              }

              customFilters.push(
                {
                  _key : key,
                  _label : item.label,
                  _displayValue : multiChoice,
                  _isCacheable : true,
                  displayValue : multiChoice,
                  comparitorLabel : ':',
                },
              );
            }
          });
        }
      }
    }

    return customFilters;
  }

  function removeFilters(key, filters) {
    if (filters.loggedChanges) {
      filters.loggedChanges.forEach((item, index) => {
        if (key === item.key) {
          filters.loggedChanges.splice(index, 1);
        }
      });
    }

    if (filters.searchDateFrom) {
      Object.keys(filters.searchDateFrom).forEach((keyfilters) => {
        if (key === keyfilters) {
          delete filters.searchDateFrom[keyfilters];
          delete filters.searchDateTo[keyfilters];
        }
      });
    }

    if (filters.multipleChoice) {
      Object.keys(filters.multipleChoice).forEach((keyfilters) => {
        if (key === keyfilters) {
          delete filters.multipleChoice[keyfilters];
        }
      });
    }

    return filters;
  }

  return service;
}
