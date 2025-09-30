const {
  _, db, ReportManager, STOCK_CONSUMPTION_GRAPTH_TEMPLATE,
} = require('../common');
const stockCore = require('../../core');
const i18n = require('../../../../lib/helpers/translate');

const chartjs = {};

/**
   * @method stockEntryReport
   *
   * @description
   * This method builds the stock entry report as either a JSON, PDF, or HTML
   * file to be sent to the client.
   *
   * GET /reports/stock/consumption_graph
   */
async function stockConsumptionGraphReport(req, res, next) {
  try {

    const params = _.clone(req.query);

    const optionReport = _.extend(params, {
      filename : 'REPORT.STOCK_CONSUMPTION_GRAPH_REPORT.TITLE',
    });

    // set up the report with report manager
    const report = new ReportManager(STOCK_CONSUMPTION_GRAPTH_TEMPLATE, req.session, optionReport);
    const options = req.query;
    let depot = {};

    if (options.depot_uuid) {
      depot = await db.one('SELECT text FROM depot WHERE uuid=?', db.bid(options.depot_uuid));
    }

    options.consumption = true;

    const collection = [];
    const reportType = options.reportType || 'quantity';
    const result = await stockCore.getDailyStockConsumption(options);

    result.forEach(item => {
      const line = {
        label : item.inventory_name,
        value : item[reportType],
      };
      collection.push(line);
    });

    const data = {
      labels : collection.map(item => item.label),
      datasets : [{
        data : collection.map(item => item.value),
        backgroundColor : 'rgba(8, 84, 132, 1)',
      }],
    };

    const chartRenderOptions = {
      chart_canvas_id : 'stockConsumptionChart',
      chart_data : data,
      chart_x_axis_label : i18n(options.lang)(`FORM.LABELS.${reportType.toUpperCase()}`),
      chart_type : 'horizontalBar',
      chart_option : { maintainAspectRatio : false },
    };

    const lineHeight = 16; // height of an inventory line
    const defaultPadding = 100;
    const chartHeight = String((result.length * lineHeight) + defaultPadding).concat('px');

    const reportResult = await report.render({
      chartHeight,
      depotName : depot.text,
      dateFrom : options.dateFrom,
      dateTo : options.dateTo,
      chartjs : chartjs.renderChart(chartRenderOptions),
      destinationType : `STOCK_FLUX.${options.destinationType || 'ALL_DESTINATION'}`,
    });
    res.set(reportResult.headers).send(reportResult.report);
  } catch (error) {
    next(error);
  }
}

module.exports = stockConsumptionGraphReport;
