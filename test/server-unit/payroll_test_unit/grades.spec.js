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
  let next;

  beforeEach(() => {
    req = { params : {}, body : {} };
    res = {
      status : sinon.stub().returnsThis(),
      json : sinon.stub(),
    };
    next = sinon.spy();
  });

  afterEach(() => {
    sinon.restore(); // reset mocks after each test
  });

  it('list() should return status 200 with the list of grades', (done) => {
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

    // stub db.exec to return a promise resolving to the array
    sinon.stub(db, 'exec').returns(Promise.resolve(gradeData));

    // set query.detailed to 1 if you want the full data
    req.query = { detailed : '1' };

    controller.list(req, res, next);

    setImmediate(() => {
      try {
        expect(db.exec.calledOnce).to.equal(true);
        expect(res.status.calledWith(200)).to.equal(true);
        expect(res.json.calledWith(gradeData)).to.equal(true);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('detail() should return a grade by UUID', (done) => {
    const record = {
      uuid : '70D5EB6FAD68A01AFC24B5D8BFF5FEA2',
      code : 'OA-2',
      text : '2nd Class Office Assistant',
      basic_salary : 850,
    };

    sinon.stub(db, 'one').resolves(record);
    req.params.uuid = '70D5EB6FAD68A01AFC24B5D8BFF5FEA2';

    controller.detail(req, res, next);

    setImmediate(() => {
      try {
        expect(db.one.calledOnce).to.equal(true);
        expect(res.status.calledWith(200)).to.equal(true);
        expect(res.json.calledWith(record)).to.equal(true);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('detail() should call next(err) if a DB error occurs', (done) => {
    const fakeError = new Error('DB error');
    sinon.stub(db, 'one').rejects(fakeError);
    req.params.uuid = 'C995F498CAB7E20A2FAA4B3495A7E621';

    controller.detail(req, res, next);

    setImmediate(() => {
      try {
        expect(next.calledWith(fakeError)).to.equal(true);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('create() should insert a new grade and return 201', (done) => {
    sinon.stub(db, 'exec').resolves({});
    req.body = { code : 'B-0', text : 'Bailiff', basic_salary : 500 };

    controller.create(req, res, next);

    setImmediate(() => {
      try {
        expect(db.exec.calledOnce).to.equal(true);
        expect(res.status.calledWith(201)).to.equal(true);
        expect(res.json.firstCall.args[0]).to.have.property('uuid');
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('create() should call next(err) if DB throws an error', (done) => {
    const fakeError = new Error('SQL Error');
    sinon.stub(db, 'exec').rejects(fakeError);
    req.body = { code : 'PR-1', text : 'Regent Physician', basic_salary : 2800 };

    controller.create(req, res, next);

    setImmediate(() => {
      try {
        expect(next.calledWith(fakeError)).to.equal(true);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('update() should modify and return the updated grade', (done) => {
    const updated = {
      uuid : 'E8F75D458B830EDF039A57DD8B5C90C4',
      code : 'G1',
      text : 'Updated Grade',
      basic_salary : 1000,
    };

    sinon.stub(db, 'exec').resolves();
    sinon.stub(db, 'one').resolves(updated);
    req.params.uuid = 'E8F75D458B830EDF039A57DD8B5C90C4';
    req.body = { basic_salary : 1000 };

    controller.update(req, res, next);

    setImmediate(() => {
      try {
        expect(db.exec.calledOnce).to.equal(true);
        expect(db.one.calledOnce).to.equal(true);
        expect(res.status.calledWith(200)).to.equal(true);
        expect(res.json.calledWith(updated)).to.equal(true);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('update() should call next(err) if DB throws an error', (done) => {
    const fakeError = new Error('SQL Error');
    sinon.stub(db, 'exec').rejects(fakeError);
    req.params.uuid = '9AE10D429242B84E09721BF0E8C09880';

    controller.update(req, res, next);

    setImmediate(() => {
      try {
        expect(next.calledWith(fakeError)).to.equal(true);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('delete() should delete a grade and return 204', (done) => {
    sinon.stub(db, 'exec').resolves({ affectedRows : 1 });
    req.params.uuid = '9AE10D429242B84E09721BF0E8C09880';

    controller.delete(req, res, next);

    setImmediate(() => {
      try {
        expect(db.exec.calledOnce).to.equal(true);
        expect(res.status.calledWith(204)).to.equal(true);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('delete() should call next(NotFound) if grade does not exist', (done) => {
    sinon.stub(db, 'exec').resolves({ affectedRows : 0 });
    req.params.uuid = '1350';

    controller.delete(req, res, next);

    setImmediate(() => {
      try {
        expect(next.calledOnce).to.equal(true);
        const err = next.firstCall.args[0];
        expect(err).to.be.instanceOf(NotFound);
        done();
      } catch (err) {
        done(err);
      }
    });
  });
});
