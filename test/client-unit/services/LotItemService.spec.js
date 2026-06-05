/* global inject,  chai */

describe('test/client-unit/services/LotItemService', () => {

  const expireInOneYear = (new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)).toISOString();

  let Lot;

  const dataset = [{
    inventory_uuid : 'AEB32D6B20E246B2AFC0F2073B02031E',
    lot_uuid : '7816E65CC003490C85182F4643DDE2EF',
    quantity : 900,
    code : '119-110',
    text : 'Acide   Folique 5 mg / Ces',
    group_uuid : '1410DFE0B47811E5B297023919D3D5B0',
    expiration_date : expireInOneYear,
    is_expired : 0,
    label : 'ME33',
    unit_type : 'Ces',
    tracking_expiration : 1,
    tracking_consumption : 1,
  }, {
    inventory_uuid : 'C6AA66DFB75E48B9BE28CEF20904B0C5',
    lot_uuid : '9E03B48436824504982626DD91812196',
    quantity : 140,
    code : '120-629',
    text : 'Adalate (Nifedipine) de 20 mg / Ces',
    group_uuid : '1410DFE0B47811E5B297023919D3D5B0',
    expiration_date : '2022-06-06T23:00:00.000Z',
    is_expired : 0,
    label : '9G15',
    unit_type : 'Ces',
    tracking_expiration : 1,
    tracking_consumption : 1,
  }, {
    inventory_uuid : '5AFE78DA27C440FBAD69766534548D9F',
    lot_uuid : 'F42ED2003FA14E6A83DFCBB77EA738F0',
    quantity : 90,
    code : '123-414',
    text : 'Adrenaline 1mg / ml 1 ml Inject',
    group_uuid : '1410DFE0B47811E5B297023919D3D5B0',
    expiration_date : '2023-03-06T23:00:00.000Z',
    is_expired : 0,
    label : '200911',
    unit_type : 'ml',
    tracking_expiration : 1,
    tracking_consumption : 1,
  }, {
    inventory_uuid : '3CADADC9AB6640BCA1645AD689933635',
    lot_uuid : 'D0777E0F3F3741718917CD5A13CE4F51',
    quantity : 80,
    code : '107-098',
    text : 'Aiguille 21 G',
    group_uuid : '1410DFE0B47811E5B297023919D3D5B0',
    expiration_date : '2025-10-29T23:00:00.000Z',
    is_expired : 1,
    label : '2010004',
    unit_type : 'piece',
    tracking_expiration : 0,
    tracking_consumption : 1,
  }];

  beforeEach(module('bhima.services', 'pascalprecht.translate'));

  beforeEach(inject(_LotItemService_ => {
    Lot = _LotItemService_;
  }));

  it('#constructor() creates a new lot that passes validation', () => {
    const lot = new Lot(dataset[0]);

    expect(lot.uuid).to.have.lengthOf(36);
    expect(lot.validate()).to.equal(true);
    expect(lot.isExpired()).to.equal(false);
    expect(lot.hasLotInformation()).to.equal(true);
    expect(lot.hasInventoryInformation()).to.equal(true);

    expect(lot.isEmpty()).to.equal(false);
    expect(lot.isAsset()).to.equal(false);

    expect(lot._initialised).to.equal(true);
  });

  it('#constructor() calls #configure()', () => {
    const spy = chai.spy.on(Lot.prototype, 'configure');
    const lot = new Lot(dataset[0]);
    expect(spy).to.have.been.called();
    expect(lot._initialised).to.equal(true);
  });

  it('#configure() updates information on the lot', () => {
    const lot = new Lot(dataset[0]);

    expect(lot.inventory_uuid).to.equal('AEB32D6B20E246B2AFC0F2073B02031E');
    expect(lot.lot_uuid).to.equal('7816E65CC003490C85182F4643DDE2EF');
    expect(lot.quantity).to.equal(900);
    expect(lot.text).to.equal('Acide   Folique 5 mg / Ces');
    expect(lot.code).to.equal('119-110');

    expect(lot.group_uuid).to.equal('1410DFE0B47811E5B297023919D3D5B0');
    const expDate = new Date(expireInOneYear);
    expect(lot.expiration_date.toString()).to.equal(expDate.toString());

    // now, reconfigure the lot
    lot.configure(dataset[1]);

    expect(lot.inventory_uuid).to.equal('C6AA66DFB75E48B9BE28CEF20904B0C5');
    expect(lot.lot_uuid).to.equal('9E03B48436824504982626DD91812196');
    expect(lot.quantity).to.equal(140);
    expect(lot.text).to.equal('Adalate (Nifedipine) de 20 mg / Ces');
    expect(lot.code).to.equal('120-629');
    expect(lot.group_uuid).to.equal('1410DFE0B47811E5B297023919D3D5B0');

    const expDate2 = new Date('2022-06-06T23:00:00.000Z');
    expect(lot.expiration_date.toString()).to.equal(expDate2.toString());
  });

  it('#isExpired() returns true if the lot expired yesterday', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const lot = new Lot({ expiration_date : yesterday });
    expect(lot.isExpired()).to.equal(true);
  });

  it('#isExpired() returns false if the lot expires tomorrow', () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const lot = new Lot({ expiration_date : tomorrow });
    expect(lot.isExpired()).to.equal(false);
  });

  it('#isExpired() checks against a comparison date', () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const lot = new Lot({ expiration_date : new Date() });

    // the way to think about this is "lot is expired from yesterday's perspective".
    expect(lot.isExpired(yesterday)).to.equal(false);
    expect(lot.isExpired(tomorrow)).to.equal(true);
  });

  it('#isExpired() returns false if not tracking expiration', () => {
    const lot = new Lot({ expiration_date : new Date(), tracking_expiration : false });
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    expect(lot.isExpired(yesterday)).to.equal(false);
    expect(lot.isExpired(tomorrow)).to.equal(false);

    // Even reconfigure with the is_expired flag from the server, the
    // tracking_expiration flag is given precedence
    lot.configure({ is_expired : 1 });

    expect(lot.isExpired(tomorrow)).to.equal(false);
    expect(lot.isExpired(yesterday)).to.equal(false);
  });

  it('#isExpired() will default to the is_expired property', () => {
    const lot = new Lot({ expiration_date : new Date(), is_expired : 0 });
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    expect(lot.isExpired(tomorrow)).to.equal(false);
    expect(lot.isExpired(yesterday)).to.equal(false);

    lot.configure({ is_expired : undefined });

    expect(lot.isExpired(tomorrow)).to.equal(true);
    expect(lot.isExpired(yesterday)).to.equal(false);
  });

  it('#isEmpty() returns true if the quantity is 0', () => {
    const lot = new Lot(dataset[2]);
    expect(lot.isEmpty()).to.equal(false);

    lot.configure({ quantity : 0 });
    expect(lot.isEmpty()).to.equal(true);
  });

  it('#setAsset() sets the lot to be an asset type', () => {
    const lot = new Lot(dataset[2]);
    expect(lot.isAsset()).to.equal(false);

    lot.setAsset(true);
    expect(lot.isAsset()).to.equal(true);

    lot.setAsset(false);
    expect(lot.isAsset()).to.equal(false);
  });

  it('#hasLotInformation() return true when the lot is configured', () => {
    const lot = new Lot();

    expect(lot.hasLotInformation()).to.equal(false);
    expect(lot._errors).to.have.lengthOf(1);

    lot.configure(dataset[2]);
    expect(lot.hasLotInformation()).to.equal(true);
  });

  it('#hasInventoryInformation() return true when the lot is configured', () => {
    const lot = new Lot();

    expect(lot.hasInventoryInformation()).to.equal(false);
    expect(lot._errors).to.have.lengthOf(1);
    lot.configure(dataset[2]);
    expect(lot.hasInventoryInformation()).to.equal(true);
    expect(lot._errors).to.have.lengthOf(0);
  });

  it('#isUnused() returns true stock available but unused', () => {
    const lot = new Lot({ ...dataset[1] });
    expect(lot.isUnused()).to.equal(false);
    lot.quantity = 0;
    expect(lot.isUnused()).to.equal(true);
    lot.quantity = 1;
    expect(lot.isUnused()).to.equal(false);
  });

  it('#hasPositiveQuantity() returns true if the quantity is greater than or equal to 0', () => {
    const lot = new Lot({ ...dataset[1] });
    expect(lot.hasPositiveQuantity()).to.equal(true);
    lot.quantity = 0;
    expect(lot.hasPositiveQuantity()).to.equal(true);
    lot.quantity = 1;
    expect(lot.hasPositiveQuantity()).to.equal(true);
    lot.quantity = -1;
    expect(lot.hasPositiveQuantity()).to.equal(false);

    // note that there is no upper-bound
    lot.quantity = Infinity;
    expect(lot.hasPositiveQuantity()).to.equal(true);
  });

  it('#hasEnoughQuantityAvailable() returns true if quantity less than total available', () => {
    const lot = new Lot({ ...dataset[1] });

    const initialQuantity = lot.quantity;
    expect(lot.hasEnoughQuantityAvailable()).to.equal(true);

    // set quantity to 0
    lot.quantity = 0;
    expect(lot.hasEnoughQuantityAvailable()).to.equal(true);

    // set quantity to max possible
    lot.quantity = initialQuantity;
    expect(lot.hasEnoughQuantityAvailable()).to.equal(true);

    // set quantity to one over max possible
    lot.quantity = initialQuantity + 1;
    expect(lot.hasEnoughQuantityAvailable()).to.equal(false);
  });

  it('#errors() returns a list of error codes', () => {
    const example = { ...dataset[0] };
    delete example.is_expired;

    const futureDate = new Date('2222-01-01');
    const lot = new Lot(example);

    expect(lot.errors()).to.have.lengthOf(0);

    // set a past date as the comparison to determine expiration
    expect(lot.isExpired(futureDate)).to.equal(true);
    expect(lot.errors()).to.deep.equal(['STOCK.ERRORS.LOT_EXPIRED']);

    // set an invalid quantity
    lot.quantity = -1;
    expect(lot.hasPositiveQuantity()).to.equal(false);
    expect(lot.errors()).to.deep.equal(['STOCK.ERRORS.LOT_EXPIRED', 'STOCK.ERRORS.LOT_NEGATIVE_QUANTITY']);

    // recompute the expiration date to leave only a single error
    expect(lot.isExpired()).to.equal(false);
    expect(lot.errors()).to.deep.equal(['STOCK.ERRORS.LOT_NEGATIVE_QUANTITY']);

    // restore quantity and recompute validation.
    lot.quantity = 1;
    expect(lot.validate()).to.equal(true);
    expect(lot.errors()).to.deep.equal([]);

    // screw everything up and check error codes
    lot.quantity = -10;
    delete lot.inventory_uuid;
    delete lot.label;

    // these error codes are stored in a Set() so they are returned
    // in the order they are inserted.
    expect(lot.validate(futureDate)).to.equal(false);
    expect(lot.errors()).to.deep.equal([
      'STOCK.ERRORS.LOT_MISSING_INVENTORY_INFO',
      'STOCK.ERRORS.LOT_MISSING_LOT_INFO',
      'STOCK.ERRORS.LOT_NEGATIVE_QUANTITY',
      'STOCK.ERRORS.LOT_EXPIRED',
    ]);
  });

  it('#validate() returns true for a valid inventory', () => {
    const lot = new Lot(dataset[1]);

    expect(lot.isExpired()).to.equal(false);
    expect(lot.hasInventoryInformation()).to.equal(true);
    expect(lot.hasLotInformation()).to.equal(true);
    expect(lot.isEmpty()).to.equal(false);

    expect(lot.validate()).to.equal(true);
    expect(lot._errors).to.have.lengthOf(0);
  });

  it('#validate() takes an optional parameter to ignore expiration date', () => {
    const lot = new Lot(dataset[1]);

    delete lot.is_expired;

    // set expiration date into the past
    const lastYear = new Date(Date.now() - (1000 * 60 * 60 * 24 * 365));

    lot.configure({ expiration_date : lastYear });

    expect(lot.hasInventoryInformation()).to.equal(true);
    expect(lot.hasLotInformation()).to.equal(true);
    expect(lot.isEmpty()).to.equal(false);
    expect(lot.isExpired()).to.equal(true);

    // despite past expiration date (and isExpired() being true), validation still passes
    expect(lot.validate(new Date(), false)).to.equal(true);
    expect(lot._errors).to.have.lengthOf(0);
  });

});
