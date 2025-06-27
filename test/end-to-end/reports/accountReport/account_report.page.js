const TU = require('../../shared/TestUtils');
const components = require('../../shared/components');
const ReportPage = require('../page');

class AccountReportPage {
  constructor(key) {
    this.page = new ReportPage(key);
  }

  async setDateInterval(interval) {
    const target = await TU.locator('[bh-date-interval]')
      .locator(`a[data-date-range="${interval}"]`);
    return target.click();
  }

  // preview an account report
  async showAccountReportPreview(account, dateInterval) {
    await components.accountSelect.set(account);
    await this.setDateInterval(dateInterval);
    return this.page.preview();
  }

  // save an account report
  async saveAccountReport(account, interval, reportName, reportFormat) {
    await this.showAccountReportPreview(account, interval);

    // save report as PDF
    await this.page.saveAs();
    await TU.input('SaveCtrl.documentOptions.label', reportName);
    await TU.select('SaveCtrl.documentOptions.renderer', reportFormat);
    await TU.modal.submit();

    // successfully saved notification
    await components.notification.hasSuccess();
    return this.page.backToConfig();
  }

  // print an account report
  async printAccountReport(account, interval) {
    await this.showAccountReportPreview(account, interval);
    return this.page.printPreview();
  }

  // check saved report
  async checkSavedAccountReport(reportName) {
    await this.page.gotoArchive();
    await TU.waitForSelector('.ui-grid-canvas .ui-grid-row');
    await this.page.lastReportMatching(reportName);
    return this.page.backToConfig();
  }

  // close preview
  async closeAccountReportPreview() {
    return this.page.closePreview();
  }
}

module.exports = AccountReportPage;
