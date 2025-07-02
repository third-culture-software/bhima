angular.module('bhima.services')
  .service('FiscalService', FiscalService);

FiscalService.$inject = ['PrototypeApiService'];

/**
 * @class FiscalService
 * @extends PrototypeApiService
 *
 * This service is responsible for loading the Fiscal Years and Periods, as well
 * as providing metadata like period totals, opening balances and such.
 *
 * @requires PrototypeApiService
 */
function FiscalService(Api) {
  const service = new Api('/fiscal/');

  service.closeFiscalYear = closeFiscalYear;
  service.getFiscalYearByDate = getFiscalYearByDate;
  service.setOpeningBalance = setOpeningBalance;
  service.getOpeningBalance = getOpeningBalance;
  service.getClosingBalance = getClosingBalance;
  service.getPeriods = getPeriods;
  service.getEnterpriseFiscalStartDate = getEnterpriseFiscalStartDate;

  service.getBalance = getBalance;

  /**
   * @method getFiscalYearByDate
   *
   * @description
   * Find the fiscal year for a given date.
   */
  function getFiscalYearByDate(params) {
    const url = service.url.concat('date');
    return service.$http.get(url, { params })
      .then(service.util.unwrapHttpResponse);
  }

  /**
   * @method getBalance
   *
   * @description
   * Gets the balance for the fiscal year using all transactions posted against
   * the fiscal year.
   */
  function getBalance(id, params) {
    const url = service.url.concat(id, '/balance');
    return service.$http.get(url, { params })
      .then(service.util.unwrapHttpResponse);
  }

  /**
   * @function getOpeningBalance
   *
   * @description
   * Returns the opening balance for all accounts in a fiscal year.
   */
  function getOpeningBalance(fiscalYearId) {
    const url = `${service.url}${fiscalYearId}/opening_balance`;
    return service.$http.get(url)
      .then(service.util.unwrapHttpResponse);
  }

  /**
   * @method setOpeningBalance
   *
   * @description set the opening balance for a fiscal year
   */
  function setOpeningBalance(params) {
    const url = service.url.concat(params.id, '/opening_balance/');
    return service.$http.post(url, { params })
      .then(service.util.unwrapHttpResponse);
  }

  /**
   * @method getClosingBalance
   *
   * @description
   * Finds the closing balance for a fiscal year.  Importantly - this method
   * looks in the period 0 value of the subsequent year, not as a sum of all
   * periods to date.
   */
  function getClosingBalance(fiscalYearId) {
    const url = service.url.concat(fiscalYearId, '/closing_balance/');
    return service.$http.get(url)
      .then(service.util.unwrapHttpResponse);
  }

  /**
   * @method closeFiscalYear
   *
   * @description closing a fiscal year
   */
  function closeFiscalYear(id, params) {
    const url = service.url.concat(id, '/closing');
    return service.$http.put(url, { params })
      .then(service.util.unwrapHttpResponse);
  }

  /**
   * @method getEnterpriseFiscalStartDate
   *
   * @description
   * Returns a single date representing the earliest start date of all
   * the enterprise fiscal years.
   */
  function getEnterpriseFiscalStartDate(enterpriseId) {
    const url = `/enterprises/${enterpriseId}/fiscal_start`;
    return service.$http.get(url)
      .then(service.util.unwrapHttpResponse);
  }

  /**
   * @method getPeriods
   *
   * @description
   * Retrieves the periods for a fiscal year by the fiscal year id.
   */
  function getPeriods(id) {
    const url = service.url.concat(id, '/periods');
    return service.$http.get(url)
      .then(service.util.unwrapHttpResponse)
      .then(periods => periods
        .map(p => {
          p.start_date = new Date(p.start_date);
          p.end_date = new Date(p.end_date);
          return p;
        }));
  }

  return service;
}
