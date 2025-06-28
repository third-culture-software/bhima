const RenderingTests = require('../rendering');

const target = '/reports/finance/vouchers';

describe(`test/integration${target} Voucher Report`, RenderingTests(target));
