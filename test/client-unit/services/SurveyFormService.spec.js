/* global inject */
describe('test/client-unit/services/SurveyFormService', () => {
  let SurveyFormService;
  let $httpBackend;

  beforeEach(module(
    'bhima.services',
    'angularMoment',
    'bhima.mocks',
    'ngStorage'
  ));

  beforeEach(inject((_SurveyFormService_, _$httpBackend_) => {
    SurveyFormService = _SurveyFormService_;
    $httpBackend = _$httpBackend_;
  }));

  afterEach(() => {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('Invalidating the name parameter when the variable name has voids', () => {
    // This is the value to get
    const variableName = 'Validation Variable Name';
    const formatedConstaint = SurveyFormService.validVariable(variableName);

    expect(formatedConstaint).to.equal(false);
  });

  it('Failed to create a form element whose name parameter with virgul', () => {
    // This is the value to get
    const variableName = 'Namewith,and;';
    const formatedConstaint = SurveyFormService.validVariable(variableName);

    expect(formatedConstaint).to.equal(false);
  });

  it('Failed to create a form element whose name parameter with @', () => {
    // This is the value to get
    const variableName = 'Namewith@';
    const formatedConstaint = SurveyFormService.validVariable(variableName);

    expect(formatedConstaint).to.equal(false);
  });

  it('Failed to create a form element whose name parameter with Quotation mark and apostrophe', () => {
    // This is the value to get
    const variableName = 'Namewith\'and "';
    const formatedConstaint = SurveyFormService.validVariable(variableName);

    expect(formatedConstaint).to.equal(false);
  });

  it('Failed to create a form element whose name parameter with Quotation mark and apostrophe', () => {
    // This is the value to get
    const variableName = 'Namewith()';
    const formatedConstaint = SurveyFormService.validVariable(variableName);
    expect(formatedConstaint).to.equal(false);
  });

  it('Failed to create a form element whose name parameter with name Begin by Number', () => {
    // This is the value to get
    const variableName = '1_name';
    const formatedConstaint = SurveyFormService.validVariable(variableName);

    expect(formatedConstaint).to.equal(false);
  });

  it('Validation of the name parameter with a very good format', () => {
    // This is the value to get
    const variableName = 'name_patient';
    const formatedConstaint = SurveyFormService.validVariable(variableName);

    expect(formatedConstaint).to.equal(true);
  });

});
