const { expect } = require('chai');
const sinon = require('sinon');

// Import the database module to mock it
const db = require('../../../server/lib/db');

const controller = require('../../../server/controllers/payroll/rubrics');

describe('test/server-unit/payroll-test-unit/rubrics', () => {

  // reusable mocks
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
    sinon.restore(); // reset everything after each test
  });

  it('list() should return a status 200 with the list of payroll rubrics', async () => {
    const rubrics = [
      {
        id : 25,
        label : 'Transport allowance',
        abbr : 'TRANS-ALLW',
        is_employee : 0,
        is_percent : 0,
        is_discount : 0,
        is_tax : 0,
        is_social_care : 0,
        is_defined_employee : 0,
        is_membership_fee : 0,
        debtor_account_id : 366,
        expense_account_id : 343,
        is_ipr : 0,
        is_associated_employee : 0,
        value : 0.035,
        is_seniority_bonus : 1,
        is_family_allowances : 0,
        is_indice : 1,
        is_monetary_value : 0,
        position : '',
        indice_type : 0,
        indice_to_grap : 0,
        is_linked_pension_fund : 0,
        is_linked_to_grade : 0,
      },
      {
        id : 26,
        label : 'Rent deduction',
        abbr : 'IND-JF',
        is_employee : 0,
        is_percent : 0,
        is_discount : 0,
        is_tax : 0,
        is_social_care : 0,
        is_defined_employee : 0,
        is_membership_fee : 0,
        debtor_account_id : 366,
        expense_account_id : 368,
        is_ipr : 0,
        is_associated_employee : 0,
        value : null,
        is_seniority_bonus : 0,
        is_family_allowances : 0,
        is_indice : 1,
        is_monetary_value : 0,
        position : '',
        indice_type : 0,
        indice_to_grap : 0,
        is_linked_pension_fund : 0,
        is_linked_to_grade : 0,
      },
    ];

    sinon.stub(db, 'exec').resolves(rubrics);

    await controller.list(req, res, next);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(rubrics)).to.equal(true);
  });

  it('detail() must return a rubric by Id', async () => {
    const record = { id : 26, label : 'Rent deduction' };
    sinon.stub(db, 'one').resolves(record);
    req.params.id = 26;

    await controller.detail(req, res, next);

    expect(db.one.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(record)).to.equal(true);
  });

  it('detail() should call next(e) if a DB error occurs', (done) => {
    const fakeError = new Error('DB error');
    sinon.stub(db, 'one').rejects(fakeError);
    req.params.id = 78;

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

  // ---------------------------------------------------------
  it('create() must insert a new rubric and return 201', async () => {
    const insertResult = { insertId : 5 };
    sinon.stub(db, 'exec').resolves(insertResult);

    req.body = {
      label : 'On-call allowance',
      abbr : 'ON-CALL',
      is_employee : 0,
      is_percent : 0,
      is_discount : 0,
      is_tax : 0,
      is_social_care : 0,
      is_defined_employee : 0,
      is_membership_fee : 0,
      debtor_account_id : null,
      expense_account_id : null,
      is_ipr : 0,
      is_associated_employee : 0,
      value : null,
      is_seniority_bonus : 0,
      is_family_allowances : 0,
      is_indice : 1,
      is_monetary_value : 0,
      position : 8,
      indice_type : 'is_other_profits',
      indice_to_grap : 1,
      is_linked_pension_fund : 0,
      is_linked_to_grade : 0,
    };

    await controller.create(req, res, next);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(201)).to.equal(true);
    expect(res.json.calledWith({ id : 5 })).to.equal(true);
  });

  // ---------------------------------------------------------
  it('update() must modify and return the updated payroll rubrics', async () => {
    const updated = { id : 25, label : 'Transport allowance' };
    sinon.stub(db, 'exec').resolves();
    sinon.stub(db, 'one').resolves(updated);

    req.params.id = 25;
    req.body = { label : 'Transport allowance' };

    await controller.update(req, res, next);

    expect(db.exec.calledOnce).to.equal(true);
    expect(res.status.calledWith(200)).to.equal(true);
    expect(res.json.calledWith(updated)).to.equal(true);
  });

  it('update() must call next(e) if the database returns an error', async () => {
    const fakeError = new Error('Erreur SQL');
    sinon.stub(db, 'exec').rejects(fakeError);
    req.params.id = 10;

    await controller.update(req, res, next);

    expect(next.calledWith(fakeError)).to.equal(true);
  });

  // ---------------------------------------------------------
  it('delete() must call db.delete() with the correct arguments', () => {
    const deleteStub = sinon.stub(db, 'delete');
    req.params.id = 7;

    controller.delete(req, res, next);

    expect(deleteStub.calledOnce).to.equal(true);
    expect(deleteStub.firstCall.args[0]).to.equal('rubric_payroll');
    expect(deleteStub.firstCall.args[1]).to.equal('id');
    expect(deleteStub.firstCall.args[2]).to.equal(7);
  });

  it('deleteConfig() should call next() if delete fails', () => {
    const fakeError = new Error('Delete failed');

    const deleteStub = sinon.stub(db, 'delete').callsFake(() => {
      next(fakeError);
    });

    req.params.id = 20;

    controller.delete(req, res, next);

    expect(deleteStub.calledOnce).to.equal(true);
    expect(next.calledOnce).to.equal(true);
    expect(next.firstCall.args[0].message).to.equal('Delete failed');
  });
});
