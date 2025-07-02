const RenderingTests = require('../rendering');

const target = '/reports/finance/invoices';

describe(`test/integration${target} Invoice Report`, RenderingTests(target));
