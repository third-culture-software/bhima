angular.module('bhima.controllers')

// Finance DashBoard Service
// Performs the HTTP queries for the financial dashboard controller
  .service('FinanceDashboardService', ['$http', ($http) => {
    const service = {};

    // get a list of cashboxes and associated currencies/accounts
    service.getCashBoxes = () => {
      return $http.get('/analytics/cashboxes');
    };

    // retrieve a list of valid currencies
    service.getCurrencies = () => {
      return $http.get('/currencies');
    };

    service.getCashBoxBalance = (boxId, currencyId, hasPostingJournal) => {
      const stub = `/analytics/cashboxes/${boxId}/balance`;
      return $http.get(stub, { params : { currencyId, hasPostingJournal } });
    };

    service.getCashBoxHistory = (boxId, currencyId, hasPostingJournal, grouping) => {
      const stub = `/analytics/cashboxes/${boxId}/history`;

      return $http.get(stub, {
        params : {
          currencyId,
          hasPostingJournal,
          grouping,
        },
      });
    };

    // get the debtor groups owing the most money
    service.getTopDebtorGroups = (limit) => {
      return $http.get(`/analytics/debtorgroups/top?limit=${limit}`);
    };

    // get the debtors owing the most money
    service.getTopDebtors = (limit) => {
      return $http.get(`/analytics/debtors/top?limit=${limit}`);
    };

    // limits for things
    service.limits = {
      10  : 10,
      25  : 25,
      50  : 50,
      all : Infinity,
    };

    return service;
  }]);
