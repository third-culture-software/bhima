const moment = require('moment');
const helpers = require('./helpers');

// the /shipments API
describe('test/integration-stock/shipments Shipments API', () => {

  describe('Shipments API', () => {

    const SHIPMENT_AT_DEPOT = 2;
    const SHIPMENT_READY = 3;

    // lots from service-stock.sql
    const LOT_QUININE_A = 'c26ba248-149d-4fab-882c-97a368072f2b';
    const LOT_QUININE_B = '971f7ac3-ff60-4a64-9773-ce9539871a07';

    const newShipment = {
      uuid : helpers.uuid(),
      name : 'Test 1 shipment of medicines from principal to secondary',
      project_id : helpers.data.PROJECT,
      description : 'Note 1 for shipment of medicines',
      origin_depot_uuid : helpers.data.depots.principal,
      destination_depot_uuid : helpers.data.depots.secondaire,
      anticipated_delivery_date : new Date(),
      date_sent : null,
      status_id : SHIPMENT_AT_DEPOT,
    };

    const secondShipment = {
      name : 'Test 1 shipment of medicines from principal to secondary',
      project_id : helpers.data.PROJECT,
      description : 'Note 1 for shipment of medicines',
      origin_depot_uuid : helpers.data.depots.principal,
      destination_depot_uuid : helpers.data.depots.secondaire,
      anticipated_delivery_date : new Date(),
      date_sent : null,
      status_id : SHIPMENT_AT_DEPOT,
    };

    const incompleteShipment = {
      name : 'Test Incomplete shipment of medicines from principal to secondary',
      project_id : helpers.data.PROJECT,
      description : 'Note for incomplete shipment of medicines',
      origin_depot_uuid : helpers.data.depots.principal,
      destination_depot_uuid : helpers.data.depots.secondaire,
      anticipated_delivery_date : new Date(),
      date_sent : null,
      status_id : SHIPMENT_AT_DEPOT,
    };

    const lots = [
      {
        lot_uuid : LOT_QUININE_A,
        date_packed : new Date(),
        unit_weight : 0.1,
        quantity : 5,
      },
      {
        lot_uuid : LOT_QUININE_B,
        date_packed : new Date(),
        unit_weight : 0.15,
        quantity : 15,
      },
    ];

    const NUMBER_OF_SHIPMENTS = 2;

    it('POST /shipments create a new shipment', () => {
      const shipment = { ...newShipment, lots };
      return agent.post('/shipments')
        .send(shipment)
        .then((res) => {
          helpers.api.created(res);
          shipment.uuid = res.body.uuid;
        })
        .catch(helpers.handler);
    });

    it('POST /shipments create another shipment (without sending uuid)', () => {
      const shipment = { ...secondShipment, lots };
      return agent.post('/shipments')
        .send(shipment)
        .then((res) => {
          helpers.api.created(res);
          shipment.uuid = res.body.uuid;
        })
        .catch(helpers.handler);
    });

    it('POST /shipments should not create when missing data', () => {
      const shipment = { ...incompleteShipment, lots };
      delete shipment.name;
      return agent.post('/shipments')
        .send(shipment)
        .then((res) => {
          helpers.api.errored(res, 400);
          expect(res.body.code).to.be.equal('ERRORS.ER_BAD_NULL_ERROR');
        })
        .catch(helpers.handler);
    });

    it('GET /shipments returns list of shipments', () => {
      return agent.get(`/shipments/`)
        .then(res => {
          helpers.api.listed(res, NUMBER_OF_SHIPMENTS);
        })
        .catch(helpers.handler);
    });

    it('GET /shipments/allocated-assets get list of previously allocated assets', () => {
      return agent.get(`/shipments/allocated-assets`)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.an('array');
          expect(res.body.length).to.be.eq(lots.length * NUMBER_OF_SHIPMENTS);
          const lotUuids = lots.map(l => l.lot_uuid);
          res.body.forEach(item => {
            expect(lotUuids.includes(item.lot_uuid)).to.be.eq(true);
            expect(item.shipment_uuid).to.be.an('string');
            expect(item.lot_label).to.be.an('string');
            expect(item.inventory_code).to.be.an('string');
            expect(item.inventory_text).to.be.an('string');
            expect(item.reference).to.be.an('string');
            expect(item.quantity_sent).to.be.an('number');
          });
        })
        .catch(helpers.handler);
    });

    it('GET /shipments/:uuid get details of a shipment', () => {
      const formatDate = date => moment(date).format('YYYY-MM-DD');
      return agent.get(`/shipments/${newShipment.uuid}`)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.uuid).to.be.eq(newShipment.uuid);
          expect(res.body.status_id).to.be.eq(newShipment.status_id);
          expect(res.body.origin_depot_uuid).to.be.eq(newShipment.origin_depot_uuid);
          expect(res.body.destination_depot_uuid).to.be.eq(newShipment.destination_depot_uuid);
          expect(res.body.name).to.be.eq(newShipment.name);
          expect(res.body.description).to.be.eq(newShipment.description);
          const outDate = formatDate(res.body.anticipated_delivery_date);
          const inDate = formatDate(newShipment.anticipated_delivery_date);
          expect(outDate).to.be.eq(inDate);
        })
        .catch(helpers.handler);
    });

    it('GET /shipments/:uuid/full get details of a shipment with lots', () => {
      return agent.get(`/shipments/${newShipment.uuid}/full`)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.lots).to.an('array');
          res.body.lots.forEach((lot) => {
            const [sent] = lots.filter(l => l.lot_uuid === lot.lot_uuid);
            expect(lot.lot_uuid).to.be.eq(sent.lot_uuid);
            expect(lot.quantity).to.be.eq(sent.quantity);
          });
        })
        .catch(helpers.handler);
    });

    it('PUT /shipments/:uuid update a shipment (without updating lots)', () => {
      const update = {
        name : 'UPDATE Test 1 shipment of medicines from secondary to primary',
        project_id : helpers.data.PROJECT,
        description : 'UPDATE Note 1 for shipment of medicines',
        origin_depot_uuid : helpers.data.depots.secondaire,
        destination_depot_uuid : helpers.data.depots.principal,
        anticipated_delivery_date : new Date(),
        date_sent : null,
        status_id : SHIPMENT_AT_DEPOT,
      };
      return agent.put(`/shipments/${newShipment.uuid}`)
        .send(update)
        .then(res => {
          expect(res).to.have.status(204);
          return agent.get(`/shipments/${newShipment.uuid}/full`);
        })
        .then(res => {
          expect(res.body.name).to.be.eq(update.name);
          expect(res.body.description).to.be.eq(update.description);
          expect(res.body.origin_depot_uuid).to.be.eq(update.origin_depot_uuid);
          expect(res.body.destination_depot_uuid).to.be.eq(update.destination_depot_uuid);
          expect(res.body.status_id).to.be.eq(update.status_id);
          expect(res.body.lots).to.an('array');
          res.body.lots.forEach((lot) => {
            const [existingLot] = lots.filter(l => l.lot_uuid === lot.lot_uuid);
            expect(lot.lot_uuid).to.be.eq(existingLot.lot_uuid);
            expect(lot.quantity).to.be.eq(existingLot.quantity);
          });
        })
        .catch(helpers.handler);
    });

    it('PUT /shipments/:uuid update a shipment with lots', () => {
      const update = {
        name : 'UPDATE Test 1 shipment of medicines from principal to secondaire',
        description : 'UPDATE Note 1 for shipment of medicines',
        origin_depot_uuid : helpers.data.depots.principal,
        destination_depot_uuid : helpers.data.depots.secondaire,
        lots : [
          {
            lot_uuid : LOT_QUININE_B.replace(/0x/g, ''),
            date_packed : new Date(),
            unit_weight : 0.15,
            quantity : 7,
          },
        ],
      };
      return agent.put(`/shipments/${newShipment.uuid}`)
        .send(update)
        .then(res => {
          expect(res).to.have.status(204);
          return agent.get(`/shipments/${newShipment.uuid}/full`);
        })
        .then(res => {
          expect(res.body.name).to.be.eq(update.name);
          expect(res.body.description).to.be.eq(update.description);
          expect(res.body.origin_depot_uuid).to.be.eq(update.origin_depot_uuid);
          expect(res.body.destination_depot_uuid).to.be.eq(update.destination_depot_uuid);
          expect(res.body.lots).to.an('array');
          expect(res.body.lots.length).to.be.eq(update.lots.length);
          res.body.lots.forEach((lot) => {
            const [newLot] = update.lots.filter(l => l.lot_uuid === lot.lot_uuid);
            expect(lot.lot_uuid).to.be.eq(newLot.lot_uuid);
            expect(lot.quantity).to.be.eq(newLot.quantity);
          });
        })
        .catch(helpers.handler);
    });

    it('PUT /shipments/:uuid/ready-for-shipment set shipment status to ready for shipping', () => {
      return agent.put(`/shipments/${newShipment.uuid}/ready-for-shipment`)
        .then(res => {
          expect(res).to.have.status(201);
          return agent.get(`/shipments/${newShipment.uuid}`);
        })
        .then(res => {
          expect(res.body.status_id).to.be.eq(SHIPMENT_READY);
        })
        .catch(helpers.handler);
    });

    it('PUT /shipments/:uuid do not update a ready-to-go shipment', () => {
      const updates = {};
      return agent.put(`/shipments/${newShipment.uuid}`)
        .send(updates)
        .then(res => {
          expect(res).to.have.status(500);
        })
        .catch(helpers.handler);
    });

    it('DELETE /shipments/:uuid should delete an existing shipment', () => {
      return agent.delete(`/shipments/${newShipment.uuid}`)
        .then((res) => {
          helpers.api.deleted(res);
        })
        .catch(helpers.handler);
    });

  });

});
