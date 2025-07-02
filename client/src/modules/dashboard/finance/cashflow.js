angular.module('bhima.controllers')

// Cash Box Chart Controllers
//
// The framework for how to do dashboards is still a work in progress.
// The code below is poorly written, as I am still prototyping how to
// all the different pieces together.  It should be rewritten as soon
// as we understand what each chart/controller will do.
  .controller('CashFlowChartController', [
    '$filter',
    '$translate',
    'appcache',
    'FinanceDashboardService',
    'ChartService',
    CashFlowChartController]);

function CashFlowChartController($filter, $translate, AppCache, Finance, ChartService) {

  // alias this
  const self = this;
  const cache = new AppCache('CashFlowChart');
  const $date = $filter('date');

  // expose group options to the view
  self.grouping = ChartService.grouping;

  // defaults
  self.currencyId = 1;
  self.hasPostingJournal = 1;
  [self.group] = self.grouping;

  // TODO
  // This should be chosen, and format the axes labels appropriately
  self.cashBoxGrouping = 'month';

  // records the data for the chart
  self.chart = {
    options : { multiTooltipTemplate : ChartService.multitooltip.currency },
    colors : ['#468847', '#F7464A'],
    series : ['Income', 'Expense'],
  };

  // retrieve the list of cashboxes from the server
  self.getCashBoxes = () => Finance.getCashBoxes();

  // load the balance data for a single account
  self.getCashBalance = (cashBoxId) => {
    Finance.getCashBoxBalance(cashBoxId, self.currencyId, self.hasPostingJournal)
      .then((response) => {

        // this is the immediate overview (income, expense, balance)
        [self.meta] = response.data;
      });
  };

  // load the analytics history of the given cashbox
  self.getCashHistory = (cashBoxId) => {
    Finance.getCashBoxHistory(cashBoxId, self.currencyId, self.hasPostingJournal, self.group.grouping)
      .then((response) => {
        const { data } = response;

        // assign chart data
        self.chart.data = [
          data.map((row) => { return row.debit; }),
          data.map((row) => { return row.credit; }),
        ];

        // assign the chart labels
        self.chart.labels = data.map((row) => { return $date(row.trans_date, self.group.format); });
      });
  };

  // in initialize the module
  self.getCashBoxes()
    .then((response) => {
      self.cashBoxes = response.data;
      return Finance.getCurrencies();
    })
    .then((response) => {
      self.currencies = response.data;
      return loadChartDefaults();
    })
    .then(() => {

      // make sure we have a cash box id defined
      if (!self.cashBoxId) {
        self.cashBoxId = self.cashBoxes[0].id;
      }

      // load module data
      self.getCashBalance(self.cashBoxId);
      self.getCashHistory(self.cashBoxId);
    });

  // load defaults from localstorage
  function loadChartDefaults() {
    return cache.fetch('options')
      .then((options) => {
        if (options) {
          self.currencyId = options.currencyId;
          self.hasPostingJournal = options.hasPostingJournal;
          self.cashBoxId = options.cashBoxId;
          const group = self.grouping[options.groupIdx];
          if (group) { self.group = self.grouping[options.groupIdx]; }
        }
      });
  }

  // save defaults to localstorage
  function saveChartDefaults() {

    // TODO
    // this could probably be done much better.
    const idx = self.grouping.reduce((idtx, group, index) => {
      if (idx !== -1) { return idtx; }
      return group.key === self.group.key ? index : -1;
    }, -1);

    cache.put('options', {
      currencyId        : self.currencyId,
      hasPostingJournal : self.hasPostingJournal,
      cashBoxId         : self.cashBoxId,
      groupIdx          : idx,
    });
  }

  // refreshes the chart
  self.refresh = () => {

    // first, save the metadata
    saveChartDefaults();

    // load module data
    self.getCashBalance(self.cashBoxId);
    self.getCashHistory(self.cashBoxId);
  };

  self.fmt = (key) => $translate.instant(key);
}
