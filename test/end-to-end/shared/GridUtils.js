/* eslint-disable no-unused-vars */

const { expect } = require('@playwright/test');
const TU = require('./TestUtils');
const { by } = require('./TestUtils');

/**
 * Get the element with gridId
 * @param {string} gridId - the html ID for the desired element
 * @returns {Promise} of the locator for element with gridId
 */
function getGrid(gridId) {
  return TU.locator(by.id(gridId));

  // ADAPTED FROM PROTRACTOR CODE:
  // return element(by.id(gridId));
}

/**
 * Get an array of the column header cells
 * @param {string} gridId - the id of the grid
 * @returns {Array} an array of locators for all the column header cells in the grid
 */
async function getColumnHeaders(gridId) {
  const grid = await getGrid(gridId);
  const repeater = '[ng-repeat="col in colContainer.renderedColumns track by col.uid"]';
  const header = await grid.locator(`.ui-grid-render-container-body .ui-grid-header ${repeater}`);
  return header.all();

  // ADAPTED FROM PROTRACTOR CODE:
  // return getGrid(gridId)
  //   .element(by.css('.ui-grid-render-container-body'))
  //   .element(by.css('.ui-grid-header'))
  //   .all(by.repeater('col in colContainer.renderedColumns track by col.uid'));
}

/**
 * Return an array of locators for the all the rows in the grid
 * @param {string} gridId - the id of the grid
 * @returns {Array} - the array of locators for the rows
 */
async function getRows(gridId) {
  const grid = await getGrid(gridId);
  const repeater = '[ng-repeat="(rowRenderIndex, row) in rowContainer.renderedRows track by $index"]';
  const rows = await grid.locator(`.ui-grid-render-container-body ${repeater}`);
  return rows.all();

  // ADAPTED FROM PROTRACTOR CODE:
  // return getGrid(gridId)
  //   .element(by.css('.ui-grid-render-container-body'))
  //   .all(by.repeater('(rowRenderIndex, row) in rowContainer.renderedRows track by $index'));
}

/**
 * Helper function for returning a row.
 * @param {string} gridId - Id of the grid
 * @param {number} rowNum - row number
 * @returns {Promise} - promise of for the desired row
 * @example
 * <pre>
 *   const row = await gridUtils.getRow( 'myGrid', 0); //or internally
 * </pre>
 */
async function getRow(gridId, rowNum) {
  const rows = await getRows(gridId);
  return rows[rowNum];

  // ADAPTED FROM PROTRACTOR CODE:
  // return getGrid(gridId)
  //   .element(by.repeater('(rowRenderIndex, row) in rowContainer.renderedRows track by $index').row(rowNum));
}

/**
 * Get a locator for a specific cell in a grid
 * @param {string} gridId - the grid id
 * @param {number} rowNum - the row (starts with 0)
 * @param {number} colNum - the row (starts with 0)
 * @returns {object} the locator for the cell
 */
async function getCell(gridId, rowNum, colNum) {
  const rows = await getRows(gridId);
  const row = rows[rowNum];
  const repeater = by.repeater('(colRenderIndex, col) in colContainer.renderedColumns track by col.uid');
  const cols = await row.locator(repeater);
  return cols.nth(colNum);

  // ADAPTED FROM PROTRACTOR CODE:
  // return getGrid(gridId)
  //   .element(by.css('.ui-grid-render-container-body'))
  //   .element(by.repeater('(rowRenderIndex, row) in rowContainer.renderedRows track by $index').row(row))
  //   .element(by.repeater('(colRenderIndex, col) in colContainer.renderedColumns track by col.uid').row(col));
}

/**
 *
 * @param gridId
 * @param rowNum
 * @param colNum
 */
async function getCellName(gridId, rowNum, colNum) {
  throw Error('GridUtils getCellName is not implemented');

  // ADAPTED FROM PROTRACTOR CODE:
  // return getGrid(gridId)
  //   .element(by.css('.ui-grid-render-container-body'))
  //   .element(by.repeater('(rowRenderIndex, row) in rowContainer.renderedRows track by $index').row(row))
  //   .element(by.repeater('(colRenderIndex, col) in colContainer.renderedColumns track by col.colDef.name').row(col));
}

/**
 * Check to make sure that the grid has the specified number of rows
 * @param {string} gridId - the id of the grid
 * @param {number} number - expected number of rows (can be a list of numbers)
 * @param {string} message - error message
 */
async function expectRowCount(gridId, number, message) {
  await TU.waitForSelector('div.ui-grid-canvas');
  const rows = await getRows(gridId);
  if (Array.isArray(number)) {
    expect(number.includes(rows.length), message);
  } else {
    expect(rows.length, message).toBe(number);
  }

  // ADAPTED FROM PROTRACTOR CODE:
  // const rows = getRows(gridId);
  // expect(await rows.count(), message).to.equal(number);
}

/**
 * Make sure the number of columns is greater than a specified number
 * @param {string} gridId - the id of the grid
 * @param {number} number - expect the number of columns to be greater than this
 */
async function expectRowCountAbove(gridId, number) {
  await TU.waitForSelector('.ui-grid-render-container-body');
  const rows = await getRows(gridId);

  if (Array.isArray(number)) {
    throw Error('GridUtils.expectRowCountAbove cannot take an array');
  }

  expect(rows.length).toBeGreaterThan(number);

  // ADAPTED FROM PROTRACTOR CODE:
  // const rows = getRows(gridId);
  // expect(await rows.count()).to.be.above(number);
}

/**
 * assert that the grids's column count is the number passed in
 * @param {string} gridId - Id of the grid
 * @param {number} number - expected number of columns
 * @param {string} message - error message
 */
async function expectColumnCount(gridId, number, message) {
  const cols = await getColumnHeaders(gridId);
  expect(cols.length, message).toBe(number);

  // ADAPTED FROM PROTRACTOR CODE:
  // const columns = getColumns(gridId);
  // expect(await columns.count()).to.equal(number);
}

/**
 * Find the first grid cell containing the 'text'
 * @param {string} gridId - id for the grid
 * @param {string} text - string to search for
 * @returns {object} - indexes of the match (nulls if not found): { rowIndex : <number>, columnIndex : <number> }
 */
async function getGridIndexesMatchingText(gridId, text) {

  // console.warn('Warning: You called GU.getGridIndexesMatchingText() which is extremely inefficient.');
  const grid = await this.getGrid(gridId);
  const gridBody = await grid.locator('.ui-grid-render-container-body');
  const rowsRaw = await gridBody.locator(by.repeater('(rowRenderIndex, row) in rowContainer.renderedRows track by $index'));
  const rows = await rowsRaw.all();

  if (rows) {
    for (let j = 0; j < rows.length; j++) {
       
      const cols = await rows[j].locator(by.repeater('(colRenderIndex, col) in colContainer.renderedColumns track by col.uid')).all();
      for (let i = 0; i < cols.length; i++) {
        const col = cols[i];
         
        const count = await col.locator(`//*[contains(text(), '${text}')]`).count();
        if (count > 0) {
          return ({ rowIndex : j, columnIndex : i });
        }
      }
    }
  }

  return ({ rowIndex : null, columnIndex : null });

  // ADAPTED FROM PROTRACTOR CODE:
  // // loop through every single cell and check that the grid's value contains this provided value
  // return this.getGrid(gridId)
  //   .element(by.css('.ui-grid-render-container-body'))
  //   .all(by.repeater('(rowRenderIndex, row) in rowContainer.renderedRows track by $index'))
  //   .each((row, rowIndex) => row.all(by.repeater('(colRenderIndex, col) in colContainer.renderedColumns track by col.uid'))
  //     .each((column, columnIndex) => column.getText()
  //       .then(elementText => {
  //         if (elementText.includes(text)) {
  //           rowIdx = rowIndex;
  //           colIdx = columnIndex;
  //         }
  //       })))
  //   .then(() => ({ rowIndex : rowIdx, columnIndex : colIdx }));
}

/**
 * Makes sure the expected columns actually all appear in the grid
 * @param {string} gridId - grid ID
 * @param {Array} expectedColumns - array of expected columns
 */
async function expectHeaderColumns(gridId, expectedColumns) {
  throw Error('GridUtils expectHeaderColumns has not been tested');

  // The following test has been migrated but not tested
  // const columns = await this.getColumnHeaders(gridId);
  // const headerColumns = await Promise.all(columns.map(col => col.innerText()));
  // const actualSet = new Set(headerColumns.sort());
  // const expectedSet = new Set(expectedColumns.sort());
  // expect(headerColumns.length).toBe(expectedColumns.length);
  // expect(actualSet).toEqual(expectedColumns);
}

/**
 * Return true if all the expected column headers are present in the grid
 * @param {string} gridId - grid ID
 * @param {Array} expectedColumns - array of expected column headers
 * @returns {boolean} success
 */
async function expectHeaderColumnsContained(gridId, expectedColumns) {
  const columns = await this.getColumnHeaders(gridId);
  const headerColumns = await Promise.all(columns.map(col => col.innerText()));
  return expectedColumns.every(col => headerColumns.includes(col));
}

/**
 * Helper function to select a row.
 * @param {string} gridId - the id of the grid
 * @param {number} rowNum - number of the desired row
 * @returns {Promise} promise of the result of clicking on the row to select it
 * @example
 * <pre>
 *   const row = await gridUtils.selectRow( 'myGrid', 0 );
 * </pre>
 */
async function selectRow(gridId, rowNum) {
  const grid = await getGrid(gridId);
  const ports = await grid.locator('[ui-grid-viewport]');
  const selPort = await ports.nth(0);
  const selBtns = await selPort.locator('.ui-grid-selection-row-header-buttons');
  const selBtn = selBtns.nth(rowNum);
  return selBtn.click();

  // ADAPTED FROM PROTRACTOR CODE:
  // const row = getRow(gridId, rowNum);
  // const btn = row.element(by.css('.ui-grid-selection-row-header-buttons'));
  // return btn.click();
}

/**
 * Unselect all rows
 * @param {number} gridId - number of the desired row
 */
async function clearRowSelections(gridId) {
  const grid = await getGrid(gridId);
  const ports = await grid.locator('[ui-grid-viewport]');
  const selPort = await ports.nth(0);
  const selBtns = await selPort.locator('.ui-grid-selection-row-header-buttons').all();

  if (selBtns) {
     
    for (let j = 0; j < selBtns.length; j++) {
      const elt = selBtns[j];
      const checked = await elt.isChecked();
      if (checked) {
        await elt.setChecked(false);
      }
    }
     
  }
}

/**
 * Selects all rows in the grid.
 * @param {string} gridId - the id of the grid that you want to select
 * @returns {Promise} for the selecting click
 */
function selectAll(gridId) {
  throw Error('GridUtils expectColumnCount is not implemented');

  // ADAPTED FROM PROTRACTOR CODE:
  // const row = getGrid(gridId).$('ui-grid-header');
  // const btn = row.$('.ui-grid-selection-row-header-buttons');
  // return btn.click();
}

/**
 * Checks that a cell matches the specified value,
 * takes a regEx or a simple string.
 * @param {string} gridId - the id of the grid that you want to inspect
 * @param {number} row - the number of the row (within the visible rows)
 * that you want to check the value of
 * @param {number} col - the number of the column (within the visible columns)
 * that you want to check the value of
 * @param {string} value - a regex or string (or list) of the value(s) you expect in that cell
 * @example
 * <pre>
 *   gridTestUtils.expectCellValueMatch('myGrid', 0, 2, 'CellValue');
 * </pre>
 */
async function expectCellValueMatch(gridId, row, col, value) {
  const dataCell = await getCell(gridId, row, col);
  const text = await dataCell.innerText();
  if (Array.isArray(value)) {
    expect(value.includes(text));
  } else {
    expect(text).toBe(value);
  }

  // ADAPTED FROM PROTRACTOR CODE:
  // const dataCell = getCell(gridId, row, col);
  // expect(await dataCell.getText()).to.equal(value);
}

exports.getGrid = getGrid;
exports.getRows = getRows;
exports.getRow = getRow;
exports.getColumnHeaders = getColumnHeaders;
exports.getCell = getCell;
exports.getGridIndexesMatchingText = getGridIndexesMatchingText;
exports.getCellName = getCellName;
exports.expectRowCount = expectRowCount;
exports.expectRowCountAbove = expectRowCountAbove;
exports.expectColumnCount = expectColumnCount;
exports.expectHeaderColumns = expectHeaderColumns;
exports.expectHeaderColumnsContained = expectHeaderColumnsContained;
exports.selectRow = selectRow;
exports.selectAll = selectAll;
exports.clearRowSelections = clearRowSelections;
exports.expectCellValueMatch = expectCellValueMatch;
