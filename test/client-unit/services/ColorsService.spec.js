/* global inject, */
describe('test/client-unit/services/ColorService', () => {

  let ColorService;
  beforeEach(module(
    'bhima.services',
    'pascalprecht.translate'
  ));

  beforeEach(inject(_ColorService_ => {
    ColorService = _ColorService_;
  }));

  it('ColorService.list should return an array', () => {
    const colorList = ColorService.list;
    expect(colorList).to.be.a('array');
  });

});
