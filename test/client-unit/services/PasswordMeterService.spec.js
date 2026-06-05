/* global inject, */

describe('test/client-unit/services/PasswordMeterService', () => {
  let PasswordMeterService;
  let Session;

  beforeEach(module(
    'ngStorage',
    'angularMoment',
    'bhima.services',
    'bhima.mocks',
    'ui.router'
  ));

  const WEAK_PASSWORD = 'hello';
  const MEDIUM_PASSWORD = 'L0b1Ec0simba';
  const STRONG_PASSWORD = 'N@pM@ch3N#L1my3B0ndy3@!';

  beforeEach(inject((_PasswordMeterService_, _SessionService_, _MockDataService_) => {
    PasswordMeterService = _PasswordMeterService_;
    Session = _SessionService_;

    const user = _MockDataService_.user();
    const project = _MockDataService_.project();
    const stockSettings = _MockDataService_.stock_settings();
    const enterprise = _MockDataService_.enterprise();
    Session.create(user, enterprise, stockSettings, project);

    // make sure password validation is on
    Session.enterprise.settings.enable_password_validation = true;
  }));

  it('#constructor() should expose validate and counter methods', () => {
    expect(PasswordMeterService.counter).to.be.a('function');
    expect(PasswordMeterService.validate).to.be.a('function');
  });

  it('#counter() should return -1 for no password', () => {
    const count = PasswordMeterService.counter();
    expect(count).to.equal(-1);
  });

  it('#validate() should return false for no password', () => {
    const validate = PasswordMeterService.validate();
    expect(validate).to.equal(false);
  });

  it('#counter() should return 0 for a weak password', () => {
    const count = PasswordMeterService.counter(WEAK_PASSWORD);
    expect(count).to.equal(0);
  });

  it('#validate() should return false for a weak password', () => {
    const validate = PasswordMeterService.validate(WEAK_PASSWORD);
    expect(validate).to.equal(false);
  });

  it('#counter() should return 3 for a medium password', () => {
    const count = PasswordMeterService.counter(MEDIUM_PASSWORD);
    expect(count).to.equal(3);
  });

  it('#validate() should return true for a medium password', () => {
    const validate = PasswordMeterService.validate(MEDIUM_PASSWORD);
    expect(validate).to.equal(true);
  });

  it('#counter() should return 4 for a strong password', () => {
    const count = PasswordMeterService.counter(STRONG_PASSWORD);
    expect(count).to.equal(4);
  });

  it('#validate() should return true for a strong password', () => {
    const validate = PasswordMeterService.validate(STRONG_PASSWORD);
    expect(validate).to.equal(true);
  });

  it('#validate() should return true even if the enterprise session is not set', () => {
    // this is useful while setting up the password at the installation process
    delete Session.enterprise;
    const validate = PasswordMeterService.validate(STRONG_PASSWORD);
    expect(validate).to.equal(true);
  });

  it('#validate() should return true enable_password_validation is false', () => {
    Session.enterprise.settings.enable_password_validation = false;
    const validate = PasswordMeterService.validate();
    expect(validate).to.equal(true);
  });
});
