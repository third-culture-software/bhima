/* global inject, */
describe('test/client-unit/filters/currency filter', () => {

  const FC = 1;
  const USD = 2;

  let $httpBackend;

  let currency;

  beforeEach(module(
    'bhima.services',
    'bhima.filters',
    'angularMoment',
    'ngStorage',
    'ui.router',
    'pascalprecht.translate',
  ));

  beforeEach(inject(($filter, _$httpBackend_) => {
    $httpBackend = _$httpBackend_;

    currency = $filter('currency');

    const currencies = [{
      id : 1,
      symbol : 'FC',
      format_key : 'fc',
      name : 'Congolese Francs',
      min_monentary_unit : 50,
    }, {
      id : 2,
      symbol : 'USD',
      format_key : 'usd',
      name : 'US Dollars',
      min_monentary_unit : 0.01,
    }, {
      id : 3,
      symbol : '€',
      format_key : 'EUR',
      name : 'Euro',
      min_monentary_unit : 0.01,
    }];

    const currencyInfo = {
      fc : {
        CURRENCY_SYM : 'FC',
        DECIMAL_SEP : ',',
        GROUP_SEP : '.',
        PATTERNS : [
          {
            gSize : 3,
            lgSize : 3,
            maxFrac : 3,
            minFrac : 0,
            minInt : 1,
            negPre : '-',
            negSuf : '',
            posPre : '',
            posSuf : '',
          },
          {
            gSize : 3,
            lgSize : 3,
            maxFrac : 2,
            minFrac : 2,
            minInt : 1,
            negPre : '-',
            negSuf : '\u00a0\u00a4',
            posPre : '',
            posSuf : '\u00a0\u00a4',
          },
        ],
      },
      usd : {
        CURRENCY_SYM : '$',
        DECIMAL_SEP : '.',
        GROUP_SEP : ',',
        PATTERNS : [
          {
            gSize : 3,
            lgSize : 3,
            maxFrac : 3,
            minFrac : 0,
            minInt : 1,
            negPre : '-',
            negSuf : '',
            posPre : '',
            posSuf : '',
          },
          {
            gSize : 3,
            lgSize : 3,
            maxFrac : 2,
            minFrac : 2,
            minInt : 1,
            negPre : '-\u00a4',
            negSuf : '',
            posPre : '\u00a4',
            posSuf : '',
          },
        ],
      },
      euro : {},
    };

    $httpBackend.when('GET', '/currencies')
      .respond(currencies);

    $httpBackend.when('GET', '/i18n/currency/fc.json')
      .respond(currencyInfo.fc);

    $httpBackend.when('GET', '/i18n/currency/usd.json')
      .respond(currencyInfo.usd);

    $httpBackend.when('GET', '/i18n/currency/eur.json')
      .respond(currencyInfo.euro);
  }));

  // make sure $http is clean after tests
  afterEach(() => {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('formats plain positive numbers', () => {
    $httpBackend.flush();
    expect(currency(4.4, FC)).to.equal('4,40 FC');
    expect(currency(4.4, USD)).to.equal('$4.40');
  });

  it('formats plain negative numbers', () => {
    $httpBackend.flush();
    expect(currency(-4.4, FC)).to.equal('-4,40 FC'); // <-- non-breaking space
    expect(currency(-4.4, USD)).to.equal('-$4.40');
  });

  it('formats infinities', () => {
    $httpBackend.flush();
    expect(currency(Infinity, FC)).to.equal('∞ FC');
    expect(currency(-1 * Infinity, FC)).to.equal('-∞ FC');
  });

  it('formats numbers with exponents', () => {
    $httpBackend.flush();
    expect(currency(4.4e3, FC)).to.equal('4.400,00 FC');
    expect(currency(-4.4e3, FC)).to.equal('-4.400,00 FC');
    expect(currency(4.4e3, USD)).to.equal('$4,400.00');
    expect(currency(-4.4e3, USD)).to.equal('-$4,400.00');
  });

  it('formatting kills numbers with large negative exponents', () => {
    $httpBackend.flush();
    expect(currency(4.4e-8, FC)).to.equal('0.00 FC');
    expect(currency(4.4e-8, USD)).to.equal('$0.00');
  });

  it('formats formats with number of digits after the decimal', () => {
    $httpBackend.flush();
    expect(currency(4.5463, USD, 0)).to.equal('$5');
    expect(currency(4.4356, USD, 0)).to.equal('$4');
    expect(currency(4.4356, USD, 1)).to.equal('$4.4');
    expect(currency(4.4356, USD, 2)).to.equal('$4.44');
    expect(currency(4.4356, USD, 3)).to.equal('$4.436');
    expect(currency(4.4356, USD, 4)).to.equal('$4.4356');
    expect(currency(4.4356, USD, 5)).to.equal('$4.43560');
  });

});
