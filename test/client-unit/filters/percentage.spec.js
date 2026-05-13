/* global inject, */
describe('test/client-unit/filters/percentage filter', () => {

  let percentage;

  beforeEach(module('pascalprecht.translate', 'bhima.filters'));

  beforeEach(inject(($filter) => {
    percentage = $filter('percentage');
  }));

  it('returns an empty string for undefined', () => {
    expect(percentage()).to.equal('');
    expect(percentage(undefined)).to.equal('');
  });

  it('returns an empty string if the value is not a number', () => {
    const string = 'string';
    expect(percentage(string)).to.equal('');
    expect(percentage({ id : 1 })).to.equal('');
    expect(percentage([1, 2, 3, 4])).to.equal('');
  });

  it('returns a percent value for a numeric input', () => {
    expect(percentage(100)).to.equal('100%');
    expect(percentage(0.6)).to.equal('0.6%');
    expect(percentage(19)).to.equal('19%');
    expect(percentage(0)).to.equal('0%');
    expect(percentage(3000)).to.equal('3000%');
    expect(percentage(0.0012)).to.equal('0%');
  });
});
