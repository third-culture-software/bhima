const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const SearchModal = require('../shared/search.page');
const bhAccountSelect = require('../shared/components/bhAccountSelect');
const bhYesNoRadios = require('../shared/components/bhYesNoRadios');

class JournalSearchModal extends SearchModal {
  constructor(path) {
    super('journal-search', path);
  }

  async submit() {
    return TU.modal.submit();
  }

  async showFullTransactions(bool) {
    await this.switchToDefaultFilterTab();

    const selection = bool ? 'yes' : 'no';
    await bhYesNoRadios.set(selection);

    return this.switchToCustomFilterTab();
  }

  async showPostedRecords(bool) {
    if (bool) {
      await this.element
        .locator(by.model('ModalCtrl.searchQueries.includeNonPosted')).click();
    }
    return true;
  }

  async setAccount(account) {
    return bhAccountSelect.set(account);
  }

  async setTransaction(entity) {
    return TU.input('ModalCtrl.searchQueries.trans_id', entity, this.element);
  }

  async setEntity(entity) {
    return TU.input('ModalCtrl.searchQueries.hrEntity', entity, this.element);
  }

  async setRecord(entity) {
    return TU.input('ModalCtrl.searchQueries.hrRecord', entity, this.element);
  }

  async setReference(entity) {
    return TU.input('ModalCtrl.searchQueries.hrReference', entity, this.element);
  }
}

module.exports = JournalSearchModal;
