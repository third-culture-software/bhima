/* eslint global-require:off */
const { expect } = require('chai');
const path = require('path');

describe('test/server-unit/install', () => {

  let install;
  before(() => {
    install = require('../../server/controllers/install');
  });

  it('should export setupDatabaseSchema function', () => {
    expect(install.setupDatabaseSchema).to.be.a('function');
  });

  it('should export checkBasicInstallExist function', () => {
    expect(install.checkBasicInstallExist).to.be.a('function');
  });

  it('should export proceedInstall function', () => {
    expect(install.proceedInstall).to.be.a('function');
  });

  // Additional integration test would verify that setupDatabaseSchema
  // can properly read and execute SQL files from server/models/
  // This requires a database connection and is better suited for integration tests
});
