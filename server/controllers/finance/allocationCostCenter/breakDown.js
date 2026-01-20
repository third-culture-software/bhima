/**
 *Distribution Cost Center Controller
 *This function allows you to make the distributions of
 *one or more transactions at the same time while specifying the percentage distribution rate
*/
const db = require('../../../lib/db');

async function breakDown(req, res) {
  const { data } = req.body;

  const isCost = data.is_cost;
  const dataValues = data.values;

  const dataToDistribute = [];
  const userId = req.session.user.id;

  data.transactions.forEach((transaction) => {
    Object.keys(dataValues).forEach((principalCenterId) => {
      const percentageValue = dataValues[principalCenterId];

      if (percentageValue) {
        const debitValuePercent = transaction.debit_equiv * (percentageValue / 100);
        const creditValuePercent = transaction.credit_equiv * (percentageValue / 100);
        if (debitValuePercent > 0 || creditValuePercent > 0) {
          dataToDistribute.push([
            db.bid(transaction.uuid),
            transaction.trans_id,
            transaction.account_id,
            isCost,
            transaction.is_variable,
            transaction.is_turnover,
            transaction.cost_center_id,
            principalCenterId,
            debitValuePercent,
            creditValuePercent,
            new Date(),
            userId,
          ]);
        }
      }
    });
  });

  const sql = `INSERT INTO cost_center_allocation (
      row_uuid,
      trans_id,
      account_id,
      is_cost,
      is_variable,
      is_turnover,
      auxiliary_cost_center_id,
      principal_cost_center_id,
      debit_equiv,
      credit_equiv,
      date_distribution, user_id) VALUES ?`;

  if (dataToDistribute.length) {
    await db.exec(sql, [dataToDistribute]);
  }

  res.sendStatus(201);
}

exports.breakDown = breakDown;
