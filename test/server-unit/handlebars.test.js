const hbs = require('../../server/lib/template');

const { describe, it }= require('node:test');
const assert = require('node:assert/strict');

// mock handlebars template file
const template = 'test/fixtures/file.handlebars';
const customHelpersTemplate = 'test/fixtures/custom-helpers.handlebars';

// mock data
const data = {
  developer : 'developer',
  message : 'You are a tourist :-)',
  developer_message : 'You are a developer',
};

// mock for custom helpers
const dateItem = new Date('1990-01-01');

/// mock the age of 9 years by setting the date to 9 years ago from now
const ageItem = new Date();
ageItem.setFullYear(ageItem.getFullYear() - 9); 

const equalItem = 'developer';

describe('test/server-unit/handlebars', () => {

  it('#handlebars.render() renders correctly template with corresponding data', async () => {

    // check for defined `developer` return the developer's message
    const result1 = await hbs.render(template, data);
    assert.equal(result1, `<html>${data.developer_message}</html>`, 'The rendered template should match the expected output');

    // check for undefined `developer` return the tourist's message
    delete data.developer;
    const result2 = await hbs.render(template, data);
    assert.equal(result2, `<html>${data.message}</html>`, 'The rendered template should match the expected output');
  });

  it('#helpers.date() render a custom date format YYYY-MM-DD', async () => {
    const param = { dateItem };
    const result = await hbs.render(customHelpersTemplate, param);
    assert.equal(result.trim(), "1990-01-01", 'The rendered date should match the expected format YYYY-MM-DD');
  });

  it('#helpers.age() render the difference of year between now and a given date', async () => {
    const param = { ageItem };
    const result = await hbs.render(customHelpersTemplate, param);
    assert.equal(result.trim(), '9', 'The rendered age should match the expected value');
  });

  it('#helpers.look() return a given property of an object', async () => {
    const param = { lookItem : { content : 'I am the content' } };
    const result = await hbs.render(customHelpersTemplate, param);
    assert.equal(result.trim(), 'I am the content', 'The rendered content should match the expected value');
  });

  it('#helpers.equal() compare two value `a` and `b` {{#equal `a` `b`}}', async () => {
    const param = { equalItem };
    const result = await hbs.render(customHelpersTemplate, param);
    assert.equal(result.trim(), 'true', 'The rendered output should be "true" when the values are equal');
  });

  it('#helpers.gt() compare if a >= b {{#gt `a` `b`}}', async () => {
    let param = { gtItem : 17, gtValue : 10 };
    let result = await hbs.render(customHelpersTemplate, param);
    assert.equal(result.trim(), 'true', 'The rendered output should be "true" when the values are greater or equal');

    // compare if 17 >= 20
    param = { gtItem : 17, gtValue : 20 };
    result = await hbs.render(customHelpersTemplate, param);
    assert.equal(result.trim(), 'false', 'The rendered output should be "false" when the values are not greater or equal');
  });

  it('#helpers.lt() compare if a < b {{#lt `a` `b`}}', async () => {
    let param = { ltItem : 7, ltValue : 10 };
    let result = await hbs.render(customHelpersTemplate, param);
    assert.equal(result.trim(), 'true', 'The rendered output should be "true" when the first value is less than the second value');

    param = { ltItem: 7, ltValue : 2 };
    result = await hbs.render(customHelpersTemplate, param);
    assert.equal(result.trim(), 'false', 'The rendered output should be "false" when the first value is not less than the second value.')
  });
});
