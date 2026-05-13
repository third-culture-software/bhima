/* eslint no-unused-expressions:"off" */


const helpers = require('../helpers');

// the /shipment_container_types API
describe('test/integration/shipmentContainerTypes The Shipment Container API', () => {

  it('/shipment_container_types', () => {
    return agent.get('/shipment_container_types')
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.not.be.empty;
        const preDefTypes = [
          'BALE', 'BOTTLE', 'BOX', 'BUNDLE', 'CAN', 'CARTON', 'CONTAINER',
          'CRATE', 'KIT', 'PACKAGE', 'PACKET', 'PAIR', 'PALLET', 'PIECES',
          'REAM', 'SACK', 'SET',
        ];
        const types = res.body.map(obj => obj.text);
        expect(types).to.include.members(preDefTypes);
      })
      .catch(helpers.handler);
  });

});
