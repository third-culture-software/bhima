angular.module('bhima.components')
  .component('bhFilters', {
    templateUrl : 'modules/templates/bhFilters.tmpl.html',
    controller  : bhFiltersController,
    bindings    : {
      filters        : '<',
      onRemoveFilter : '&',
    },
  });

bhFiltersController.$inject = ['$filter', '$translate'];

/**
 *
 * @param $filter
 * @param $translate
 */
function bhFiltersController($filter, $translate) {
  const $ctrl = this;

  // formats the $viewValue according to any filters passed in
  $ctrl.$onChanges = function onChanges(changes) {
    if (!changes.filters) { return; }

    const filters = changes.filters.currentValue;

    if (!filters) { return; }

    filters.defaultFilters.forEach(mapDisplayValues);
    filters.customFilters.forEach(mapDisplayValues);
  };

  /**
   *
   * @param filter
   */
  function mapDisplayValues(filter) {
    filter.displayValue = filter._displayValue || filter._value;
    if (filter._valueFilter) {
      if (filter._valueFilter === 'boolean') {
        filter.displayValue = $translate.instant(filter._value ? 'FORM.LABELS.YES' : 'FORM.LABELS.NO');
      } else {
        filter.displayValue = $filter(filter._valueFilter)(filter.displayValue);
      }
    }
  }
}
