/* global inject,  chai */
describe('test/client-unit/services/util', () => {
  let util;

  beforeEach(module('angularMoment', 'bhima.services'));

  beforeEach(inject(_util_ => {
    util = _util_;
  }));

  it('#unwrapHttpResponse() returns only object data', () => {
    const data = { headers : [1, 2, 3], data : { o : 1 }, other : y => y + 1 };

    const result = util.unwrapHttpResponse(data);
    expect(result).to.have.keys('o');
    expect(result.o).to.equal(1);
  });

  it('#once() should only call a function once', () => {
    let fn = util.once((x) => x + 1);

    // the result of the function shouldn't change
    expect(fn(1)).to.be.equal(2);
    expect(fn(10)).to.be.equal(null);
    expect(fn('some string')).to.be.equal(null);

    // you should be able to pass in a context to use as this
    const context = { y : 0 };
    fn = util.once(function cb() {
      this.y += 3;
    }, context);

    fn();
    expect(context).to.deep.equal({ y : 3 });

    // repeated calls do no affect the results
    fn();
    fn();
    fn();
    fn();
    fn();
    expect(context).to.deep.equal({ y : 3 });
  });

  it('#before() should call a function when a target method is called', () => {

    const api = {
      x : z => z ** 2,
      y : z => z / 2,
    };

    let input;
    util.before(api, 'x', args => {
      input = args;
    });

    api.x(2);
    expect(input).to.be.equal(2);
  });

  it('#after() should call a function when a target method is called', () => {

    const api = {
      x : z => z ** 2,
      y : z => z / 2,
    };

    let input;
    util.after(api, 'y', args => {
      input = args;
    });

    api.y(2);
    expect(input).to.be.equal(2);
  });

  it('#formatDate() should take a date and transform it into a string.', () => {
    const date = new Date('2018-01-31');
    const expected = 'string';

    const formatedDate = util.formatDate(date);
    expect(formatedDate).to.be.a(expected);
  });

  it('#formatDate() should take a date and transform it into a format passed in as a second argument.', () => {
    const date = new Date('2018-01-31 12:00:00');
    const expected = '31/01/2018';
    const format = 'DD/MM/YYYY';

    const formatedDate = util.formatDate(date, format);

    expect(formatedDate).to.be.equal(expected);
  });

  it('#formatDate() should retun null if no date provided.', () => {
    const expected = null;
    const formatedDate = util.formatDate();
    expect(formatedDate).to.be.equal(expected);
  });

  it('#filterFormElements() should return an empty object if provided an empty object', () => {
    const form = {};
    const expected = {};
    const elements = util.filterFormElements(form);
    expect(elements).to.deep.equal(expected);
  });

  it('#filterFormElements() should return $modelValue or $bhValue properties of sub-objects', () => {
    const form = {
      componentA : { $modelValue : 1 },
      subform : {
        $bhValue : 'I am a value',
        componentB : { $modelValue : 'Well' },
      },
    };

    const expected = {
      componentA : 1,
      subform : 'I am a value',
    };

    expect(util.filterFormElements(form)).to.deep.equal(expected);
  });

  it('#clean() should filter out all properties that have empty values or that begin with $', () => {
    const data = {
      $$hashKey : '8339Gh1',
      $modelValue : 10,
      $dirty : true,
      name : 'Alice',
      test : null,
    };

    const expected = {
      $modelValue : 10,
      $dirty : true,
      name : 'Alice',
    };
    const formatedData = util.clean(data);
    expect(formatedData).to.deep.equal(expected);
  });

  it('#getMomentAge() should return a number', () => {
    const date = new Date();
    const expected = 'number';
    const result = util.getMomentAge(date);
    expect(typeof result).to.be.equal(expected);
  });

  it('#defaultBirthMonth should be defined', () => {
    const { defaultBirthMonth } = util;
    expect(defaultBirthMonth).to.not.equal(null);
  });

  it('#uniquelize should turn an array into unique values', () => {
    const data = ['name', 'gender', 'label', 'name', 'gender'];
    const expected = ['name', 'gender', 'label'];
    const formatedData = util.uniquelize(data);
    expect(formatedData).to.deep.equal(expected);
  });

  it('#isEmptyObject() should turn true for {}', () => {
    const data = {};
    const expected = true;
    const formatedData = util.isEmptyObject(data);
    expect(formatedData).to.be.equal(expected);
  });

  it('#isEmptyObject() should turn true for []', () => {
    const data = [];
    const expected = true;
    const formatedData = util.isEmptyObject(data);
    expect(formatedData).to.be.equal(expected);
  });

  it('#xor should returns the logical XOR of two booleans.', () => {
    const { xor } = util;
    expect(xor(true, true)).to.equal(false);
    expect(xor(false, true)).to.equal(true);
    expect(xor(true, false)).to.equal(true);
    expect(xor(false, false)).to.equal(false);
  });

  it('#maskObjectFromKeys should return an object with only the properties specified as a second value', () => {
    const data = {
      $$hashKey : '8339Gh1',
      $modelValue : 10,
      $dirty : true,
      name : 'Alice',
      age : 12,
    };
    const mask = ['name', 'age'];
    const expected = { name : 'Alice', age : 12 };
    const formatedData = util.maskObjectFromKeys(data, mask);
    expect(formatedData).to.deep.equal(expected);
  });

  it('#maskObjectFromKeys should return an empty object if given empty keys', () => {
    const data = {
      $modelValue : 10,
      $dirty : true,
      name : 'Alice',
      age : 12,
    };
    const mask = [];
    const expected = {};
    const formatedData = util.maskObjectFromKeys(data, mask);
    expect(formatedData).to.deep.equal(expected);
  });

  it('#debounce() should fire a function in the future', (done) => {
    const spy = chai.spy();
    const denounced = util.debounce(spy, 200); // debounce spy for 200 milliseconds

    denounced();
    expect(spy).to.not.have.been.called();

    setTimeout(() => {
      expect(spy).to.have.been.called();
      done();
    }, 250);
  });

  it(`
  #groupBy() should returns an object with properties the values of the given property,
  and value an array of objects having for the given property the value which correspond
  to the property
  `, () => {
    const sample = [
      { name : 'Alpha', region : 'Kinshasa', gender : 'M' },
      { name : 'Beta', region : 'Goma', gender : 'F' },
      { name : 'Gamma', region : 'Kananga', gender : 'M' },
      { name : 'Zeta', region : 'Kinshasa', gender : 'F' },
      { name : 'Teta', region : 'Kinshasa', gender : 'F' },
    ];

    const kinshasaRegion = [
      { name : 'Alpha', region : 'Kinshasa', gender : 'M' },
      { name : 'Zeta', region : 'Kinshasa', gender : 'F' },
      { name : 'Teta', region : 'Kinshasa', gender : 'F' },
    ];

    const gomaRegion = [
      { name : 'Beta', region : 'Goma', gender : 'F' },
    ];

    const kanangaRegion = [
      { name : 'Gamma', region : 'Kananga', gender : 'M' },
    ];

    const femalGender = [
      { name : 'Beta', region : 'Goma', gender : 'F' },
      { name : 'Zeta', region : 'Kinshasa', gender : 'F' },
      { name : 'Teta', region : 'Kinshasa', gender : 'F' },
    ];

    const maleGender = [
      { name : 'Alpha', region : 'Kinshasa', gender : 'M' },
      { name : 'Gamma', region : 'Kananga', gender : 'M' },
    ];

    const regions = util.groupBy(sample, 'region');
    expect(Object.keys(regions)).to.have.length(3);
    expect(regions).to.have.all.keys(['Kinshasa', 'Goma', 'Kananga']);
    expect(regions.Kinshasa).to.deep.equal(kinshasaRegion);
    expect(regions.Goma).to.deep.equal(gomaRegion);
    expect(regions.Kananga).to.deep.equal(kanangaRegion);

    const gender = util.groupBy(sample, 'gender');
    expect(Object.keys(gender)).to.have.length(2);
    expect(gender).to.have.all.keys(['M', 'F']);
    expect(gender.M).to.deep.equal(maleGender);
    expect(gender.F).to.deep.equal(femalGender);
  });

  it('#getUniqueBy() should return an array of unique values filtered by property', () => {
    const sample = [
      { name : 'Alpha', region : 'Kinshasa', gender : 'M' },
      { name : 'Beta', region : 'Goma', gender : 'F' },
      { name : 'Gamma', region : 'Kananga', gender : 'M' },
      { name : 'Zeta', region : 'Kinshasa', gender : 'F' },
      { name : 'Teta', region : 'Kinshasa', gender : 'F' },
    ];

    // check that unique values preserve the entire array
    expect(util.getUniqueBy(sample, 'name')).to.deep.equal(sample);

    // by gender
    const genders = [
      { name : 'Alpha', region : 'Kinshasa', gender : 'M' },
      { name : 'Beta', region : 'Goma', gender : 'F' },
    ];

    expect(util.getUniqueBy(sample, 'gender')).to.deep.equal(genders);

    // by region
    const regions = [
      { name : 'Alpha', region : 'Kinshasa', gender : 'M' },
      { name : 'Beta', region : 'Goma', gender : 'F' },
      { name : 'Gamma', region : 'Kananga', gender : 'M' },
    ];

    expect(util.getUniqueBy(sample, 'region')).to.deep.equal(regions);

    // finally, by an irrelevant property
    expect(util.getUniqueBy(sample, 'notfound')).to.deep.equal([sample[0]]);
  });

});
