/* eslint no-unused-expressions:off */
/* global inject, chai */

describe('test/client-unit/components/bhLocationSelect', () => {

  const template = `
    <bh-location-select
      location-uuid="locationUuid"
      on-location-change="onLocationChange(uuid)">
    </bh-location-select>
  `;

  // make sure the modules are correctly loaded.
  beforeEach(module(
    'bhima.services',
    'angularMoment',
    'ngStorage',
    'pascalprecht.translate',
    'bhima.components',
    'bhima.constants',
    'templates',
    'bhima.mocks',
    'ui.router',
    'ui.bootstrap',
  ));

  let $scope;
  let $compile;
  let $rootScope; // eslint-disable-line no-unused-vars
  let $q;
  let $uibModal;
  let element;
  let Session;
  let Mocks;
  let httpBackend;

  // utility fns
  const find = (elm, selector) => elm[0].querySelector(selector);
  const getCtrl = (elm) => elm.controller('bhLocationSelect');

  const baseUrl = '/locations';

  // fixture data - shaped the way LocationService.location() denormalises a
  // full location record (village/sector/province/country as name strings),
  // vs. the way LocationService.villages()/sectors()/etc return { uuid, name }
  // objects for the cascading <select> elements.
  const country = { uuid : 'country-uuid', name : 'DR Congo' };
  const province = { uuid : 'province-uuid', name : 'Kinshasa' };
  const sector = { uuid : 'sector-uuid', name : 'Gombe' };
  const village = { uuid : 'village-uuid', name : 'Village A' };

  const fullLocation = {
    villageUuid  : village.uuid,
    village      : village.name,
    sectorUuid   : sector.uuid,
    sector       : sector.name,
    provinceUuid : province.uuid,
    province     : province.name,
    countryUuid  : country.uuid,
    country      : country.name,
  };

  // exact URLs the LocationService will request, given the fixtures above.
  // LocationService.provinces({ country }) etc build $http params as query
  // strings, and .location(uuid) hits /detail/<uuid> with no query string.
  const urls = {
    countries : `${baseUrl}/countries`,
    provinces : `${baseUrl}/provinces?country=${country.uuid}`,
    sectors   : `${baseUrl}/sectors?province=${province.uuid}`,
    villages  : `${baseUrl}/villages?sector=${sector.uuid}`,
    detail    : `${baseUrl}/detail/${village.uuid}`,
  };

  // registers "when" (not "expect") handlers for every endpoint the
  // component might call, so repeated requests to the same URL - e.g. a
  // fresh "countries" call each time the component is recompiled - keep
  // matching, and a single httpBackend.flush() can resolve an entire
  // chained request (detail -> provinces -> sectors -> villages).
  /**
   *
   */
  function stubLocationEndpoints() {
    httpBackend.whenGET(urls.countries).respond(200, [country]);
    httpBackend.whenGET(urls.provinces).respond(200, [province]);
    httpBackend.whenGET(urls.sectors).respond(200, [sector]);
    httpBackend.whenGET(urls.villages).respond(200, [village]);
    httpBackend.whenGET(urls.detail).respond(200, fullLocation);
  }

  beforeEach(inject((_$rootScope_, _$compile_, _$q_, $httpBackend, _SessionService_, _MockDataService_, _$uibModal_) => {
    Session = _SessionService_;
    Mocks = _MockDataService_;

    httpBackend = $httpBackend;
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $q = _$q_;
    $uibModal = _$uibModal_;
    $scope = _$rootScope_.$new();

    Session.create(Mocks.user(), Mocks.enterprise(), Mocks.stock_settings(), Mocks.project());

    stubLocationEndpoints();

    $scope.locationUuid = null;
    $scope.onLocationChange = chai.spy();

    element = $compile(angular.element(template))($scope);
    $scope.$digest();
    httpBackend.flush(); // resolves the initial "countries" request fired from $onInit
  }));

  afterEach(() => {
    httpBackend.verifyNoOutstandingExpectation();
    httpBackend.verifyNoOutstandingRequest();
  });

  it('loads countries on initialisation', () => {
    const ctrl = getCtrl(element);
    expect(ctrl.countries).to.deep.equal([country]);
  });

  it('the province/sector/village <select>s start disabled', () => {
    const ctrl = getCtrl(element);
    expect(ctrl.disabled.province).to.equal(true);
    expect(ctrl.disabled.sector).to.equal(true);
    expect(ctrl.disabled.village).to.equal(true);
  });

  describe('cascading selection', () => {

    it('selecting a country loads provinces and enables the province select', () => {
      const ctrl = getCtrl(element);

      ctrl.country = country;
      ctrl.loadProvinces();
      httpBackend.flush();

      expect(ctrl.provinces).to.deep.equal([province]);
      expect(ctrl.disabled.province).to.equal(false);
    });

    it('selecting a province loads sectors and clears any previously selected village', () => {
      const ctrl = getCtrl(element);

      ctrl.country = country;
      ctrl.loadProvinces();
      httpBackend.flush();

      ctrl.province = province;
      ctrl.village = village; // simulate a previously-selected village
      ctrl.loadSectors();
      httpBackend.flush();

      expect(ctrl.sectors).to.deep.equal([sector]);
      expect(ctrl.villages).to.deep.equal([]);
    });

    it('selecting a sector loads villages', () => {
      const ctrl = getCtrl(element);

      ctrl.country = country;
      ctrl.loadProvinces();
      httpBackend.flush();

      ctrl.province = province;
      ctrl.loadSectors();
      httpBackend.flush();

      ctrl.sector = sector;
      ctrl.loadVillages();
      httpBackend.flush();

      expect(ctrl.villages).to.deep.equal([village]);
      expect(ctrl.disabled.village).to.equal(false);
    });

    it('selecting a village invokes on-location-change with its uuid', () => {
      const ctrl = getCtrl(element);

      ctrl.village = village;
      ctrl.updateLocationUuid();
      $scope.$digest();

      expect($scope.onLocationChange).to.have.been.called.with(village.uuid);
    });

    it('clearing an upstream selection invokes on-location-change with null', () => {
      const ctrl = getCtrl(element);

      // select a village first
      ctrl.village = village;
      ctrl.updateLocationUuid();
      $scope.$digest();
      expect($scope.onLocationChange).to.have.been.called.with(village.uuid);

      // now simulate the user changing an upstream <select>, which clears
      // the village
      ctrl.village = undefined;
      ctrl.updateLocationUuid();
      $scope.$digest();

      expect($scope.onLocationChange).to.have.been.called.with(null);
    });

    it('does not mutate the one-way location-uuid binding', () => {
      const ctrl = getCtrl(element);

      ctrl.village = village;
      ctrl.updateLocationUuid();
      $scope.$digest();

      // locationUuid is now a one-way ('<') binding - the component must
      // notify via on-location-change rather than writing back to the
      // binding itself.
      expect($scope.locationUuid).to.equal(null);
    });

  });

  describe('pre-populating from an existing location-uuid', () => {

    beforeEach(() => {
      $scope.locationUuid = village.uuid;
      element = $compile(angular.element(template))($scope);
      $scope.$digest();
      // resolves the chained countries + detail + provinces + sectors +
      // villages requests fired by $onInit/$onChanges in a single pass.
      httpBackend.flush();
    });

    it('binds each <select> using the "name" property expected by ng-options', () => {
      const ctrl = getCtrl(element);

      // regression test for the initial-load labelling bug: the controller
      // used to assign e.g. `village.village` instead of `village.name`,
      // which the template's ng-options (`village.name`) could never read.
      expect(ctrl.country).to.deep.equal({ uuid : country.uuid, name : country.name });
      expect(ctrl.province).to.deep.equal({ uuid : province.uuid, name : province.name });
      expect(ctrl.sector).to.deep.equal({ uuid : sector.uuid, name : sector.name });
      expect(ctrl.village).to.deep.equal({ uuid : village.uuid, name : village.name });
    });

    it('refreshes the cascading datasources so every <select> is usable', () => {
      const ctrl = getCtrl(element);

      expect(ctrl.provinces).to.deep.equal([province]);
      expect(ctrl.sectors).to.deep.equal([sector]);
      expect(ctrl.villages).to.deep.equal([village]);
      expect(ctrl.disabled.province).to.equal(false);
      expect(ctrl.disabled.sector).to.equal(false);
      expect(ctrl.disabled.village).to.equal(false);
    });

    it('does not fire on-location-change just from loading the initial value', () => {
      // loading the location the parent already told us about should not
      // "echo" a redundant change notification back up.
      expect($scope.onLocationChange).not.to.have.been.called();
    });

  });

  describe('external location-uuid changes ($onChanges)', () => {

    it('reloads the location when the parent changes location-uuid after mount', () => {
      $scope.locationUuid = village.uuid;
      $scope.$digest();
      httpBackend.flush();

      const ctrl = getCtrl(element);
      expect(ctrl.village).to.deep.equal({ uuid : village.uuid, name : village.name });
    });

  });

  describe('add location modal', () => {

    it('clicking the "add location" link opens the modal', () => {
      chai.spy.on($uibModal, 'open', () => ({ result : $q.defer().promise }));

      const link = find(element, '[data-location-modal-open]');
      angular.element(link).triggerHandler('click');
      $scope.$digest();

      expect($uibModal.open).to.have.been.called.once;
    });

  });
});
