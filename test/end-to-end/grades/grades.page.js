const TU = require('../shared/TestUtils');

const GridRow = require('../shared/GridRow');
const { notification } = require('../shared/components');

class GradePage {

  constructor(modal) {
    this.gridId = 'grade-grid';
    this.modal = modal;
  }

  /**
   * Emulate an async constructor
   * @returns {GradePage} a new GradePage object
   */
  static async new() {
    const modal = await TU.locator('[uib-modal-window]');
    return new GradePage(modal);
  }

  async count() {
    const repeat = '(rowRenderIndex, row) in rowContainer.renderedRows track by $index';
    const rows = await TU.locator(`#${this.gridId} div.ui-grid-viewport [ng-repeat="${repeat}"]`).all();
    return rows.length;
  }

  async create(grade) {
    await TU.buttons.create();

    await TU.input('GradeModalCtrl.grade.text', grade.text, this.modal);
    await TU.input('GradeModalCtrl.grade.code', grade.code, this.modal);
    await TU.input('GradeModalCtrl.grade.basic_salary', grade.basic_salary, this.modal);

    await TU.modal.submit();
    await notification.hasSuccess();
  }

  async errorOnCreateGrade() {
    await TU.buttons.create();
    await TU.modal.submit();
    await TU.validation.error('GradeModalCtrl.grade.text', this.modal);
    await TU.modal.cancel();
  }

  async update(code, newGrade) {
    const row = new GridRow(code);
    await row.dropdown();
    await row.edit();

    await TU.input('GradeModalCtrl.grade.text', newGrade.text, this.modal);
    await TU.input('GradeModalCtrl.grade.code', newGrade.code, this.modal);
    await TU.input('GradeModalCtrl.grade.basic_salary', newGrade.basic_salary, this.modal);

    await TU.modal.submit();
    await notification.hasSuccess();
  }

  async remove(code) {
    const row = new GridRow(code);
    await row.dropdown();
    await row.remove();

    await TU.modal.submit();
    await notification.hasSuccess();
  }
}

module.exports = GradePage;
