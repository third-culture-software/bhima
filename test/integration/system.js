

const helpers = require('./helpers');

describe('test/integration/system System Information API', () => {
  it('GET /system/information downloads the system architecture', () => {
    return agent.get('/system/information')
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.keys(
          'platform', 'numCPUs', 'machineUptime', 'processUptime', 'memoryUsage',
          'version', 'memory'
        );

        expect(res.body.memoryUsage).to.satisfy((x) => { return x >= 0 && x <= 100; });
        expect(res.body.processUptime).to.be.above(0);
        expect(res.body.machineUptime).to.be.above(0);
      })
      .catch(helpers.handler);
  });
});
