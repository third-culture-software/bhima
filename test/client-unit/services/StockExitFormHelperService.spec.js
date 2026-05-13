/* global inject, */
describe('test/client-unit/services/StockExitFormHelper', () => {

  let Helper;
  let $rootScope;

  //
  beforeEach(module(
    'bhima.services',
    'bhima.constants', 'ui.router', 'angularMoment', 'ngStorage', 'pascalprecht.translate',
    'ui.bootstrap',
    'tmh.dynamicLocale',
  ));

  beforeEach(inject((StockExitFormHelperService, _$rootScope_) => {
    Helper = StockExitFormHelperService;
    $rootScope = _$rootScope_;
  }));

  it('#getDescription() should return a correct description for stock loss', () => {
    const depot = { text : 'Depot 123' };
    const details = { exit_type : 'loss', description : 'Test' };

    let description = '';

    Helper.getDescription(depot, details)
      .then(text => {
        description = text;
      });

    $rootScope.$apply();

    expect(description).to.equal('STOCK.EXIT_LOSS - Test');
  });

  it('#getDescription() should return a correct description for exit to depot', () => {
    const depot = { text : 'Depot 123' };
    const details = { exit_type : 'depot', description : 'Test' };

    let description = '';

    Helper.getDescription(depot, details)
      .then(text => {
        description = text;
      });

    $rootScope.$apply();

    expect(description).to.equal('STOCK.EXIT_DEPOT - Test');
  });

  it('#getDescription() should return a correct description for services');
  it('#getDescription() should return a correct description for patients');

});
