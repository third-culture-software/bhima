const TU = require('../shared/TestUtils');

/* eslint no-await-in-loop:off */

const components = require('../shared/components');

/**
 *
 */
function StockSettingPage() {
  const page = this;

  /**
   * defineMonthAverageConsumption
   * @param {string} value - Month average consumption
   * @returns {Promise} of setting
   */
  page.defineMonthAverageConsumption = async function defineMonthAverageConsumption(value) {
    return TU.input('StockSettingsCtrl.settings.month_average_consumption', value);
  };

  /**
   * define default purchase interval
   * @param {string} value - purchase interval
   * @returns {Promise} of setting
   */
  page.defineDefaultPurchaseInterval = async function defineDefaultPurchaseInterval(value) {
    return TU.input('StockSettingsCtrl.settings.default_purchase_interval', value);
  };

  /**
   * defaultMinMonthsSecurityStock
   * @param {string} value - Min Months security stock
   * @returns {Promise} of setting
   */
  page.defaultMinMonthsSecurityStock = async function defaultMinMonthsSecurityStock(value) {
    return TU.input('StockSettingsCtrl.settings.default_min_months_security_stock', value);
  };

  /**
   * setRadio
   * @param {string} value - Click Yes or No
   * @param {string} name  - Variable name to click
   * @returns {Promise} of setting
   */
  page.setRadio = async function setRadio(value, name) {
    return components.yesNoRadios.set(value, name);
  };

  page.checkSuccess = async function checkSuccess() {
    return components.notification.hasSuccess();
  };
}

module.exports = StockSettingPage;
