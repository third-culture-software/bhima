angular.module('bhima.services')
  .service('FilterService', FilterService);

function FilterService() {
  function FilterList() {
    // initialise internal state
    this._defaultFilters = [];
    this._customFilters = [];
    this._filterIndex = {};
  }

  FilterList.prototype.resetFilterState = function resetFilterState(key) {
    this._filterIndex[key].setValue(null, null);
  };

  FilterList.prototype._resetCustomFilters = function resetCustomFilters() {
    this._filterActiveFilters().forEach(filter => {
      // only by default remove custom values
      if (!filter._isDefault) {
        this.resetFilterState(filter._key);
      }
    });
  };

  // @TODO registerDefaultFilter and registerCustomFilter could use the same underlying function
  //       with a toggle between the array to populate and the default value
  FilterList.prototype.registerDefaultFilters = function registerDefaultFilters(filterDefinitions = []) {
    const formattedFilters = filterDefinitions.map(filterDefinition => {
      const filter = new Filter(
        filterDefinition.key,
        filterDefinition.label,
        filterDefinition.valueFilter,
        filterDefinition.comparitor,
      );

      filter.setDefault(true);

      if (angular.isDefined(filterDefinition.defaultValue)) {
        filter.setValue(filterDefinition.defaultValue);
      }

      if (angular.isDefined(filterDefinition.cacheable)) {
        filter.setCacheable(filterDefinition.cacheable);
      }

      return filter;
    });

    // update index
    this._indexList(this._filterIndex, formattedFilters);
    this._defaultFilters = this._defaultFilters.concat(formattedFilters);
  };

  FilterList.prototype.registerCustomFilters = function registerCustomFilters(filterDefinitions) {
    const formattedFilters = filterDefinitions.map(filterDefinition => {
      const filter = new Filter(
        filterDefinition.key,
        filterDefinition.label,
        filterDefinition.valueFilter,
        filterDefinition.comparitor,
      );

      filter.setDefault(false);

      if (angular.isDefined(filterDefinition.cacheable)) {
        filter.setCacheable(filterDefinition.cacheable);
      }

      return filter;
    });

    // update index
    this._indexList(this._filterIndex, formattedFilters);
    this._customFilters = this._customFilters.concat(formattedFilters);
  };

  // assigns the value of a filter, a filter with a value will be actively used
  // during the HTTP/ UI export process
  FilterList.prototype.assignFilter = function assignFilter(key, value, displayValue) {
    this._filterIndex[key].setValue(value, displayValue);
  };

  // accepts an array of key : filterValue objects that are assigned
  // [
  // { key : value },
  // { key : value }
  // ]
  FilterList.prototype.assignFilters = function assignFilters(valueList) {
    valueList.forEach(valueMap => {
      this.assignFilter(valueMap.key, valueMap.value, valueMap.displayValue, valueMap.comparitor);
    });

    /**
     * In case there are period='allTime' and custom_period_start or custom_period_end
     * just considere period='allTime'
     */
    alltimeOverCustomFilter.call(this);
  };

  function alltimeOverCustomFilter() {
    const alltime = this._filterIndex.period && this._filterIndex.period._value === 'allTime';
    const customPeriodStart = this._filterIndex.custom_period_start && this._filterIndex.custom_period_start._value;
    const customPeriodEnd = this._filterIndex.custom_period_end && this._filterIndex.custom_period_end._value;

    if (alltime && customPeriodStart) {
      this.resetFilterState('custom_period_start');
    }

    if (alltime && customPeriodEnd) {
      this.resetFilterState('custom_period_end');
    }
  }

  // alias for `assignFilters`, clears the currently active filters before
  // calling the referenced method
  FilterList.prototype.replaceFilters = function replaceFilters(valueList) {
    this._resetCustomFilters();
    this.assignFilters(valueList);
  };

  // uses angular.copy() to break references to old values
  FilterList.prototype.replaceFiltersFromState = function replaceFiltersFromState(stateFilterList) {
    const changes = angular.copy(stateFilterList);
    this.replaceFilters(changes);
  };

  // return filters for the view - this method will always be compatible with the bhFilter component
  FilterList.prototype.formatView = function formatView() {
    const activeFilters = this._filterActiveFilters();
    const activeKeys = activeFilters.map(filter => filter._key);

    function keysInActive(filter) {
      return activeKeys.includes(filter._key);
    }

    // parse into two lists
    return {
      defaultFilters : this._defaultFilters.filter(keysInActive),
      customFilters : this._customFilters.filter(keysInActive),
    };
  };

  // format filters for the server
  // sendClientTimestamp - this will send an attribute hidden to the user
  // returns a JSON object with active filters
  FilterList.prototype.formatHTTP = function formatHTTP(hasClientTimestamp) {
    const clientTimestamp = angular.isDefined(hasClientTimestamp) ? hasClientTimestamp : false;
    const activeFilters = this._filterActiveFilters();

    // format current filters correctly
    const httpFilters = activeFilters.reduce((aggregate, filter) => {
      aggregate[filter._key] = filter._value;
      return aggregate;
    }, {});

    // add client timestamp if requested
    if (clientTimestamp) {
      httpFilters.client_timestamp = (new Date()).toJSON();
    }

    // make displayValue for client.
    const displayValues = Object.entries(this.getDisplayValueMap())
      .map(([key, value]) => `${key}:${value}`)
      .join(',');

    Object.assign(httpFilters, { displayValues });

    return httpFilters;
  };

  FilterList.prototype.formatCache = function formatCache() {
    const copy = angular.copy(this._filterIndex);

    // reset all values of filters that should not be cached
    Object.values(copy).forEach(filter => {
      if (!filter.isCacheable()) {
        filter.setValue(null, null);
      }
    });

    return copy;
  };

  // replaces current filters with filters from cache
  FilterList.prototype.loadCache = function loadCache(storedCache) {
    Object.keys(storedCache).forEach(key => {
      const cached = storedCache[key];
      const currentFilter = this._filterIndex[key];
      if (currentFilter) {
        currentFilter.setValue(cached._value, cached._displayValue);
      }
    });
  };

  FilterList.prototype._indexList = function indexList(index, list) {
    list.reduce((aggregateIndex, filterDefinition) => {
      aggregateIndex[filterDefinition._key] = filterDefinition;
      return aggregateIndex;
    }, index);
  };

  // returns a flat array of filters that have values (and should be applied)
  FilterList.prototype._filterActiveFilters = function filterActiveFilters() {
    const filtered = [];

    Object.keys(this._filterIndex).forEach(key => {
      const filter = this._filterIndex[key];

      if (filter._value !== null && filter._value !== undefined && filter._value.length !== '') {
        filtered.push(angular.copy(filter));
      }
    });

    return filtered;
  };

  /**
   * @method getDisplayValueMap
   *
   * @description
   * Turns stored filters into a map of filter key -> display value.  This
   * allows the search modals to get the display values in case any alterations
   * need to be made.
   *
   * @returns {Object} - { key : displayValue }
   */
  FilterList.prototype.getDisplayValueMap = function getDisplayValueMap() {
    const viewFilters = this.formatView().customFilters;
    return viewFilters.reduce((o, filter) => {
      o[filter._key] = filter.displayValue;
      return o;
    }, {});
  };

  // expose Filter data element
  FilterList.prototype.Filter = Filter;
  return FilterList;
}

// Filter class for storing filter information in a uniform way
// @TODO add debug asserts to ensure that key and value are specified when required
function Filter(key, label, valueFilter, comparitor) {
  // initialise internal state
  this._key = key;
  this._label = label;
  this._valueFilter = valueFilter;
  this._comparitor = comparitor;
  this._value = null;
  this._isDefault = null;
  this._displayValue = null;

  // default to cacheable filters
  this._isCacheable = true;

  this.setDefault = (value) => {
    this._isDefault = value;
  };

  this.setCacheable = (bool) => {
    this._isCacheable = bool;
  };

  this.isCacheable = () => this._isCacheable;

  this.setValue = function setValue(value, displayValue) {
    this._value = value;
    this._displayValue = displayValue;
  };
}
