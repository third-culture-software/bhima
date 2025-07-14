/* global inject, expect */
describe('test/client-unit/services/uuid', () => {

  let UUID;
  beforeEach(module('bhima.services'));

  beforeEach(inject(_uuid_ => {
    UUID = _uuid_;
  }));

  it('UUID() should be a function', () => {
    expect(UUID).to.be.a('function');
  });

  it('The fourteenth character must be equal to 4', () => {
    const uuid = UUID();
    expect(uuid).to.be.a('string');
    expect(uuid.slice(14, 15)).to.be.equal('4');
  });

  it('Should compare generated uuids, they should be unique', () => {
    const uuid1 = UUID();
    const uuid2 = UUID();
    const uuid3 = UUID();
    expect(uuid1).to.not.equal(uuid2);
    expect(uuid2).to.not.equal(uuid3);
    expect(uuid1).to.not.equal(uuid3);
  });

});
