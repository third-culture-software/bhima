
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const util = require('../../../server/lib/util');
const { calculateFinalIPR, calculateIPRTaxRate } = require('../../../server/controllers/payroll/multiplePayroll/calculation');

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
    assert.equal(calculateFinalIPR(0, iprScales, employee.nb_enfant, enterpriseExchangeRate, iprExchangeRate, DECIMAL_PRECISION), 0);
    assert.equal(calculateFinalIPR(-100, iprScales, employee.nb_enfant, enterpriseExchangeRate, iprExchangeRate, DECIMAL_PRECISION), 0);
  });

  it('should throw an error if iprScales is empty or invalid', () => {
    assert.throws(() => calculateFinalIPR(1000, [], employee.nb_enfant, enterpriseExchangeRate, iprExchangeRate, DECIMAL_PRECISION), /Invalid IPR scales/);
    assert.throws(() => calculateFinalIPR(1000, null, employee.nb_enfant, enterpriseExchangeRate, iprExchangeRate, DECIMAL_PRECISION), /Invalid IPR scales/);
  });

  it('should calculate correct IPR for first tranche (0% rate)', () => {
    const annualIncome = 500000; // inside first tranche
    const iprValue = calculateFinalIPR(annualIncome, iprScales, employee.nb_enfant, enterpriseExchangeRate, iprExchangeRate, DECIMAL_PRECISION);
    assert.equal(iprValue, 0);
  });

  it('should calculate correct IPR for second tranche (15% rate) with 2 children', () => {
    const annualIncome = 600000; // inside second tranche
    const rawIPR = calculateIPRTaxRate(annualIncome, iprScales);


    const reducedIPR = rawIPR - (rawIPR * (employee.nb_enfant * 2) / 100);
    const expectedIPR = util.roundDecimal(reducedIPR * (enterpriseExchangeRate / iprExchangeRate), DECIMAL_PRECISION);

    const iprValue = calculateFinalIPR(annualIncome, iprScales, employee.nb_enfant, enterpriseExchangeRate, iprExchangeRate, DECIMAL_PRECISION);
    assert.equal(iprValue, expectedIPR);
  });

  /**
   * @test
   * @description Make sure the final tax is never negative.
   * The children reduction is 2% per child of the raw IPR.
   * No deduction is applied if the raw IPR is zero.
   */
  it('should prevent negative tax and skip children reduction if IPR is zero', () => {
    // Case 1: IPR > 0 (second tax bracket)
    const annualIncomePositive = 525000; // second bracket
    const nb_enfant = 50; // many children

    const iprValuePositive = calculateFinalIPR(
      annualIncomePositive,
      iprScales,
      nb_enfant,
      enterpriseExchangeRate,
      iprExchangeRate,
      DECIMAL_PRECISION
    );

    // Final IPR must never be negative
    assert.ok(iprValuePositive >= 0);

    // Case 2: IPR = 0 (first tax bracket)
    const annualIncomeZero = 500000; // first bracket, IPR = 0
    const nb_enfant_10 = 10;

    const iprValueZero = calculateFinalIPR(
      annualIncomeZero,
      iprScales,
      nb_enfant_10,
      enterpriseExchangeRate,
      iprExchangeRate,
      DECIMAL_PRECISION
    );

    // No deduction should apply, IPR stays zero
    assert.equal(iprValueZero, 0);
  });

});
