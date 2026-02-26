angular.module('bhima.services')
  .service('BudgetService', BudgetService);

BudgetService.$inject = [
  'PrototypeApiService',
  'moment',
  'AccountService',
  'NotifyService',
  'LanguageService',
  'FormatTreeDataService',
  '$httpParamSerializer',
  'bhConstants',
  '$translate',
];

/**
 * Provide budget services
 * @returns {object} the budget service object
 */ /* eslint-disable-next-line */
function BudgetService(Api, moment, Accounts, Notify, Languages,
  FormatTreeData, $httpParamSerializer, bhConstants, $translate) {

  const service = new Api('/budget');

  const { TITLE, EXPENSE, INCOME } = bhConstants.accounts;
  const allowedTypes = [TITLE, EXPENSE, INCOME];

  // Expose services
  service.budgetPeriods = budgetPeriods;
  service.downloadBudgetTemplate = downloadBudgetTemplate;
  service.exportCSV = exportCSV;
  service.fillBudget = fillBudget;
  service.getBudgetData = getBudgetData;
  service.getPeriods = getPeriods;
  service.getPeriodsWithActuals = getPeriodsWithActuals;
  service.loadData = loadData;
  service.populateBudget = populateBudget;
  service.updateBudgetPeriods = updateBudgetPeriods;
  service.exportToQueryString = exportToQueryString;
  service.downloadExcelQueryString = downloadExcelQueryString;

  /**
   * Download the budget template file
   */
  function downloadBudgetTemplate() {
    service.$http.get('/budget/import_template_file')
      .then(response => {
        return service.util.download(response, 'Import Budget Template', 'csv');
      });
  }

  /**
   * Populate the budget for the fiscal year.
   *
   * ASSUMES: the budget items for the fiscal year have been creted (period num == 0)
   * @param {number} fiscalYearId - the ID for the fiscal year
   * @returns {Promise} for the result
   */
  function populateBudget(fiscalYearId) {
    const url = `/budget/populate/${fiscalYearId}`;
    return service.$http.post(url)
      .then(service.util.unwrapHttpResponse);
  }

  /**
   * Update budget period(s)
   * @param {Array} changes - array of {periodId, newBudget, newLocked} updates
   * @returns {Promise} of number of changes done
   */
  function updateBudgetPeriods(changes) {
    const url = '/budget/updatePeriodBudgets';
    return service.$http.put(url, { params : changes })
      .then(service.util.unwrapHttpResponse);
  }

  /**
   * Fill/distribute the budget for the fiscal year to each budget period for each account
   * @param {number} fiscalYearId - the ID for the fiscal year
   * @returns {Promise} for the result
   */
  function fillBudget(fiscalYearId) {
    const url = `/budget/fill/${fiscalYearId}`;
    return service.$http.put(url)
      .then(service.util.unwrapHttpResponse);
  }

  /**
   * Get the budget and actuals data for the fiscal year
   * @param {number} fiscalYearId - the ID for the fiscal year
   * @returns {Promise} for the result
   */
  function getBudgetData(fiscalYearId) {
    const url = `/budget/data/${fiscalYearId}`;
    return service.$http.get(url)
      .then(service.util.unwrapHttpResponse);
  }

  /**
   * Get the periods for a fiscal year
   *
   * An additional pseudo period (number = 0) is appended
   * for the bounds of the FY
   * @param {number} fiscalYearId - ID for the fiscal year
   * @returns {Promise} of the list of periods
   */
  function getPeriods(fiscalYearId) {
    let periods;
    return service.$http.get(`/fiscal/${fiscalYearId}/periods`)
      .then(service.util.unwrapHttpResponse)
      .then(allPeriods => {
        periods = allPeriods;
        return service.$http.get(`/fiscal/${fiscalYearId}`);
      })
      .then(service.util.unwrapHttpResponse)
      .then(fy => {
        // Push in period zero to provide FY dates
        periods.push({
          number : 0,
          end_date :  fy.end_date,
          start_date : fy.start_date,
        });
        return periods;
      });
  }

  /**
   * Get the periods for the fiscal year that potentially have actuals.
   * This does not include periods in the future (for the current FY)
   * but will include all periods for any FY in the past.
   * @param {number} fiscalYearId - ID of the desired fiscal year
   * @returns {Array} array of period IDs
   */
  function getPeriodsWithActuals(fiscalYearId) {
    const today = moment().toDate();
    const monthEnd = moment().endOf('month').toDate();
    let currentFY;
    return service.$http.get(`/fiscal/${fiscalYearId}`)
      .then(service.util.unwrapHttpResponse)
      .then(fy => {
        currentFY = fy;
        return service.$http.get(`/fiscal/${fiscalYearId}/periods`);
      })
      .then(service.util.unwrapHttpResponse)
      .then(allPeriods => {
        const endDateFY = new Date(currentFY.end_date);
        if (today > endDateFY) {
          // If the current date is after the end of the fiscal year, all periods could have actuals
          return allPeriods.map(item => item.id);
        }

        // The current date is inside this fiscal year, so do not return periods in the future
        // (since they cannot have any actuals)
        const periods = [];
        allPeriods.forEach(p => {
          const endDate = new Date(p.end_date);
          if (endDate < monthEnd) {
            periods.push(p.id);
          }
        });
        return periods;
      });
  }

  /**
   * Load the accounts and budget data
   * @param {number} fiscalYearId - Fiscal year ID
   * @returns {object} results { accounts, budgetData, historicPeriods }
   */
  function loadData(fiscalYearId) {

    return getBudgetData(fiscalYearId)
      .then(data => {

        // Set up the tree hierarchy info
        FormatTreeData.order(data);

        data.forEach(acct => {

          // Make a feeble attempt to fix $$treelevel, if it is missing
          if (!angular.isDefined(acct.$$treeLevel)) {
            acct.$$treeLevel = acct.parent ? 1 : 0;
          }

          // cache the $$treeLevel
          acct._$$treeLevel = acct.$$treeLevel;
        });

        return data;
      });
  }

  /**
   * Export/download the budget data for a fiscal year
   *
   * Note that only expense, income, and their title accounts are exported.
   * @param {number} fiscalYear - fiscal year ID
   * @returns {boolean} when completed
   */
  async function exportCSV(fiscalYear) {

    /**
     * Sleep (Used to get the user time to see a transient warning message)
     * @param {number} ms - milliseconds to sleep
     * @returns {Promise} of completion of the timeout
     */
    function sleep(ms) {
       
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    // First, get all account balance data
    const fyAcctData = await Accounts.getAllAnnualBalances(fiscalYear.id);
    if (fyAcctData.length === 0) {
      Notify.warn($translate.instant('BUDGET.EXPORT.NO_ACCT_BALANCE_DATA_FOR_FY', { fyName : fiscalYear.label }));
      // Give the user a couple seconds to see the message
      await sleep(2500);
    }

    // Get all the account data
    const accounts = await Accounts.read();

    // Sort the accounts lexically
    accounts.sort((a, b) => a.number.toString().localeCompare(b.number.toString()));

    // Process the accounts to construct the data to export
    let exportData = 'AcctNum, Label, Type, Budget\n'; // The headers
    accounts.forEach(acct => {
      if (allowedTypes.includes(acct.type_id)) {
        // Find the matching fy account balance for the account
        const fyData = fyAcctData.find(item => item.account_id === acct.id);

        // Prepare and construct the CSV data
        const label = JSON.stringify(acct.label);
        let amount = 0;
        switch (acct.type_id) {
        case TITLE:
          exportData += `${acct.number},${label},title,\n`;
          break;
        case EXPENSE:
          amount = fyData ? fyData.debit - fyData.credit : 0;
          exportData += `${acct.number},${label},expense,${amount}\n`;
          break;
        case INCOME:
          amount = fyData ? fyData.credit - fyData.debit : 0;
          exportData += `${acct.number},${label},income,${amount}\n`;
          break;
        default:
        }
      }
    });

    // Download the data as a CSV file
    await service.util.download({ data : exportData }, `Budget data ${fiscalYear.label}`, 'csv');
    return true;
  }

  /**
   * Construct the http query stgring for the GET URL
   * @param {string} renderer - name of report renderer (pdf, csv, xlsx)
   * @param {Array} params - parameters for rendering (must include: fiscal_year_id, filename)
   * @returns {string} - http query string for http GET call
   */
  function exportToQueryString(renderer, params) {
    const defaultOpts = {
      renderer,
      lang : Languages.key,
    };
    const options = angular.merge(defaultOpts, params);
    return $httpParamSerializer(options);
  }

  /**
   * Construct the http parameter string for the GET URL
   * @param {Array} params - parameters for report rendering
   * @returns {string} - http query string for http GET call
   */
  function downloadExcelQueryString(params) {
    const defaultOpts = {
      renderer : 'xlsx',
      lang : Languages.key,
      renameKeys : true,
    };
    const options = angular.merge(defaultOpts, params);
    return $httpParamSerializer(options);
  }

  /**
   * Return the stucture for the data periods (months)
   *
   * NOTE: Must match 'periods' in server/config/constants.js
   * @returns {Array} of data for the periods
   */
  function budgetPeriods() {
     
    return [
      { periodNum : 1,  label : 'PERIODS.NAME.JANUARY',   key : 'jan' },
      { periodNum : 2,  label : 'PERIODS.NAME.FEBRUARY',  key : 'feb' },
      { periodNum : 3,  label : 'PERIODS.NAME.MARCH',     key : 'mar' },
      { periodNum : 4,  label : 'PERIODS.NAME.APRIL',     key : 'apr' },
      { periodNum : 5,  label : 'PERIODS.NAME.MAY',       key : 'may' },
      { periodNum : 6,  label : 'PERIODS.NAME.JUNE',      key : 'jun' },
      { periodNum : 7,  label : 'PERIODS.NAME.JULY',      key : 'jul' },
      { periodNum : 8,  label : 'PERIODS.NAME.AUGUST',    key : 'aug' },
      { periodNum : 9,  label : 'PERIODS.NAME.SEPTEMBER', key : 'sep' },
      { periodNum : 10, label : 'PERIODS.NAME.OCTOBER',   key : 'oct' },
      { periodNum : 11, label : 'PERIODS.NAME.NOVEMBER',  key : 'nov' },
      { periodNum : 12, label : 'PERIODS.NAME.DECEMBER',  key : 'dec' },
    ];
     
  }

  return service;
}
