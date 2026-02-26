angular.module('bhima.services')
  .service('LotService', LotService);

LotService.$inject = ['PrototypeApiService', '$http', 'util', '$window'];

/**
 *
 * @param Api
 * @param $http
 * @param util
 * @param $window
 */
function LotService(Api, $http, util, $window) {
  const lots = new Api('/lots/');

  lots.read = (uuid) => {
    return Api.read.call(lots, uuid)
      .then((res) => {
        res.expiration_date = new Date(res.expiration_date);
        return res;
      });
  };

  /**
   * @function candidates()
   * @description returns a list of candidate lots for a specific inventory_uuid
   * @param {object} params
   * @param {string} params.inventory_uuid - get all lots for this inventory UUID
   * @param {string} params.date [now] - Optional date: lots after this date will be marked expired
   *                             If params.date is not given, it will default to the current time/date
   * @returns {list}
   */
  lots.candidates = (params) => {
    return $http.get(`/inventory/${params.inventory_uuid}/lot_candidates`)
      .then(util.unwrapHttpResponse)
      .then((data) => {
        const now = params.date ? new Date(params.date) : new Date();
        data.forEach((lot) => {
          lot.expiration_date = new Date(lot.expiration_date);
          lot.expired = lot.expiration_date < now;
        });
        return data;
      });
  };

  lots.dupes = (params) => {
    return $http.get('/lots_dupes', { params })
      .then(util.unwrapHttpResponse)
      .then((data) => {
        data.forEach((lot) => {
          lot.entry_date = new Date(lot.entry_date);
          lot.expiration_date = new Date(lot.expiration_date);
        });
        return data;
      });
  };

  lots.allDupes = (params) => {
    return $http.get('/lots_all_dupes', { params })
      .then(util.unwrapHttpResponse)
      .then((data) => {
        data.forEach((lot) => {
          lot.entry_date = new Date(lot.entry_date);
          lot.expiration_date = new Date(lot.expiration_date);
        });
        return data;
      });
  };

  lots.merge = (uuid, lotsToMerge) => {
    return $http.post(`/lots/${uuid}/merge/`, { lotsToMerge })
      .then(util.unwrapHttpResponse);
  };

  lots.autoMerge = () => {
    return $http.post(`/lots/merge/auto`, {})
      .then(util.unwrapHttpResponse);
  };

  lots.autoMergeZero = () => {
    return $http.post(`/lots/merge/autoZero`, {})
      .then(util.unwrapHttpResponse);
  };

  lots.assignments = (uuid, depotUuid) => {
    return $http.get(`/lots/${uuid}/assignments/${depotUuid}`)
      .then(util.unwrapHttpResponse);
  };

  lots.generateAssetTags = (number) => {
    return $window.open(`/lots/generate_barcodes/${number}`);
  };

  /**
   * @param lot
   * @function computeLotWarningFlags()
   *  @description
   *   Takes in a Lot and attaches warning flags to the Lot.
   *
   *   The logic goes like this, in this order.
   *   NOTE: Once a case is found to be true, all following cases are ignored.
   *     1. If the stock is exhausted, warn about that.
   *        (Recall that the user can choose to display exhausted lots in Lots Registry.)
   *     2. If the Lot is near expiration, warn about that.
   *        NOTE that this assumes the CMM and that stock exits all come from this
   *        lot exclusively.  But the CMM is based on not only on this lot, but on
   *        an aggregate all lots of this inventory item, so there is no guarantee
   *        that this will be correct.
   *     3. If the Lot is expired, warn about that.
   *     4. If a Lot is at risk of running out, warn about that. Again this is
   *        based on the aggregate CMM which may not work out exactly for this
   *        Lot in practice.
   *
   * Based on this logic, only one of the warning flags should be set to true.
   */
  lots.computeLotWarningFlags = (lot) => {
    lot.exhausted = false;
    lot.expired = false;
    lot.near_expiration = false;
    lot.at_risk_of_stock_out = false;

    if (lot.quantity <= 0) {
      lot.exhausted = true;
    } else if (lot.lifetime < 0) {
      // Equivalent to: lot.quantity > 0 && lot.lifetime < 0
      lot.expired = true;
    } else if (lot.IS_IN_RISK_EXPIRATION) {
      // Equivalent to: lot.quantity > 0 && lot.lifetime >= 0 && lot.IS_IN_RISK_EXPIRATION
      lot.near_expiration = true;
    } else if (lot.S_RISK <= 0) {
      // Equivalent to: lot.quantity > 0 && lot.lifetime >= 0 && lot.S_RISK <= 0
      lot.at_risk_of_stock_out = true;
    }

    return lot;
  };

  return lots;
}
