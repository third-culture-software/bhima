angular.module('bhima.services')
  .service('LotsRegistryService', LotsRegistryService);

LotsRegistryService.$inject = [
  'uiGridConstants', 'SessionService',
];

/**
 * This service encapsulate some common method of stock lots registry with the aims
 * of reducing lines in registry.js
 */
function LotsRegistryService(uiGridConstants, Session) {
  const service = this;

  service.groupingBox = [
    { label : 'STOCK.INVENTORY', value : 'text' },
    { label : 'STOCK.INVENTORY_GROUP', value : 'group_name' },
  ];

  service.columnDefs = [
    {
      field : 'depot_text',
      displayName : 'STOCK.DEPOT',
      headerTooltip : 'STOCK.DEPOT',
      headerCellFilter : 'translate',
    }, {
      field : 'code',
      displayName : 'STOCK.CODE',
      headerTooltip : 'STOCK.CODE',
      headerCellFilter : 'translate',
      sort : {
        direction : uiGridConstants.ASC,
        priority : 0,
      },
    }, {
      field : 'text',
      displayName : 'STOCK.INVENTORY',
      headerTooltip : 'STOCK.INVENTORY',
      headerCellFilter : 'translate',
      sort : {
        direction : uiGridConstants.ASC,
        priority : 1,
      },
    }, {
      field : 'group_name',
      displayName : 'TABLE.COLUMNS.INVENTORY_GROUP',
      headerTooltip : 'TABLE.COLUMNS.INVENTORY_GROUP',
      headerCellFilter : 'translate',
    }, {
      field : 'label',
      displayName : 'STOCK.LOT',
      headerTooltip : 'STOCK.LOT',
      headerCellFilter : 'translate',
    }, {
      field : 'barcode',
      displayName : 'BARCODE.BARCODE',
      headerTooltip : 'BARCODE.BARCODE',
      headerCellFilter : 'translate',
      visible : false,
    }, {
      field : 'lot_description',
      displayName : 'FORM.LABELS.DESCRIPTION',
      headerTooltip : 'FORM.LABELS.DESCRIPTION',
      headerCellFilter : 'translate',
      visible : false,
    }, {
      field : 'packaging',
      displayName : '',
      width : 40,
      headerCellFilter : 'translate',
      cellFilter : 'translate',
      visible      : false,
      cellTemplate : 'modules/stock/lots/templates/packaging.cell.tmpl.html',
    }, {
      field : 'quantity',
      displayName : 'STOCK.QUANTITY',
      headerTooltip : 'STOCK.QUANTITY',
      cellClass : 'text-right',
      headerCellFilter : 'translate',
      type : 'number',
    }, {
      field : 'unit_cost',
      displayName : 'STOCK.UNIT_COST',
      headerTooltip : 'STOCK.UNIT_COST',
      cellClass : 'text-right',
      headerCellFilter : 'translate',
      type : 'number',
      cellFilter : `currency:${Session.enterprise.currency_id}:4`,
    }, {
      field : 'unit_type',
      width : 75,
      displayName : 'TABLE.COLUMNS.UNIT',
      headerTooltip : 'TABLE.COLUMNS.UNIT',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/stock/inventories/templates/unit.tmpl.html',
    }, {
      field : 'entry_date',
      displayName : 'STOCK.ENTRY_DATE',
      headerTooltip : 'STOCK.ENTRY_DATE_TOOLTIP',
      headerCellFilter : 'translate',
      cellFilter : 'date',
    }, {
      field : 'expiration_date',
      displayName : 'STOCK.EXPIRATION_DATE',
      headerTooltip : 'STOCK.EXPIRATION_DATE',
      headerCellFilter : 'translate',
      cellFilter : 'date',
    }, {
      field : 'delay_expiration',
      displayName : 'STOCK.EXPIRATION',
      headerTooltip : 'STOCK.EXPIRATION',
      cellClass : 'text-right',
      headerCellFilter : 'translate',
    }, {
      field : 'tagNames',
      displayName : 'TAG.LABEL',
      headerTooltip : 'TAG.LABEL',
      headerCellFilter : 'translate',
      cellTemplate     : 'modules/stock/lots/templates/tags.cell.html',
      visible : false,
    }, {
      field : 'S_MIN',
      displayName : 'STOCK.MINIMUM',
      headerTooltip : 'STOCK.MINIMUM',
      headerCellFilter : 'translate',
      type : 'number',
      visible : false,
    }, {
      field : 'S_MAX',
      displayName : 'STOCK.MAXIMUM',
      headerTooltip : 'STOCK.MAXIMUM',
      headerCellFilter : 'translate',
      type : 'number',
      visible : false,
    }, {
      field : 'S_SEC',
      displayName : 'STOCK.SECURITY',
      headerTooltip : 'STOCK.SECURITY',
      headerCellFilter : 'translate',
      type : 'number',
      visible : false,
    }, {
      field : 'S_Q',
      displayName : 'STOCK.REFILL_QUANTITY',
      headerTooltip : 'STOCK.REFILL_QUANTITY',
      headerCellFilter : 'translate',
      type : 'number',
      visible : false,
    }, {
      field : 'avg_consumption',
      displayName : 'STOCK.CMM',
      headerTooltip : 'STOCK.MONTHLY_CONSUMPTION.AVERAGE_MONTHLY_CONSUMPTION',
      headerCellFilter : 'translate',
      type : 'number',
      visible : false,
    }, {
      field : 'usable_quantity_remaining',
      displayName : 'STOCK.USABLE_AVAILABLE_STOCK',
      headerTooltip : 'STOCK.USABLE_AVAILABLE_STOCK',
      headerCellFilter : 'translate',
      type : 'number',
      visible : false,
    }, {
      field : 'lot_lifetime',
      displayName : 'STOCK.DAYS_UNTIL_STOCK_OUT',
      headerTooltip : 'STOCK.DAYS_UNTIL_STOCK_OUT',
      headerCellFilter : 'translate',
      type : 'number',
      visible : false,
    }, {
      field : 'documentReference',
      displayName : 'TABLE.COLUMNS.REFERENCE',
      headerTooltip : 'TABLE.COLUMNS.REFERENCE',
      headerCellFilter : 'translate',
      cellFilter : 'date',
      visible : false,
    }, {
      field : 'max_stock_date',
      displayName : 'STOCK.MAX_STOCK_DATE',
      headerTooltip : 'STOCK.MAX_STOCK_DATE',
      headerCellFilter : 'translate',
      cellFilter : 'date',
      visible : false,
    }, {
      field : 'min_stock_date',
      displayName : 'STOCK.MIN_STOCK_DATE',
      headerTooltip : 'STOCK.MIN_STOCK_DATE',
      headerCellFilter : 'translate',
      cellFilter : 'date',
      visible : false,
    }, {
      field : 'status',
      displayName : 'TABLE.COLUMNS.STATUS',
      headerTooltip : 'TABLE.COLUMNS.STATUS',
      headerCellFilter : 'translate',
      cellFilter : 'translate',
      visible : false,
    }, {
      field : 'is_asset',
      displayName : 'FORM.LABELS.ASSET',
      headerCellFilter : 'translate',
      visible : false,
      cellTemplate : '/modules/inventory/list/templates/asset.cell.tmpl.html',
    }, {
      field : 'reference_number',
      displayName : 'FORM.LABELS.REFERENCE_NUMBER',
      headerCellFilter : 'translate',
      visible : false,
    }, {
      field : 'manufacturer_brand',
      displayName : 'FORM.LABELS.MANUFACTURER_BRAND',
      headerCellFilter : 'translate',
      visible : false,
      width : 150,
    }, {
      field : 'manufacturer_model',
      displayName : 'FORM.LABELS.MANUFACTURER_MODEL',
      headerCellFilter : 'translate',
      visible : false,
      width : 150,
    }, {
      field : 'serial_number',
      displayName : 'FORM.LABELS.SERIAL_NUMBER',
      headerCellFilter : 'translate',
      visible : false,
      width : 150,
    }, {
      field : 'funding_source_code',
      displayName : 'FORM.LABELS.FUNDING_SOURCE',
      headerCellFilter : 'translate',
      visible : false,
      width : 150,
    }, {
      field : 'action',
      displayName : '',
      enableFiltering : false,
      enableSorting : false,
      cellTemplate : 'modules/stock/lots/templates/action.cell.html',
    }];

  service.gridFooterTemplate = `
    <div class="ui-grid-cell-contents">
      <b>{{ grid.appScope.countGridRows() }}</b>
      <span style="margin-right: 1em;" translate>TABLE.AGGREGATES.ROWS</span>

      <span class="fa fa-circle icon-expired legend" style="margin-left: 1em;"></span>
      <strong>
        <span translate>STOCK.EXPIRED</span>: {{grid.appScope.totals.expired}}
      </strong>

      <span class="fa fa-circle icon-at-risk-of-expiring legend" style="margin-left: 1em;"></span>
      <strong>
        <span translate>STOCK.RISK_OF_EXPIRATION</span>: {{grid.appScope.totals['at-risk-of-expiring']}}
      </strong>

      <span class="fa fa-circle icon-at-risk-of-stock-out legend" style="margin-left: 1em;"></span>
      <strong>
        <span translate>STOCK.RISK_OF_STOCK_OUT</span>: {{grid.appScope.totals['at-risk-of-stock-out']}}
      </strong>

      <span class="fa fa-circle icon-out-of-stock legend" style="margin-left: 1em;"></span>
      <strong>
        <span translate>STOCK.STATUS.STOCK_OUT</span>: {{grid.appScope.totals['out-of-stock']}}
      </strong>

    </div>
  `;

  /**
   * @function formatLotsWithoutExpirationDate
   *
   * @description
   * Removes values from lots that do not have expiration dates so they do not show up in the
   * registry view.
   */
  service.formatLotsWithoutExpirationDate = (lot) => {
    lot.hasExpirationDate = (lot.tracking_expiration === 1);
    if (!lot.hasExpirationDate) {
      delete lot.delay_expiration;
      delete lot.expiration_date;
      delete lot.lifetime;
      delete lot.S_LOT_LIFETIME;
      delete lot.S_RISK;
      delete lot.S_RISK_QUANTITY;
    }
  };

  service.orderByDepot = (rowA, rowB) => {
    return String(rowA.depot_text).localeCompare(rowB.depot_text);
  };
}
