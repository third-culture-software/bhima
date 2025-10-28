/* eslint global-require:off */
const { expect } = require('chai');

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
});
