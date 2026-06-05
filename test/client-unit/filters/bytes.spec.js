/* global inject, */
describe('test/client-unit/filters/bytes filter', () => {

  let bytes;

  beforeEach(module('pascalprecht.translate', 'bhima.filters'));

  beforeEach(inject(($filter) => {
    bytes = $filter('bytes');
  }));

  const kb = 1024;
  const mb = 1024 * kb;
  const gb = 1024 * mb;
  const tb = 1024 * gb;

  it('formats to KB for KB sizes', () => {
    expect(bytes(1 * kb)).to.equal('1.0 FORM.LABELS.SIZE_KB');
    expect(bytes(50 * kb)).to.equal('50.0 FORM.LABELS.SIZE_KB');
    expect(bytes(33.33 * kb)).to.equal('33.3 FORM.LABELS.SIZE_KB');
  });

  it('formats to MB for MB sizes', () => {
    expect(bytes(1 * mb)).to.equal('1.0 FORM.LABELS.SIZE_MB');
    expect(bytes(50 * mb)).to.equal('50.0 FORM.LABELS.SIZE_MB');
    expect(bytes(33.33 * mb)).to.equal('33.3 FORM.LABELS.SIZE_MB');
  });

  it('formats to GB for GB sizes', () => {
    expect(bytes(1 * gb)).to.equal('1.0 FORM.LABELS.SIZE_GB');
    expect(bytes(50 * gb)).to.equal('50.0 FORM.LABELS.SIZE_GB');
    expect(bytes(33.33 * gb)).to.equal('33.3 FORM.LABELS.SIZE_GB');
  });

  it('formats to TB for TB sizes', () => {
    expect(bytes(1 * tb)).to.equal('1.0 FORM.LABELS.SIZE_TB');
    expect(bytes(50 * tb)).to.equal('50.0 FORM.LABELS.SIZE_TB');
    expect(bytes(33.33 * tb)).to.equal('33.3 FORM.LABELS.SIZE_TB');
  });

  it('changes the precision as necessary', () => {
    expect(bytes(33.33 * tb, 2)).to.equal('33.33 FORM.LABELS.SIZE_TB');
    expect(bytes(33.33 * tb, 0)).to.equal('33 FORM.LABELS.SIZE_TB');
  });

  it('handles NULL values with a minus sign', () => {
    expect(bytes()).to.equal('-');
    expect(bytes(null, 100)).to.equal('-');
    expect(bytes(undefined, 33)).to.equal('-');
  });

});
