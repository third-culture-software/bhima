angular.module('bhima.services')
  .service('SearchModalUtilService', SearchModalUtilService);

SearchModalUtilService.$inject = [];

/**
 *
 */
function SearchModalUtilService() {
  const service = this;

  service.getChanges = (searchQueries, changes, displayValues, lastDisplayValues) => {

    // push all searchQuery values into the changes array to be applied
    angular.forEach(searchQueries, (value, key) => {
      if (angular.isDefined(value)) {

        const hasDisplayValue = angular.isDefined(displayValues[key]);
        const hasLastDisplayValue = angular.isDefined(lastDisplayValues[key]);

        let displayValue = value;
        if (hasDisplayValue) {
          displayValue = displayValues[key];
        } else if (hasLastDisplayValue) {
          displayValue = lastDisplayValues[key];
        }

        changes.post({ key, value, displayValue });
      }
    });

    return changes.getAll();
  };
}
