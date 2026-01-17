const rumer = require('../functions/rumer.function');

/**
 * @method getData
 *
 * @description
 * This method builds the RUMER (Registre d’Utilisation des Médicaments Et Recettes) report by month
 *
 * GET /api/stock/rumer
 * @param depotUuid The depot uuid. Ex. '0918657909BA11ED9604061E16E213FC'
 * @param start_date: The start date of the month. Ex. '2023-05-31T23:00:00.000Z'
 * @param end_date: The end date of the month. Ex. '2023-06-29T23:00:00.000Z'
 */
exports.getData = getData;

async function getData(req, res) {
  const output = await rumer.getData(req.query);
  res.status(200).json(output.data);
}
