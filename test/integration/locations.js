/* global expect, agent */
/* eslint-disable no-unused-expressions */

const _ = require('lodash');
const helpers = require('./helpers');

/*
 * The /locations API
 */
describe('test/integration/locations Locations Interface', () => {
  /*
   * number of test villages, sectors, provinces, and countries in the test
   * dataset.
   */
  const numVillages = 1;
  const numSectors = 1;
  const numProvinces = 25;
  const numCountries = 1;

  const mergeCountry = {
    selected : 'DBE330B65CDE48308C30DC00ECCD1A5F',
    other : 'C17240C65F0244048D4D15809C7887B6',
    locationStatus : 'country',
  };

  const mergeProvince1 = {
    selected : '0xF6FC74697E5845CBB87CF08AF93EDADE',
    other : '9308D98C326F427D9E5BC62A894AA334',
    locationStatus : 'province',
  };

  const mergeSector1 = {
    selected : '0404E9EAEBD64F20B1F86DC9F9313450',
    other : '5B4FBED5763743A090048FB053B17593',
    locationStatus : 'sector',
  };

  const mergeSector2 = {
    selected : '0404E9EAEBD64F20B1F86DC9F9313450',
    other : '0AA4E8785ACB4E0CBE0B8E7B61CAE782',
    locationStatus : 'sector',
  };

  const mergeVillage1 = {
    selected : 'B472A67F24624EFC9CB52201530CCBD4',
    other : '03C1C626183A4B549C2DB01434D44867',
    locationStatus : 'village',
  };

  const mergeVillage2 = {
    selected : '1F162A109F6747889EFFC1FEA42FCC9B',
    other : 'B472A67F24624EFC9CB52201530CCBD4',
    locationStatus : 'village',
  };

  /*
   * Selected sector, province, and country uuids to test the query string
   * filtering of the dataset.
   */
  const sectorUuid = '0404e9ea-ebd6-4f20-b1f8-6dc9f9313450'; // Tshikapa
  const provinceUuid = 'f6fc7469-7e58-45cb-b87c-f08af93edade'; // Bas Congo
  const countryUuid = 'dbe330b6-5cde-4830-8c30-dc00eccd1a5f'; // DRC

  /*
   * the filtered record counts associated with the previous filters
   */
  const numFilteredVillages = 1;
  const numFilteredSectors = 1;
  const numFilteredProvinces = 25;

  /** Merge Locations */
  it('POST /locations/merge/ should Merge country', () => {
    return agent.post('/locations/merge/')
      .send(mergeCountry)
      .then((res) => {
        expect(res).to.have.status(200);
      })
      .catch(helpers.handler);
  });

  it('POST /locations/merge/ should Merge province first', () => {
    return agent.post('/locations/merge/')
      .send(mergeProvince1)
      .then((res) => {
        expect(res).to.have.status(200);
      })
      .catch(helpers.handler);
  });

  it('POST /locations/merge/ should Merge Sector first', () => {
    return agent.post('/locations/merge/')
      .send(mergeSector1)
      .then((res) => {
        expect(res).to.have.status(200);
      })
      .catch(helpers.handler);
  });

  it('POST /locations/merge/ should Merge Village first', () => {
    return agent.post('/locations/merge/')
      .send(mergeVillage1)
      .then((res) => {
        expect(res).to.have.status(200);
      })
      .catch(helpers.handler);
  });

  it('POST /locations/merge/ should Merge Sector second', () => {
    return agent.post('/locations/merge/')
      .send(mergeSector2)
      .then((res) => {
        expect(res).to.have.status(200);
      })
      .catch(helpers.handler);
  });

  it('POST /locations/merge/ should Merge Village second', () => {
    return agent.post('/locations/merge/')
      .send(mergeVillage2)
      .then((res) => {
        expect(res).to.have.status(200);
      })
      .catch(helpers.handler);
  });

  /* the test enterprise's location uuid */
  const detailUuid = '1f162a10-9f67-4788-9eff-c1fea42fcc9b';

  it('GET /locations/villages should return a list of villages', () => {
    return agent.get('/locations/villages')
      .then((res) => {
        // check that we received the correct number of villages
        helpers.api.listed(res, numVillages);
      })
      .catch(helpers.handler);
  });

  it('GET /locations/villages?sector={uuid} should return a filtered list of villages', () => {
    return agent.get(`/locations/villages?sector=${sectorUuid}`)
      .then((res) => {
        // check that we received the correct number of villages
        helpers.api.listed(res, numFilteredVillages);
      })
      .catch(helpers.handler);
  });

  it('GET /locations/sectors should return a list of sectors', () => {
    return agent.get('/locations/sectors')
      .then((res) => {
        // check that we received the correct number of sectors
        helpers.api.listed(res, numSectors);
      })
      .catch(helpers.handler);
  });

  it('GET /locations/sectors?province={uuid} should return a filtered list of sectors', () => {
    return agent.get(`/locations/sectors?province=${provinceUuid}`)
      .then((res) => {
        // check that we received the correct number of sectors
        helpers.api.listed(res, numFilteredSectors);
      })
      .catch(helpers.handler);
  });

  it('GET /locations/provinces should return a list of provinces', () => {
    return agent.get('/locations/provinces')
      .then((res) => {
      // check that we received the correct number of provinces
        helpers.api.listed(res, numProvinces);
      })
      .catch(helpers.handler);
  });

  it('GET /locations/provinces?country={uuid} should return a filtered list of provinces', () => {
    return agent.get(`/locations/provinces?country=${countryUuid}`)
      .then((res) => {
      // check that we received the correct number of provinces
        helpers.api.listed(res, numFilteredProvinces);
      })
      .catch(helpers.handler);
  });

  it('GET /locations/countries should return a list of countries', () => {
    return agent.get('/locations/countries')
      .then((res) => {
      // check that we received the correct number of countries
        helpers.api.listed(res, numCountries);
      })
      .catch(helpers.handler);
  });

  it('GET /locations/detail/:uuid should return a JSON description of the location', () => {
    return agent.get('/locations/detail/'.concat(detailUuid))
      .then((res) => {
      // make sure we successfully found the location
        expect(res).to.have.status(200);
        expect(res).to.be.an('object');

        expect(res.body).to.have.keys([
          'villageUuid', 'village', 'sector', 'sectorUuid',
          'province', 'provinceUuid', 'country', 'countryUuid',
          'longitude', 'latitude',
        ]);
      })
      .catch(helpers.handler);
  });

  it('GET /locations/detail/ returns a list of all locations country, province, district and village', () => {
    return agent.get('/locations/detail/')
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.an('object');
        expect(res.body).to.have.length(numVillages);

        expect(res.body[0]).to.have.keys([
          'villageUuid', 'village', 'sector', 'sectorUuid',
          'province', 'provinceUuid', 'country', 'countryUuid',
          'longitude', 'latitude',
        ]);
      })
      .catch(helpers.handler);
  });

  /* CREATE methods */

  const country = {
    uuid : helpers.uuid(),
    name : 'Test Country',
  };

  const country2 = {
    uuid : helpers.uuid(),
    name : 'Another Country',
  };

  const province = {
    uuid : helpers.uuid(),
    name : 'Test Province',
    country_uuid : country.uuid,
  };
  const province2 = {
    uuid : helpers.uuid(),
    name : 'Another Province',
    country_uuid : country.uuid,
  };

  const sector = {
    uuid : helpers.uuid(),
    name : 'Test Sector',
    province_uuid : province.uuid,
  };

  const sector2 = {
    uuid : helpers.uuid(),
    name : 'Another Sector',
    province_uuid : province.uuid,
  };

  const village = {
    uuid : helpers.uuid(),
    name : 'Test Village',
    sector_uuid : sector.uuid,
  };

  const village2 = {
    uuid : helpers.uuid(),
    name : 'Another Village',
    sector_uuid : sector.uuid,
  };

  it('POST /locations/countries should create a country', () => {
    return agent.post('/locations/countries')
      .send(country)
      .then((res) => {
        helpers.api.created(res);
      })
      .catch(helpers.handler);
  });

  it('POST /locations/countries should create another country', () => {
    return agent.post('/locations/countries')
      .send(country2)
      .then((res) => {
        helpers.api.created(res);
      })
      .catch(helpers.handler);
  });

  it('POST /locations/provinces should create a province', () => {
    return agent.post('/locations/provinces')
      .send(province)
      .then((res) => {
        helpers.api.created(res);
      })
      .catch(helpers.handler);
  });

  it('POST /locations/provinces should create another province', () => {
    return agent.post('/locations/provinces')
      .send(province2)
      .then((res) => {
        helpers.api.created(res);
      })
      .catch(helpers.handler);
  });

  it('POST /locations/sectors should create a sector', () => {
    return agent.post('/locations/sectors')
      .send(sector)
      .then((res) => {
        helpers.api.created(res);
      })
      .catch(helpers.handler);
  });

  it('POST /locations/sectors should create another sector', () => {
    return agent.post('/locations/sectors')
      .send(sector2)
      .then((res) => {
        helpers.api.created(res);
      })
      .catch(helpers.handler);
  });

  it('POST /locations/villages should create a village', () => {
    return agent.post('/locations/villages')
      .send(village)
      .then((res) => {
        helpers.api.created(res);
      })
      .catch(helpers.handler);
  });

  it('POST /locations/villages should create another village', () => {
    return agent.post('/locations/villages')
      .send(village2)
      .then((res) => {
        helpers.api.created(res);
      })
      .catch(helpers.handler);
  });

  it('POST /locations/villages should not create the same village twice in the same sector', () => {
    return agent.post('/locations/villages')
      .send(village)
      .then((res) => {
        helpers.api.errored(res, 400);
      })
      .catch(helpers.handler);
  });

  it('POST /locations/villages should create the same village name in a different sector', () => {
    const copy = _.clone(village);
    copy.sector_uuid = sectorUuid;
    copy.uuid = helpers.uuid();

    return agent.post('/locations/villages')
      .send(copy)
      .then((res) => {
        helpers.api.created(res);
      })
      .catch(helpers.handler);
  });

  it('PUT /locations/villages/:uuid should update a Village', () => {
    return agent.put(`/locations/villages/${village.uuid}`)
      .send({ name : 'Update Village' })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.not.be.empty;
        expect(res.body.name).to.equal('Update Village');
      })
      .catch(helpers.handler);
  });

  it('PUT /locations/sectors/:uuid should update a Sector', () => {
    return agent.put(`/locations/sectors/${sector.uuid}`)
      .send({ name : 'Update New Sector' })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.not.be.empty;
        expect(res.body.name).to.equal('Update New Sector');
      })
      .catch(helpers.handler);
  });

  it('PUT /locations/provinces/:uuid should update a Province', () => {
    return agent.put(`/locations/provinces/${province.uuid}`)
      .send({ name : 'Update New Province' })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.not.be.empty;
        expect(res.body.name).to.equal('Update New Province');
      })
      .catch(helpers.handler);
  });

  it('PUT /locations/countries/:uuid should update a Country', () => {
    return agent.put(`/locations/countries/${country.uuid}`)
      .send({ name : 'Update New Country' })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.not.be.empty;
        expect(res.body.name).to.equal('Update New Country');
      })
      .catch(helpers.handler);
  });

  it('DELETE /locations/countries/:uuid should delete a Country', () => {
    return agent.delete(`/locations/countries/${country2.uuid}`)
      .then((res) => {
        expect(res).to.have.status(204);
      })
      .catch(helpers.handler);
  });

  it('DELETE /locations/provinces/:uuid should delete a province', () => {
    return agent.delete(`/locations/provinces/${province2.uuid}`)
      .then((res) => {
        expect(res).to.have.status(204);
      })
      .catch(helpers.handler);
  });

  it('DELETE /locations/sectors/:uuid should delete a sector', () => {
    return agent.delete(`/locations/sectors/${sector2.uuid}`)
      .then((res) => {
        expect(res).to.have.status(204);
      })
      .catch(helpers.handler);
  });

  it('DELETE /locations/villages/:uuid should delete a Village', () => {
    return agent.delete(`/locations/villages/${village2.uuid}`)
      .then((res) => {
        expect(res).to.have.status(204);
      })
      .catch(helpers.handler);
  });
});
