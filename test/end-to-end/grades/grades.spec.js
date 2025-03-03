const { chromium } = require('@playwright/test');
const { test, expect } = require('@playwright/test');
const TU = require('../shared/TestUtils');

const GradePage = require('./grades.page');

test.beforeAll(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  TU.registerPage(page);
  await TU.login();
});

test.describe('Grades Management', () => {

  let page;

  // navigate to the page
  test.beforeEach(async () => {
    await TU.navigate('/#!/grades');
    await TU.waitForSelector('.ui-grid-canvas');
    page = await GradePage.new();
  });

  const grade = {
    text : 'New Grade',
    code : 'E2G',
    basic_salary : 150,
  };

  const updateGrade = {
    text : 'Update Grade',
    code : 'EUG',
    basic_salary : 450,
  };

  test('begins with 19 grades', async () => {
    expect(await page.count()).toBe(19);
  });

  test('successfully creates a new grade', async () => {
    await page.create(grade);
  });

  test('successfully edits a grade', async () => {
    await page.update(grade.code, updateGrade);
  });

  test(`doesn't create a record when grade name is incorrect`, async () => {
    await page.errorOnCreateGrade();
  });

  test('successfully delete a grade', async () => {
    await page.remove(updateGrade.code);
  });
});
