const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const GridRow = require('../shared/GridRow');

/**
 *
 */
function TagsPage() {
  const page = this;

  // the grid id
  const gridId = 'tags-grid';

  page.gridId = gridId;
  page.setName = setName;
  page.editTags = editTags;
  page.deleteTags = deleteTags;
  page.openCreateModal = openCreateModal;
  page.setColor = setColor;

  page.submit = function submit() {
    return TU.modal.submit();
  };

  /**
   *
   * @param txt
   */
  async function setName(txt) {
    const tagName = await TU.locator(by.model('ModalCtrl.tags.name'));
    return tagName.fill(txt);
  }

  /**
   *
   * @param color
   */
  async function setColor(color) {
    // Open the color drop-down
    const colors = await TU.getModel('ModalCtrl.tags.color');
    await colors.click();

    // Select the first matching color
    const thisColor = colors.locator('.dropdown-menu [role="option"]')
      .locator(`//*[contains(text(), '${color}')]`).first();
    return thisColor.click();
  }

  /**
   *
   * @param label
   */
  async function showDragAndDropMenu(label) {
    const row = new GridRow(label);
    await row.dropdown();
    return row;
  }

  /**
   *
   * @param label
   */
  async function editTags(label) {
    const row = await showDragAndDropMenu(label);
    await row.edit();
  }

  /**
   *
   * @param label
   */
  async function deleteTags(label) {
    const row = await showDragAndDropMenu(label);
    await row.remove();
  }

  /**
   *
   */
  async function openCreateModal() {
    await TU.buttons.create();

    // Wait for the create modal to actually come up
    return TU.waitForSelector('form[name="tagsForm"] .modal-footer');
  }
}

module.exports = TagsPage;
