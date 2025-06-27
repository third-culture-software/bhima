angular.module('bhima.controllers')

// composes query strings nicely off a url and
// an object of potential queries.
// queries = { hasId : 0, utm_awesome: undefined } => '?hasId=1'
.service('QueryService', () => {
  const service = {};

  service.compose = function (url, queries) {
    let value; const
params = [];

    // append the querystring to the url
    url += '?';

    // loop through the queries, and if they are defined,
    // append them to the params object
    // NOTE - values can be arrays, strings, or numbers
    Object.keys(queries).forEach((key) => {
      value = queries[key];
      if (angular.isDefined(value)) {
        params.push(`${key}=${value.toString()}`);
      }
    });

    url += params.join('&');

    return url;
  };

  return service;
})

// Finance DashBoard Service
// Performs the HTTP queries for the financial dashboard controller
.service('FinanceDashboardService', ['$http', '$translate', 'QueryService', function ($http, $translate, QS) {

  const service = {};

  // get a list of cashboxes and associated currencies/accounts
  service.getCashBoxes = function () {
    return $http.get('/analytics/cashboxes');
  };

  // retrieve a list of valid currencies
  service.getCurrencies = function () {
    return $http.get('/currencies');
  };

  service.getCashBoxBalance = function (boxId, currencyId, hasPostingJournal) {
    const stub = `/analytics/cashboxes/${boxId}/balance`;
        const url = QS.compose(stub, { currencyId, hasPostingJournal });

    return $http.get(url);
  };

  service.getCashBoxHistory = function (boxId, currencyId, hasPostingJournal, grouping) {
    const stub = `/analytics/cashboxes/${boxId}/history`;
        const url = QS.compose(stub, {
          currencyId,
          hasPostingJournal,
          grouping
        });

    return $http.get(url);
  };

  // get the debtor groups owing the most money
  service.getTopDebtorGroups = function (limit) {
    return $http.get(`/analytics/debtorgroups/top?limit=${limit}`);
  };

  // get the debtors owing the most money
  service.getTopDebtors = function (limit) {
    return $http.get(`/analytics/debtors/top?limit=${limit}`);
  };

  const all = $translate.instant('UTIL.ALL');

  // limits for things
  service.limits = {
    10  : 10,
    25  : 25,
    50  : 50,
    all : Infinity
  };

  return service;
}]);
