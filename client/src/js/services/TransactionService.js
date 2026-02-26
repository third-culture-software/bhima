angular.module('bhima.services')
  .service('TransactionService', TransactionService);

TransactionService.$inject = ['$http', 'util', '$uibModal', 'AccountService'];

/**
 *
 * @param $http
 * @param util
 * @param Modal
 * @param Accounts
 */
function TransactionService($http, util, Modal, Accounts) {
  const service = this;
  const baseUrl = '/transactions/';

  service.remove = remove;
  service.comment = comment;
  service.openCommentModal = openCommentModal;
  service.history = historyFn;

  // TODO(@jniles) - move this into its own transaction service
  service.offlineValidation = offlineValidation;

  /**
   * @param uuid
   * @function remove
   * @description
   * This function removes a transaction from the database via the transaction
   * delete route.  It also removes the corresponding invoice/voucher/cash
   * payment as necessary.
   */
  function remove(uuid) {
    const url = baseUrl.concat(uuid);
    return $http.delete(url)
      .then(util.unwrapHttpResponse);
  }

  /**
   * @param params
   * @function comment
   * @description
   * This function comments on individual lines of a transaction.  It is used by
   * the comment modal to modify, remove or add comments to transactions.
   */
  function comment(params) {
    const url = baseUrl.concat('comments');
    return $http.put(url, { params })
      .then(util.unwrapHttpResponse);
  }

  /**
   * @param rows
   * @function openCommentModal
   * @description
   * This method opens the comment modal to allow a user to comment on
   * rows of transactions.
   */
  function openCommentModal(rows) {
    const config = {
      templateUrl  : 'modules/journal/modals/comment.modal.html',
      controller   : 'CommentModalController',
      controllerAs : '$ctrl',
      resolve : {
        params :  () => rows,
      },
    };

    return Modal.open(config).result;
  }

  /**
   * @param uuid
   * @function historyFn
   * @description
   * This function loads the history of a given transaction from the database.
   */
  function historyFn(uuid) {
    const url = baseUrl.concat(uuid, '/history');
    return $http.get(url)
      .then(util.unwrapHttpResponse);
  }

  const ERROR_MISSING_TRANSACTION_TYPE = 'TRANSACTIONS.MISSING_TRANSACTION_TYPE';
  const ERROR_IMBALANCED_TRANSACTION = 'TRANSACTIONS.IMBALANCED_TRANSACTION';
  const ERROR_SINGLE_ACCOUNT_TRANSACTION = 'TRANSACTIONS.SINGLE_ACCOUNT_TRANSACTION';
  const ERROR_SINGLE_ROW_TRANSACTION = 'TRANSACTIONS.SINGLE_ROW_TRANSACTION';
  const ERROR_INVALID_DEBITS_AND_CREDITS = 'VOUCHERS.COMPLEX.ERROR_AMOUNT';
  const ERROR_NEGATIVE_NUMBERS = 'VOUCHERS.COMPLEX.ERROR_NEGATIVE_NUMBERS';
  const ERROR_COST_CENTER_ON_OTHER_ACCOUNT = 'VOUCHERS.COMPLEX.ERROR_COST_CENTER_ON_OTHER_ACCOUNT';

  /**
   * @param rows
   * @function offlineValidation
   * @description
   * This function validates transactions without doing a round-trip to the server.  It implements some simple checks
   * such as:
   *  1. Making sure a transaction has multiple lines
   *  2. Make sure a transaction is balanced
   *  3. Making sure a transaction involves at least two accounts
   *  4. Making sure a transaction has a transaction_type associated with it.
   *  5. Make sure both the debits and credits are defined and not equal to each other.
   *
   * If any of these checks fail, the transaction submission is aborted until the user corrects those mistakes.
   */
  function offlineValidation(rows) {
    const hasSingleLine = rows.length < 2;
    if (hasSingleLine) {
      return ERROR_SINGLE_ROW_TRANSACTION;
    }

    let debits = 0;
    let credits = 0;

    let i = rows.length;
    let row;

    while (i--) {
      row = rows[i];

      const hasTransactionType = typeof row.transaction_type_id === 'number';
      if (!hasTransactionType) {
        return ERROR_MISSING_TRANSACTION_TYPE;
      }

      const hasNegativeNumbers = (row.debit < 0 || row.credit < 0);
      if (hasNegativeNumbers) {
        return ERROR_NEGATIVE_NUMBERS;
      }

      const hasSingleNumericValue = !util.xor(Boolean(row.debit), Boolean(row.credit));
      if (hasSingleNumericValue) {
        return ERROR_INVALID_DEBITS_AND_CREDITS;
      }

      const hasCostCenters = angular.isDefined(row.cost_center_id) && row.cost_center_id !== null;
      if (hasCostCenters && !Accounts.isIncomeOrExpenseAccountTypeId(row.account_type_id)) {
        return ERROR_COST_CENTER_ON_OTHER_ACCOUNT;
      }

      credits += row.credit;
      debits += row.debit;
    }

    const uniqueAccountsArray = rows
      .map(r => r.account_id)
      .filter((accountId, index, array) => array.indexOf(accountId) === index);

    const hasSingleAccount = uniqueAccountsArray.length === 1;
    if (hasSingleAccount) {
      return ERROR_SINGLE_ACCOUNT_TRANSACTION;
    }

    const hasImbalancedTransaction = Number(debits.toFixed('2')) !== Number(credits.toFixed('2'));
    if (hasImbalancedTransaction) {
      return ERROR_IMBALANCED_TRANSACTION;
    }

    return false;
  }

  return service;
}
