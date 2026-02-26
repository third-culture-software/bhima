angular.module('bhima.services')
  .service('GeneralLedgerService', GeneralLedgerService);

GeneralLedgerService.$inject = [
  'PrototypeApiService', '$httpParamSerializer', 'LanguageService',
  'SessionService',
];

/**
 * General Ledger Service
 * This service is responsible of all process with the General ledger
 * @param Api
 * @param $httpParamSerializer
 * @param Languages
 * @param Session
 */
function GeneralLedgerService(Api, $httpParamSerializer, Languages, Session) {
  const service = new Api('/general_ledger/');

  service.download = download;
  service.openAccountReport = openAccountReport;

  /**
   *
   * @param type
   * @param filters
   * @param label
   * @param displayNames
   * @param renameKeys
   */
  function download(type, filters, label, displayNames, renameKeys) {
    const filterOpts = filters;
    if (filters) {
      filters.fiscal_year_label = label;
    }

    const defaultOpts = {
      renderer : type, lang : Languages.key, displayNames, renameKeys,
    };

    // combine options
    const options = angular.merge(defaultOpts, filterOpts);

    // return  serialized options
    return $httpParamSerializer(options);
  }

  /**
   *
   * @param options
   */
  function openAccountReport(options) {
    const defaultOpts = {
      lang : Languages.key,
      currency_id : Session.enterprise.currency_id,
    };

    // combine options
    const opts = angular.merge(defaultOpts, options);

    // return serialized options
    return $httpParamSerializer(opts);
  }

  // GET /general_ledger/aggregates
  service.aggregates = (params) => service.read.call({ url : service.url.concat('aggregates') }, null, params);

  // GET /general_ledger/transactions
  service.transactions = (params) => service.read.call({ url : service.url.concat('transactions') }, null, params);

  return service;
}
