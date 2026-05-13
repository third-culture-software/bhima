/* global inject, */
describe('test/client-unit/filters/telephone filter', () => {

  let telephone;

  beforeEach(module('pascalprecht.translate', 'bhima.filters'));

  beforeEach(inject(($filter) => {
    telephone = $filter('telephone');
  }));

  it('returns an empty string if telephone number is undefined', () => {
    expect(telephone()).to.equal('');
    expect(telephone(false)).to.equal('');
    expect(telephone(undefined)).to.equal('');
  });

  it('returns the input if the input is not a telephone number', () => {
    expect(telephone(true)).to.equal(true);
    expect(telephone({ id : 1 })).to.deep.equal({ id : 1 });
    expect(telephone('hello world')).to.equal('hello world');
    expect(telephone(1234)).to.equal(1234);
    expect(telephone('12z34')).to.equal('12z34');
  });

  it('returns formats a telephone number correctly', () => {
    expect(telephone(243829091111)).to.equal('+243 (82) 909-1111');
    expect(telephone('+243829091111')).to.equal('+243 (82) 909-1111');

    // FIXME(@jniles) - the telephone number defaults to the USA for country code
    expect(telephone('0829091111')).to.equal('+1 (082) 909-1111');
    expect(telephone(14041932231)).to.equal('+1 (404) 193-2231');
  });

  it.skip('should default to the RDC country code', () => {
    expect(telephone('0819091111')).to.equal('+243 (081) 909-1111');
  });

});
