/* global inject, */
describe('test/client-unit/services/Pool', () => {

  let Pool;
  let data;

  beforeEach(module('bhima.services'));

  beforeEach(inject(_Pool_ => {
    Pool = _Pool_;

    data = [
      { id : 1, name : 'Bob' },
      { id : 2, name : 'Sarah' },
    ];
  }));

  it('#constructor() runs with sane defaults', () => {
    let pool = new Pool();
    expect(pool).to.exist;  
    expect(pool.available.identifier).to.equal('id');
    expect(pool.available.data).to.have.length(0);

    pool = new Pool('uuid');
    expect(pool.available.identifier).to.equal('uuid');
    expect(pool.available.data).to.have.length(0);
    expect(pool.unavailable.identifier).to.equal('uuid');

    pool = new Pool('id', data);
    expect(pool.available.identifier).to.equal('id');
    expect(pool.available.data).to.have.length(2);
    expect(pool.unavailable.data).to.have.length(0);
  });

  it('#use() retrieves items stored in it', () => {
    const pool = new Pool('id', data);

    const bob = pool.use(1);
    expect(bob.id).to.equal(1);
    expect(bob.name).to.equal('Bob');

    const sarah = pool.use(2);
    expect(sarah.id).to.equal(2);
    expect(sarah.name).to.equal('Sarah');

    // cannot retrieve the same item twice
    const bobDuplicate = pool.use(1);
    expect(bobDuplicate).to.be.undefined;
  });

  it('#release() returns items to the available pool', () => {
    const pool = new Pool('id', data);

    const bob = pool.use(1);
    expect(bob.id).to.equal(1);

    const duplicate = pool.use(1);
    expect(duplicate).to.be.undefined;

    // return bob to the pool
    pool.release(1);

    const bobAgain = pool.use(1);
    expect(bobAgain.id).to.equal(1);
  });

  it('#size() reports the proper size', () => {
    let pool = new Pool('id', []);
    expect(pool.size()).to.equal(0);

    pool = new Pool('id', data);
    expect(pool.size()).to.equal(2);
  });
});
