const helpers = require('../helpers');

// The /cron_email_reports API
describe('test/integration/cronEmailReport The /cron_email_reports API ', () => {
  // new cron_email_report object
  const record = {
    cron :
    {
      report_id : '4',
      has_dynamic_dates : 1,
      label : 'Balance 2018',
      entity_group_uuid : '00099B1D184A48DEB93D45FBD0AB3898',
      cron_id : 1,
    },
    reportOptions :
    {
      useSeparateDebitsAndCredits : 1,
      shouldPruneEmptyRows : 1,
      shouldHideTitleAccounts : 1,
      fiscal_id : 1,
      includeClosingBalances : 0,
      period_id : 1,
    },
  };

  it('POST /cron_email_reports create a new cron_email_report in the database', () => {
    return agent.post('/cron_email_reports')
      .send(record)
      .then((res) => {
        helpers.api.created(res);
        record.id = res.body.id;
      })
      .catch(helpers.handler);
  });

  it('GET /cron_email_reports list registered cron email reports', () => {
    return agent.get('/cron_email_reports')
      .send(record)
      .then((res) => {
        helpers.api.listed(res, 1);
      })
      .catch(helpers.handler);
  });

  it('GET /cron_email_reports list registered cron email reports based on report id', () => {
    return agent.get('/cron_email_reports')
      .query({ report_id : record.cron.report_id })
      .then((res) => {
        helpers.api.listed(res, 1);
      })
      .catch(helpers.handler);
  });

  // Need Mailgun must be configured correctly
  it.skip('POST /cron_email_reports/:id send an email for a report', () => {
    return agent.post(`/cron_email_reports/${record.id}`)
      .then((res) => {
        helpers.api.created(res);
      })
      .catch(helpers.handler);
  });

  it('DELETE /cron_email_reports should delete an existing cron_email_report', () => {
    return agent.delete(`/cron_email_reports/${record.id}`)
      .then((res) => {
        helpers.api.deleted(res);
      })
      .catch(helpers.handler);
  });
});
