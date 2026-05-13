/* eslint no-unused-expressions:"off" */


const helpers = require('./helpers');

// the /shipments API
describe('test/integration-stock/shipmentContainers The Shipments Containers API', () => {
  const SHIPMENT_AT_DEPOT = 2;

  const shipment1 = {
    uuid : helpers.uuid(),
    name : 'Test shipment',
    project_id : helpers.data.PROJECT,
    description : 'Note for shipment',
    origin_depot_uuid : helpers.data.depots.principal,
    destination_depot_uuid : helpers.data.depots.secondaire,
    anticipated_delivery_date : new Date(),
    date_sent : null,
    status_id : SHIPMENT_AT_DEPOT,
  };

  const shipment2 = {
    uuid : helpers.uuid(),
    name : 'Test shipment2',
    project_id : helpers.data.PROJECT,
    description : 'Note for shipment2',
    origin_depot_uuid : helpers.data.depots.principal,
    destination_depot_uuid : helpers.data.depots.secondaire,
    anticipated_delivery_date : new Date(),
    date_sent : null,
    status_id : SHIPMENT_AT_DEPOT,
  };

  const container11 = {
    uuid : helpers.uuid(),
    label : 'Ship1-Cont1',
    weight : 2.3,
    shipment_uuid : shipment1.uuid,
    container_type_id : 1,
  };

  const container12 = {
    uuid : helpers.uuid(),
    label : 'Ship1-Cont2',
    shipment_uuid : shipment1.uuid,
    container_type_id : 2,
  };

  const container21 = {
    uuid : helpers.uuid(),
    label : 'Ship2-Cont1',
    shipment_uuid : shipment2.uuid,
    container_type_id : 3,
  };

  it('POST /shipments create a new empty shipment for container tests', () => {
    const shipment = { ...shipment1, lots : [] };
    return agent.post('/shipments')
      .send(shipment)
      .then((res) => {
        helpers.api.created(res);
        shipment.uuid = res.body.uuid;
      })
      .catch(helpers.handler);
  });

  it('POST /shipments create second new empty shipment for container tests', () => {
    const shipment = { ...shipment2, lots : [] };
    return agent.post('/shipments')
      .send(shipment)
      .then((res) => {
        helpers.api.created(res);
        shipment.uuid = res.body.uuid;
      })
      .catch(helpers.handler);
  });

  // Now try creating 1st container
  it('POST /shipment_containers create container 1 for the 1st shipment', () => {
    return agent.post('/shipment_containers')
      .send(container11)
      .then((res1) => {
        helpers.api.created(res1);
        // Reload the new container to verify creation
        return agent.get(`/shipment_containers/${container11.uuid}/details`);
      })
      .then(res2 => {
        expect(res2.body.uuid).to.be.eq(container11.uuid);
        expect(res2.body.label).to.be.eq(container11.label);
        expect(res2.body.weight).to.be.eq(container11.weight);
      })
      .catch(helpers.handler);
  });

  // Now try creating 2nd container
  it('POST /shipment_containers create container 2 for the 1st shipment', () => {
    return agent.post('/shipment_containers')
      .send(container12)
      .then((res) => {
        helpers.api.created(res);
      })
      .catch(helpers.handler);
  });

  // Now try creating 3rd container
  it('POST /shipment_containers create container 1 for the 2nd shipment', () => {
    return agent.post('/shipment_containers')
      .send(container21)
      .then((res) => {
        helpers.api.created(res);
      })
      .catch(helpers.handler);
  });

  // Get the just-created containers
  it('GET /shipment_containers returns list of all 3 containers', () => {
    return agent.get(`/shipment_containers`)
      .then(res => {
        helpers.api.listed(res, 3);
      })
      .catch(helpers.handler);
  });

  // Get the just-created containers
  it('GET /shipment_containers returns list of all 2 containers for 1st shipment', () => {
    return agent.get(`/shipment_containers/${container11.shipment_uuid}`)
      .then(res => {
        helpers.api.listed(res, 2);
        const containers = res.body;
        const sameShipment = containers.every(
          (cnt) => { return cnt.shipment_uuid === container11.shipment_uuid; });
        expect(sameShipment).to.be.true;
      })
      .catch(helpers.handler);
  });

  it('PUT /shipment_containers/:uuid updates a container', () => {
    const update = {
      label : 'Ship1-Cont1-updated',
      container_type_id : 4,
    };
    return agent.put(`/shipment_containers/${container11.uuid}`)
      .send(update)
      .then(res => {
        expect(res).to.have.status(204);
        // Reload the updated container to verify changes
        return agent.get(`/shipment_containers/${container11.uuid}/details`);
      })
      .then(res => {
        expect(res.body.uuid).to.be.eq(container11.uuid);
        expect(res.body.shipment_uuid).to.be.eq(container11.shipment_uuid);
        expect(res.body.label).to.be.eq(update.label);
        expect(res.body.container_type).to.be.eq('BUNDLE');
      })
      .catch(helpers.handler);
  });

  it('DELETE /shipment_containers/:uuid should delete the 1st container', () => {
    return agent.delete(`/shipment_containers/${container11.uuid}`)
      .then((res) => {
        helpers.api.deleted(res);
      })
      .catch(helpers.handler);
  });

  it('DELETE /shipment_containers/:uuid should delete the 2nd container', () => {
    return agent.delete(`/shipment_containers/${container12.uuid}`)
      .then((res) => {
        helpers.api.deleted(res);
      })
      .catch(helpers.handler);
  });

  it('DELETE /shipment_containers/:uuid should delete the 3rd container', () => {
    return agent.delete(`/shipment_containers/${container21.uuid}`)
      .then((res) => {
        helpers.api.deleted(res);
      })
      .catch(helpers.handler);
  });

  it('DELETE /shipments/:uuid should delete the 1st test shipment', () => {
    return agent.delete(`/shipments/${shipment1.uuid}`)
      .then((res) => {
        helpers.api.deleted(res);
      })
      .catch(helpers.handler);
  });

  it('DELETE /shipments/:uuid should delete the 2nd test shipment', () => {
    return agent.delete(`/shipments/${shipment2.uuid}`)
      .then((res) => {
        helpers.api.deleted(res);
      })
      .catch(helpers.handler);
  });

});
