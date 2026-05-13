

describe('test/integration/accountFYBalances Accounts FY balances API', () => {

  const fiscalYearId = 4; // 2018

  it('GET /accounts/:fiscalYearId/all_balances for FY 2018', () => {
    return agent.get(`/accounts/${fiscalYearId}/all_balances`)
      .then(results => {
        const data = results.body;
        expect(data.length).to.equal(7);

        const acct220 = data[4];
        expect(acct220.account_id).to.equal(220);
        expect(acct220.number).to.equal(66110011);
        expect(acct220.label).to.equal('Remunération Personnel');
        expect(acct220.type).to.equal('expense');
        expect(Number(acct220.credit)).to.equal(0);
        expect(Number(acct220.debit)).to.equal(256.62);
        expect(Number(acct220.balance)).to.equal(256.62);

        const acct243 = data[5];
        expect(acct243.account_id).to.equal(243);
        expect(acct243.number).to.equal(70111011);
        expect(acct243.label).to.equal('Vente Médicaments en Sirop');
        expect(acct243.type).to.equal('income');
        expect(Number(acct243.debit)).to.equal(0);
        expect(Number(acct243.credit)).to.equal(394.8);
        expect(Number(acct243.balance)).to.equal(-394.8);
      });
  });

});
