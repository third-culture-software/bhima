const { expect } = require('chai');
const sinon = require('sinon');

// Import the database module to mock it
const db = require('../../../server/lib/db');

const controller = require('../../../server/controllers/admin/iprTax');

describe('test/server-unit/payroll-test-unit/iprTax', () => {

  // reusable mocks
  let req;
  let res;

  beforeEach(() => {
    req = { params : {}, body : {} };
    res = {
      status : sinon.stub().returnsThis(),
      json : sinon.stub(),
    };
  });

  afterEach(() => {
    sinon.restore(); // reset everything after each test
  });

  const iprTaxConfig = [
    {
      id      : 1,
      rate    : 0,
      tranche_annuelle_debut    : 0,
      tranche_annuelle_fin      : 524160,
      tranche_mensuelle_debut   : 0,
      tranche_mensuelle_fin     : 43680,
      ecart_annuel              : 524160,
      ecart_mensuel             : 43680,
      impot_annuel              : 0,
      impot_mensuel             : 0,
      cumul_annuel              : 0,
      cumul_mensuel             : 0,
      taxe_ipr_id               : 1,
    }, {
      id      : 2,
      rate    : 15,
      tranche_annuelle_debut    : 524160,
      tranche_annuelle_fin      : 1428000,
      tranche_mensuelle_debut   : 43680,
      tranche_mensuelle_fin     : 119000,
      ecart_annuel              : 903840,
      ecart_mensuel             : 75320,
      impot_annuel              : 135576,
      impot_mensuel             : 11298,
      cumul_annuel              : 135576,
      cumul_mensuel             : 11298,
      taxe_ipr_id               : 2,
    },
  ];

  it('list() should return a status 200 with the list of IPR Tax', async () => {
    const iprTax = [{
      id            : 1,
      label         : 'IPR 2012',
      description   : 'Professional Income Tax 2012',
      currency_id   : 1,
    }, {
      id            : 2,
      label         : 'IPR 2018',
      description   : 'Professional Income Tax 2018',
      currency_id   : 1,
    }];

    sinon.stub(db, 'exec').resolves(iprTax);

    await controller.list(req, res);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(iprTax)).to.equal(true);
  });

  it('detail() must return a IPR Tax by Id', async () => {
    const record = { id : 1, label : 'IPR 2012' };
    sinon.stub(db, 'one').resolves(record);
    req.params.id = 1;

    await controller.detail(req, res);

    expect(db.one.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(record)).to.equal(true);
  });

  it('detail() should throw if a DB error occurs', async () => {
    const fakeError = new Error('DB error');
    sinon.stub(db, 'one').rejects(fakeError);
    req.params.id = 1;

    try {
      await controller.detail(req, res);
      throw new Error('Expected error was not thrown');
    } catch (err) {
      expect(err).to.equal(fakeError);
    }
  });

  // ---------------------------------------------------------
  it('create() must insert a new IPR Tax and return 201', async () => {
    const insertResult = { insertId : 99 };
    sinon.stub(db, 'exec').resolves(insertResult);

    req.body = {
      id            : 3,
      label         : 'IPR 2023',
      description   : 'Professional Income Tax 2023',
      currency_id   : 2,
    };

    await controller.create(req, res);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(201)).to.equal(true);
    expect(res.json.calledWith({ id : 99 })).to.equal(true);
  });

  // ---------------------------------------------------------
  it('update() must modify and return the updated IPR', async () => {
    const updated = { id : 10, label : 'IPR 2025', description : 'Professional Income Tax 2025' };
    sinon.stub(db, 'exec').resolves();
    sinon.stub(db, 'one').resolves(updated);

    req.params.id = 10;
    req.body = { label : 'IPR 2025' };

    await controller.update(req, res);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(updated)).to.equal(true);
  });

  it('update() should throws an error', async () => {
    const fakeError = new Error('SQL Error');
    sinon.stub(db, 'exec').rejects(fakeError);
    req.params.id = 10;

    try {
      await controller.detail(req, res);
      throw new Error('Expected error was not thrown');
    } catch (err) {
      expect(err).to.equal(fakeError);
    }
  });

  // ---------------------------------------------------------
  it('delete() must call db.delete() with the correct arguments', async () => {
    const deleteStub = sinon.stub(db, 'delete');
    req.params.id = 5;

    await controller.delete(req, res);

    expect(deleteStub.calledOnce).to.equal(true);
    expect(deleteStub.firstCall.args[0]).to.equal('taxe_ipr');
    expect(deleteStub.firstCall.args[1]).to.equal('id');
    expect(deleteStub.firstCall.args[2]).to.equal(5);
  });

  // ------------------------
  // listConfig()
  // ------------------------
  it('listConfig() should return a list of configurations', async () => {
    sinon.stub(db, 'exec').resolves(iprTaxConfig);

    await controller.listConfig(req, res);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(iprTaxConfig)).to.equal(true);
  });

  it('listConfig() should throw on DB error', async () => {
    const fakeError = new Error('DB error');
    sinon.stub(db, 'exec').rejects(fakeError);

    try {
      await controller.listConfig(req, res);
      throw new Error('Expected error was not thrown');
    } catch (err) {
      expect(err).to.equal(fakeError);
    }
  });

  // ------------------------
  // detailConfig()
  // ------------------------
  it('detailConfig() should return a single configuration', async () => {
    req.params.id = 1;
    sinon.stub(db, 'one').resolves(iprTaxConfig);

    await controller.detailConfig(req, res);

    expect(db.one.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(iprTaxConfig)).to.equal(true);
  });

  it('detailConfig() should throws an error', async () => {
    const fakeError = new Error('Not found');
    sinon.stub(db, 'one').rejects(fakeError);

    try {
      await controller.detail(req, res);
      throw new Error('Expected error was not thrown');
    } catch (err) {
      expect(err).to.equal(fakeError);
    }
  });

  // ------------------------
  // createConfig()
  // ------------------------
  it('createConfig() should insert a new configuration and return its id', async () => {

    req.body = {
      rate                    : 30,
      tranche_annuelle_debut  : 200001,
      tranche_annuelle_fin    : 300000,
      tranche_mensuelle_debut : 16666,
      tranche_mensuelle_fin   : 25000,
      ecart_annuel            : 99999,
      ecart_mensuel           : 8333,
      impot_annuel            : 2999.97,
      impot_mensuel           : 249.99,
      cumul_annuel            : 5999.95,
      cumul_mensuel           : 499.65,
    };

    sinon.stub(db, 'exec').resolves({ insertId : 42 });

    await controller.createConfig(req, res);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(201)).to.equal(true);
    expect(res.json.calledWith({ id : 42 })).to.equal(true);
  });

  it('createConfig() should throws an error', async () => {
    const fakeError = new Error('Insert failed');

    req.body = {
      rate                    : 50,
      tranche_annuelle_debut  : 2200001,
      tranche_annuelle_fin    : 3200000,
      tranche_mensuelle_debut : 126666,
    };

    sinon.stub(db, 'exec').rejects(fakeError);

    try {
      await controller.createConfig(req, res);
      throw new Error('Expected error was not thrown');
    } catch (err) {
      expect(err).to.equal(fakeError);
    }
  });

  // ------------------------
  // updateConfig()
  // ------------------------
  it('updateConfig() should modify and return the updated configuration', async () => {
    req.params.id = 1;
    req.body = { rate : 25 };
    const updated = {
      id      : 1,
      rate    : 25,
      tranche_annuelle_debut    : 0,
      tranche_annuelle_fin      : 524160,
      tranche_mensuelle_debut   : 0,
      tranche_mensuelle_fin     : 43680,
      ecart_annuel              : 524160,
      ecart_mensuel             : 43680,
      impot_annuel              : 0,
      impot_mensuel             : 0,
      cumul_annuel              : 0,
      cumul_mensuel             : 0,
      taxe_ipr_id               : 1,
    };

    sinon.stub(db, 'exec').resolves();
    sinon.stub(db, 'one').resolves(updated);

    await controller.updateConfig(req, res);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(updated)).to.equal(true);
  });

  it('update() should throw an error when the database throws an error', async () => {
    sinon.stub(db, 'exec').rejects(new Error('SQL Error'));

    req.params.id = 1;
    req.body = { rate : 30 };

    await expect(controller.detail(req, res)).to.be.rejectedWith('SQL Error');
  });

  // ------------------------
  // deleteConfig()
  // ------------------------
  it('deleteConfig() should delete a configuration', async () => {
    const deleteStub = sinon.stub(db, 'delete');
    req.params.id = 5;

    await controller.deleteConfig(req, res);

    expect(deleteStub.calledOnce).to.equal(true);
    expect(deleteStub.firstCall.args[0]).to.equal('taxe_ipr_configuration');
    expect(deleteStub.firstCall.args[1]).to.equal('id');
    expect(deleteStub.firstCall.args[2]).to.equal(5);
  });

  it('should throw if delete fails', async () => {
    sinon.stub(db, 'delete').rejects(new Error('Delete failed'));

    req.params.id = 25;

    await expect(controller.deleteConfig(req, res)).to.be.rejectedWith('Delete failed');
  });
});
