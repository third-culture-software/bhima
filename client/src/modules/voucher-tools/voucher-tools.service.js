angular.module('bhima.services')
  .service('VoucherToolsService', VoucherToolsService);

VoucherToolsService.$inject = ['$http', 'util'];

/**
 *
 * @param $http
 * @param util
 */
function VoucherToolsService($http, util) {
  const service = this;

  service.correctTransaction = function correctTransaction(transactionUuid, details) {
    const url = `/journal/${transactionUuid}/correct`;
    return $http.post(url, { transactionDetails : details.transactionDetails, correction : details.correction })
      .then(util.unwrapHttpResponse);
  };
}
