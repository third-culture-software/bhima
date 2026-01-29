const { expect } = require('chai');
const util = require('../../../server/lib/util');
const { calculateFinalIPR } = require('../../../server/controllers/payroll/multiplePayroll/calculation');
const { calculateIPRTaxRate } = require('../../../server/controllers/payroll/multiplePayroll/calculation');

describe('calculateFinalIPR function tests', () => {

  // Mock IPR scales
  const iprScales = [
    { id: 1, tranche_annuelle_debut: 0, tranche_annuelle_fin: 524160, rate: 0, cumul_annuel: 0 },
    { id: 2, tranche_annuelle_debut: 524160, tranche_annuelle_fin: 1428000, rate: 15, cumul_annuel: 135576 },
    { id: 3, tranche_annuelle_debut: 1428000, tranche_annuelle_fin: 2700000, rate: 20, cumul_annuel: 389976 },
  ];

  const employee = {
    uuid: 'emp-uuid',
    basic_salary: 1000,
    nb_enfant: 2
  };

  const enterpriseExchangeRate = 1;
  const iprExchangeRate = 1;
  const DECIMAL_PRECISION = 2;

  it('should return 0 if annualCumulation is 0 or negative', () => {
    expect(calculateFinalIPR(0, iprScales, employee.nb_enfant, enterpriseExchangeRate, iprExchangeRate, DECIMAL_PRECISION)).to.equal(0);
    expect(calculateFinalIPR(-100, iprScales, employee.nb_enfant, enterpriseExchangeRate, iprExchangeRate, DECIMAL_PRECISION)).to.equal(0);
  });

  it('should throw an error if iprScales is empty or invalid', () => {
    expect(() => calculateFinalIPR(1000, [], employee.nb_enfant, enterpriseExchangeRate, iprExchangeRate, DECIMAL_PRECISION)).to.throw('Invalid IPR scales');
    expect(() => calculateFinalIPR(1000, null, employee.nb_enfant, enterpriseExchangeRate, iprExchangeRate, DECIMAL_PRECISION)).to.throw('Invalid IPR scales');
  });

  it('should calculate correct IPR for first tranche (0% rate)', () => {
    const annualIncome = 500000; // inside first tranche
    const iprValue = calculateFinalIPR(annualIncome, iprScales, employee.nb_enfant, enterpriseExchangeRate, iprExchangeRate, DECIMAL_PRECISION);
    expect(iprValue).to.equal(0);
  });

  it('should calculate correct IPR for second tranche (15% rate) with 2 children', () => {
    const annualIncome = 600000; // inside second tranche
    const rawIPR = calculateIPRTaxRate(annualIncome, iprScales);


    const reducedIPR = rawIPR - (rawIPR * (employee.nb_enfant * 2) / 100);
    const expectedIPR = util.roundDecimal(reducedIPR * (enterpriseExchangeRate / iprExchangeRate), DECIMAL_PRECISION);

    const iprValue = calculateFinalIPR(annualIncome, iprScales, employee.nb_enfant, enterpriseExchangeRate, iprExchangeRate, DECIMAL_PRECISION);
    expect(iprValue).to.equal(expectedIPR);
  });

  it('should prevent negative tax even if children reduction exceeds raw IPR', () => {
    const annualIncome = 1; // very small amount
    const iprValue = calculateFinalIPR(annualIncome, iprScales, 100, enterpriseExchangeRate, iprExchangeRate, DECIMAL_PRECISION);
    expect(iprValue).to.equal(0);
  });

});