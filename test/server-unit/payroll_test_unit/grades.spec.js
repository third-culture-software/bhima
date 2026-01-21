const { expect } = require('chai');
const sinon = require('sinon');

// Import the DB module to mock it
const db = require('../../../server/lib/db');
const NotFound = require('../../../server/lib/errors/NotFound');

// Import the controller to test
const controller = require('../../../server/controllers/admin/grades');

describe('test/server-unit/payroll-test-unit/grade', () => {

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
    sinon.restore(); // reset mocks after each test
  });

  it('list() should return status 200 with the list of grades', async () => {
    const gradeData = [
      {
        uuid : '07B80E53108903D9C7F640E4DBA9EEEF',
        code : 'A-1',
        text : 'Administrative Officer',
        basic_salary : 1500,
      },
      {
        uuid : '4FC95920EA48B3D9A038EAB4CE25493D',
        code : 'D-4',
        text : 'Division Manager',
        basic_salary : 2300,
      },
    ];

    sinon.stub(db, 'exec').resolves(gradeData);
    req.query = { detailed : 0 };

    await controller.list(req, res);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(gradeData)).to.equal(true);
  });

  it('detail() should return a grade by UUID', async () => {
    const record = {
      uuid : '70D5EB6FAD68A01AFC24B5D8BFF5FEA2',
      code : 'OA-2',
      text : '2nd Class Office Assistant',
      basic_salary : 850,
    };

    sinon.stub(db, 'one').resolves(record);
    req.params.uuid = '70D5EB6FAD68A01AFC24B5D8BFF5FEA2';

    await controller.detail(req, res);

    expect(db.one.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(record)).to.equal(true);
  });

  it('detail() should throw if a DB error occurs', async () => {
    const fakeError = new Error('DB error');
    sinon.stub(db, 'one').rejects(fakeError);
    req.params.uuid = 'C995F498CAB7E20A2FAA4B3495A7E621';

    try {
      await controller.detail(req, res);
      throw new Error('Expected error was not thrown');
    } catch (err) {
      expect(err).to.equal(fakeError);
    }
  });

  it('create() should insert a new grade and return 201', async () => {
    const fakeTransaction = {
      addQuery : sinon.stub().returnsThis(),
      execute : sinon.stub().resolves(),
    };
    sinon.stub(db, 'transaction').returns(fakeTransaction);
    sinon.stub(db, 'convert').callsFake((obj) => obj);
    req.body = { code : 'B-0', text : 'Bailiff', basic_salary : 500 };

    await controller.create(req, res);

    expect(res.status.calledWith(201)).to.equal(true);
    expect(res.json.called).to.equal(true);
  });

  it('create() should throw if a DB error occurs', async () => {
    const fakeError = new Error('SQL Error');
    sinon.stub(db, 'exec').rejects(fakeError);
    req.params.uuid = 'C995F498CAB7E20A2FAA4B3495A7E621';

    try {
      await controller.detail(req, res);
      throw new Error('Expected error was not thrown');
    } catch (err) {
      expect(err).to.equal(fakeError);
    }
  });

  it('update() should modify and return the updated grade', async () => {

    const fakeTransaction = {
      addQuery : sinon.stub().returnsThis(),
      execute : sinon.stub().resolves([{}, {}, {}, { affectedRows : 1 }]),
    };
    sinon.stub(db, 'transaction').returns(fakeTransaction);
    sinon.stub(db, 'one').resolves({ uuid : 'E8F75D458B830EDF039A57DD8B5C90C4' });

    req.params.uuid = 'E8F75D458B830EDF039A57DD8B5C90C4';
    req.body = {
      code : 'G1',
      text : 'Updated Grade',
      basic_salary : 1000,
    };

    await controller.update(req, res);

    expect(res.status.calledWith(200)).to.equal(true);
  });

  it('update() should throws an error', async () => {
    const fakeError = new Error('SQL Error');
    sinon.stub(db, 'exec').rejects(fakeError);
    req.params.uuid = '9AE10D429242B84E09721BF0E8C09880';

    try {
      await controller.update(req, res);
      throw new Error('Expected error was not thrown');
    } catch (err) {
      expect(err).to.equal(fakeError);
    }
  });

  it('delete() should delete a grade and return 204', async () => {
    sinon.stub(db, 'exec').resolves({ affectedRows : 1 });
    req.params.uuid = '9AE10D429242B84E09721BF0E8C09880';

    await controller.delete(req, res);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(204)).to.equal(true);
  });

  it('delete() should throw NotFound if grade does not exist', async () => {
    sinon.stub(db, 'exec').resolves({ affectedRows : 0 });
    req.params.uuid = '1350';

    expect(() => controller.delete(req, res)).to.eventually.be.rejectedWioh(NotFound);
  });
});
