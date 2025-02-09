angular.module('bhima.services')
  .service('IprTaxService', IprTaxService);

IprTaxService.$inject = ['PrototypeApiService'];

/**
 * @class IprTaxService
 * @extends PrototypeApiService
 *
 * @description
 * Encapsulates common requests to the /payroll/taxes/ipr/ and configuration
 * /payroll/taxes/config/ipr URLs.
 */
function IprTaxService(Api) {
  const service = new Api('/payroll/taxes/ipr/');
  service.Config = new Api('/payroll/taxes/config/ipr/');
  service.Config.configData = configData;

  function configData(params, scales) {
    const iprConfig = {};
    let cumul = 0;

    iprConfig.taxe_ipr_id = params.taxe_ipr_id;
    iprConfig.rate = params.rate;
    iprConfig.tranche_annuelle_debut = params.tranche_annuelle_debut;
    iprConfig.tranche_annuelle_fin = params.tranche_annuelle_fin;

    iprConfig.tranche_mensuelle_debut = params.tranche_annuelle_debut / 12;
    iprConfig.tranche_mensuelle_fin = params.tranche_annuelle_fin / 12;

    iprConfig.ecart_annuel = params.tranche_annuelle_fin - params.tranche_annuelle_debut;
    iprConfig.ecart_mensuel = iprConfig.tranche_mensuelle_fin - iprConfig.tranche_mensuelle_debut;

    iprConfig.impot_annuel = iprConfig.ecart_annuel * (params.rate / 100);
    iprConfig.impot_mensuel = iprConfig.impot_annuel / 12;

    // TODO(@jniles) - test this configData() function
    scales.forEach((scale) => {
      if (scale.tranche_annuelle_fin === iprConfig.tranche_annuelle_debut) {
        cumul = iprConfig.impot_annuel + scale.cumul_annuel;
      }
    });

    // calculate the cumulative annual tax rate
    iprConfig.cumul_annuel = cumul;
    // compute the monthly cumulative tax rate
    iprConfig.cumul_mensuel = iprConfig.cumul_annuel / 12;

    return iprConfig;
  }

  return service;
}
