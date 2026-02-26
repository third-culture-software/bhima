angular.module('bhima.controllers')
  .controller('CommentModalController', CommentModalController);

CommentModalController.$inject = [
  '$uibModalInstance', 'params', 'TransactionService', 'NotifyService',
];

/**
 * @param Instance
 * @param ModalParameters
 * @param Transactions
 * @param Notify
 * @function CommentModalController
 * @description
 * This controller powers the comment modal, used for putting comments on
 * individual rows of the Journal and General Ledger.  These comments do not
 * have to be restricted to unposted data, but can be put on posted and
 * unposted records.
 */
function CommentModalController(Instance, ModalParameters, Transactions, Notify) {
  const vm = this;

  vm.cancel = Instance.dismiss;
  vm.submit = submit;
  vm.rows = ModalParameters.rows;

  // get the unique comments using a map-filter
  const comments = vm.rows
    .map(row => row.entity.comment)
    .filter((comment, index, array) => (array.indexOf(comment) === index));

  // if the comments are homogenous, set the model to be the previous comment
  if (comments.length === 1) {
    [vm.comment] = comments;
  }

  // submit the comment
  /**
   *
   * @param form
   */
  function submit(form) {
    if (form.$invalid) { return; }

    const params = {
      uuids : vm.rows.map(row => row.entity.uuid),
      comment : vm.comment,
    };

    Transactions.comment(params)
      .then((res) => {
        if (!res) { return; }
        Instance.close(vm.comment);
      })
      .catch(Notify.handleError)
      .finally(Instance.close);
  }

}
