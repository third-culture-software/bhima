/* global inject, */

describe('test/client-unit/services/StockService', () => {

  // define modules
  beforeEach(module(
    'bhima.services',
    'bhima.constants',
    'bhima.StockMocks',
    'ngStorage',
    'tmh.dynamicLocale',
    'angularMoment',
    'pascalprecht.translate',
  ));

  let Stock;
  let StockFilterer;
  let MockStockData;

  // inject dependencies
  beforeEach(inject((_StockService_, _StockFilterer_, _MockStockDataService_) => {
    Stock = _StockService_;
    StockFilterer = _StockFilterer_;
    MockStockData = _MockStockDataService_;
  }));

  it('#statusLabelMap() returns the correct stock status label', () => {
    expect(Stock.statusLabelMap('stock_out')).to.be.equal('STOCK.STATUS.STOCK_OUT');
    expect(Stock.statusLabelMap('in_stock')).to.be.equal('STOCK.STATUS.IN_STOCK');
    expect(Stock.statusLabelMap('security_reached')).to.be.equal('STOCK.STATUS.SECURITY');
    expect(Stock.statusLabelMap('minimum_reached')).to.be.equal('STOCK.STATUS.MINIMUM');
    expect(Stock.statusLabelMap('over_maximum')).to.be.equal('STOCK.STATUS.OVER_MAX');
  });

  it('#processLotsFromStore() returns a flat array of lots from StockForm.store.data', () => {
    // the entityUuid parameter of processLotsFromStore function
    // this param is used to define the origin uuid of a lot
    const entityUuid = 'xxxe7870-0c8e-47d4-a7a8-a17a9924bxxx';

    // simulate the stock entry/adjustment form filled with one inventory
    // having two lots
    const mockStockFormStoreData = MockStockData.singleInventoryFormStoreData();

    // the expectated result after the call of processLotsFromStore
    // on mockStockFormStoreData
    const flatLotsArray = MockStockData.flatLotsFromSingleInventory();

    const result = Stock.processLotsFromStore([mockStockFormStoreData], entityUuid);
    expect(result).to.be.an('array');
    expect(result.length).to.be.equal(2);

    const [first, second] = result;
    expect(first).to.be.an('object');
    expect(second).to.be.an('object');
    expect(result).to.deep.equal(flatLotsArray);
  });

  it('#uniformSelectedEntity() format the displayName property for a given entity object', () => {
    const entityText = { text : 'Text supposed to be displayName' };
    const entityName = { name : 'Name supposed to be displayName' };
    const entityDisplayName = { display_name : 'Display_Name supposed to be displayName' };

    const uniformText = Stock.uniformSelectedEntity(entityText);
    const uniformName = Stock.uniformSelectedEntity(entityName);
    const uniformDisplayName = Stock.uniformSelectedEntity(entityDisplayName);

    expect(uniformText).to.have.property('displayName', entityText.text);
    expect(uniformName).to.have.property('displayName', entityName.name);
    expect(uniformDisplayName).to.have.property('displayName', entityDisplayName.display_name);
  });

  it('#getQueryString() returns a query string with parameters for a request', () => {
    const FILTER_KEY_MOVEMENT = 'movement';
    const FILE_TYPE_CSV = 'csv';
    const filterer = new StockFilterer(FILTER_KEY_MOVEMENT);

    // returns the string "?renderer=csv&limit=100"
    const query = filterer.getQueryString(FILE_TYPE_CSV);

    expect(query).to.include(`renderer=${FILE_TYPE_CSV}`);
    expect(query).to.include('limit=');
  });

});
