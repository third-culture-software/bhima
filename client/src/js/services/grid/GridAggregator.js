angular.module('bhima.services')
  .factory('GridAggregatorService', GridAggregatorService);

GridAggregatorService.$inject = [
  'uiGridGroupingConstants', '$filter', 'SessionService',
];

/**
 * Grid Aggregator Service
 *
 * This service contains all aggregators used in bhima, keyed on the column ID.  These should
 * provide enough detail, along with the aggregation detail.
 *
 * @todo - finish aggregation for footers
 */
function GridAggregatorService(uiGridGroupingConstants, $filter, Session) {

  // cache the enterprise currency id for easy lookup
  const enterpriseCurrencyId = Session.enterprise.currency_id;

  // cache the currency filter for later lookup
  const $currency = $filter('currency');
  const $date = $filter('date');

  // alias copy
  const { extend } = angular;

  /**
   * @const TREE_DEFAULTS
   *
   * @description
   * These are to be used with ui-grid-tree-view or ui-grid-grouping.  Otherwise, they are not
   * hooked up.  This is separate from regular aggregators embedded on ui-grid (by setting
   * aggregationType on the columnDef).  Those do not allow you to set a custom label.
   */
  const TREE_DEFAULTS = {

    // used to render amounts in the aggregate columns
    cost :  {
      customTreeAggregationFinalizerFn(aggregation) {
        aggregation.rendered = $currency(aggregation.value, enterpriseCurrencyId);
      },

      treeAggregationType : uiGridGroupingConstants.aggregation.SUM,
      hideAggregationLabel : true,
    },

    quanity : {
      treeAggregationType : uiGridGroupingConstants.aggregation.SUM,
    },

    single : {
      treeAggregationType : uiGridGroupingConstants.aggregation.MAX,
      customTreeAggregationFinalizerFn(aggregation) {
        aggregation.rendered = aggregation.value;
      },
      hideAggregationLabel : true,
    },

    date : {
      treeAggregationType : uiGridGroupingConstants.aggregation.MAX,
      customTreeAggregationFinalizerFn(aggregation) {
        aggregation.rendered = $date(aggregation.value);
      },
      hideAggregationLabel : true,
    },
  };

  // list of aggregators to be returned
  const aggregators = {
    tree : {
      debit : extend({}, TREE_DEFAULTS.cost),
      credit : extend({}, TREE_DEFAULTS.cost),
      debit_equiv : extend({}, TREE_DEFAULTS.cost),
      credit_equiv : extend({}, TREE_DEFAULTS.cost),
      date : extend({}, TREE_DEFAULTS.date),
      trans_date : extend({}, TREE_DEFAULTS.date),
      description : extend({}, TREE_DEFAULTS.single),
    },
  };

  /**
   * @function extendColumnWithAggregator
   *
   * @param {Object} column - the grid column to be extended
   * @param {Object} aggregator - an aggregator to attach to the column.
   *
   * @description
   * This function provides an easy way to attache an aggregation function
   * from the controller.
   */
  function extendColumnWithAggregator(column, aggregator) {
    extend(column, aggregator);
  }

  // return the aggregators and methods
  return {
    aggregators,
    extendColumnWithAggregator,
  };
}
