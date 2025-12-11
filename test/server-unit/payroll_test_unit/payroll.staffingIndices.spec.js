const { expect } = require('chai');
const sinon = require('sinon');

// Import DB + errors
const db = require('../../../server/lib/db');

// Importing the controller
const controller = require('../../../server/controllers/payroll/staffingIndices');

describe('test/server-unit/payroll-test-unit/staffingIndice controller', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { params : {}, body : {}, query : {} };
    res = {
      status : sinon.stub().returnsThis(),
      json : sinon.stub(),
    };
    next = sinon.spy();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('list() should return 200 with a list of staffing indices without modifying controller', async () => {
    const fakeData = [
      {
        uuid : '60542BC1C416464B8B54B695DD64CA84',
        grade_uuid : '34032FDA2DB040DA88A2573386B52209',
        created_at : '2024-12-04 13:57:06',
        display_name : 'Jean Dupont',
        code : 'GRD01',
        text : 'Grade Manager',
        fonction_id : 3,
        fonction_txt : 'Directeur',
        grade_indice : 152.19,
        function_indice : 0,
      },
    ];

    sinon.stub(db, 'exec').resolves(fakeData);

    await controller.list(req, res, next);

    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(fakeData)).to.equal(true);
    expect(next.notCalled).to.equal(true);
  });

  it('list() should reject if lookUp throws an error', async () => {
    // Stub db.exec to reject
    const dbStub = sinon.stub(db, 'exec').rejects(new Error('DB failure'));

    // Spy for next
    const nextSpy = sinon.spy();

    // Catch the rejected error
    let caughtError;
    try {
      await controller.list(req, res, nextSpy);
    } catch (err) {
      caughtError = err;
    }

    // Check that the error is the expected one
    expect(caughtError).to.be.instanceOf(Error);
    expect(caughtError.message).to.equal('DB failure');

    // next was NOT called because the controller does not handle the error
    expect(nextSpy.called).to.equal(false);

    dbStub.restore();
  });

  it('list() should return 200 and ensure the first element has the correct grade_uuid', async () => {
    // Preparing test data
    req.query.grade_uuid = '34032FDA2DB040DA88A2573386B52209';
    const fakeData = [
      {
        uuid : '60542BC1C416464B8B54B695DD64CA84',
        grade_uuid : '34032FDA2DB040DA88A2573386B52209',
        grade_indice : 3.5,
        fonction_id : 12,
      },
    ];

    // Controller call
    await controller.list(req, res);

    // Checks the HTTP status
    expect(res.status.calledOnceWith(200)).to.equal(true);

    // Checks the JSON response
    expect(res.json.calledOnce).to.equal(true);
    const jsonResponse = res.json.firstCall.args[0];

    expect(jsonResponse).to.be.an('array').and.to.have.length.greaterThan(0);
    expect(jsonResponse[0].grade_uuid).to.equal(fakeData[0].grade_uuid);

  });

  // --------------------------
  // DETAIL
  // --------------------------
  it('detail() should return 200 with correct object', async () => {
    req.params.uuid = '4F3CB848E420B8ED915751858DDF2F5C';
    const fakeRow = { uuid : '4F3CB848E420B8ED915751858DDF2F5C', grade_indice : '6EA4EAE053268FFD5ACD3FF0AF98F145' };
    sinon.stub(db, 'one').resolves(fakeRow);
    sinon.stub(db, 'bid').returns(req.params.uuid);

    await controller.detail(req, res);

    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(fakeRow)).to.equal(true);
  });

  it('detail() should propagate error if db.one fails', async () => {
    req.params.uuid = 'D915751858DDF4F3CB848E420B8E2F5C';
    sinon.stub(db, 'one').rejects(new Error('Not found'));
    sinon.stub(db, 'bid').returns(req.params.uuid);

    let caught;
    try {
      await controller.detail(req, res);
    } catch (err) {
      caught = err;
    }
    expect(caught.message).to.equal('Not found');
  });

  // --------------------------
  // CREATE
  // --------------------------
  it('create() should insert new index and return 201', async () => {
    const fakeRows = { affectedRows : 1 };
    req.body = { grade_uuid : '02E4FE5BC16C4AA2BF379A7FC097855C', employee_uuid : '77087F35326840948C129FFAD2509EB1' };
    sinon.stub(db, 'exec').resolves(fakeRows);
    sinon.stub(db, 'uuid').returns('3563BE60958344108D2697108071148E');
    sinon.stub(db, 'convert');

    await controller.create(req, res);

    expect(req.body.uuid).to.equal('3563BE60958344108D2697108071148E');
    expect(res.status.calledWith(201)).to.equal(true);
    expect(res.json.calledWith(fakeRows)).to.equal(true);
  });

  it('create() should propagate error if db.exec fails', async () => {
    req.body = { grade_uuid : 'GRD01' };
    sinon.stub(db, 'exec').rejects(new Error('Insert failed'));
    sinon.stub(db, 'uuid').returns('NEWUUID');
    sinon.stub(db, 'convert');

    let caught;
    try {
      await controller.create(req, res);
    } catch (err) {
      caught = err;
    }
    expect(caught.message).to.equal('Insert failed');
  });

  // --------------------------
  // UPDATE
  // --------------------------
  it('update() should update fields and return 200', async () => {
    req.params.uuid = '123';
    req.body = {
      grade_uuid : '02E4FE5BC16C4AA2BF379A7FC097855C',
      employee_uuid : '77087F35326840948C129FFAD2509EB1',
      created_at : '2024-01-01',
      function_indice : 80,
    };

    const fakeRows = { affectedRows : 1 };
    sinon.stub(db, 'exec').resolves(fakeRows);
    sinon.stub(db, 'bid').returns(req.params.uuid);
    sinon.stub(db, 'convert');

    await controller.update(req, res);

    expect(req.body).to.not.have.property('uuid');
    expect(req.body).to.not.have.property('created_at');
    expect(req.body).to.have.property('updated_at');
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(fakeRows)).to.equal(true);
  });

  it('update() should propagate error if db.exec fails', async () => {
    req.params.uuid = '123';
    req.body = { grade_uuid : 'GRD01' };
    sinon.stub(db, 'exec').rejects(new Error('Update failed'));
    sinon.stub(db, 'bid').returns(req.params.uuid);
    sinon.stub(db, 'convert');

    let caught;
    try {
      await controller.update(req, res);
    } catch (err) {
      caught = err;
    }
    expect(caught.message).to.equal('Update failed');
  });

  // --------------------------
  // REMOVE
  // --------------------------
  it('remove() should delete index and return 200', async () => {
    req.params.uuid = '123';
    const fakeRows = { affectedRows : 1 };
    sinon.stub(db, 'exec').resolves(fakeRows);
    sinon.stub(db, 'bid').returns(req.params.uuid);

    await controller.remove(req, res);

    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(fakeRows)).to.equal(true);
  });

  it('remove() should propagate error if db.exec fails', async () => {
    req.params.uuid = '123';
    sinon.stub(db, 'exec').rejects(new Error('Delete failed'));
    sinon.stub(db, 'bid').returns(req.params.uuid);

    let caught;
    try {
      await controller.remove(req, res);
    } catch (err) {
      caught = err;
    }
    expect(caught.message).to.equal('Delete failed');
  });
});
