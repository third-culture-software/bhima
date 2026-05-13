/* global inject,  chai */
describe('test/client-unit/directives/bhSubmit directive', () => {
  let $scope;
  let element;
  let deferred;

  beforeEach(module('bhima.directives'));
  beforeEach(inject(($q, $rootScope) => {
    $scope = $rootScope;
    deferred = $q.defer();

    $scope.models = {
      formValue : null,
      submit : chai.spy(() => deferred.promise),
    };
  }));

  context('when the directive is added to a form', () => {
    beforeEach(inject(($compile) => {
      element = angular.element(`
        <form name="form" bh-submit="models.submit(form)" novalidate>
          <input ng-model="models.formValue" name="formValue">
        </form>
      `);

      $compile(element)($scope);
      $scope.$digest();
    }));

    it('when the directive is added to a form - sets $loading to false on the FormControl', () => {
      expect($scope.form.$loading).to.equal(false);
    });

    context('when the form is submitted', () => {
      beforeEach(() => {
        angular.element(element).trigger('submit');
      });

      it('when the form is submitted - sets $loading to true on the FormControl', () => {
        expect($scope.form.$loading).to.equal(true);
      });

      it('when the form is submitted - calls the submit callback function', () => {
        expect($scope.models.submit).to.have.been.called.with($scope.form);
      });

      context('when the submit callback is resolved', () => {
        beforeEach(() => {
          deferred.resolve();
          $scope.$digest();
        });

        it('when the submit callback is resolved - sets $loading to false on the FormControl', () => {
          expect($scope.form.$loading).to.equal(false);
        });
      });

      context('when the submit callback is rejected', () => {
        beforeEach(() => {
          deferred.reject(new Error('callback rejected'));
          $scope.$digest();
        });

        it('when the submit callback is rejected - sets $loading to false on the FormControl', () => {
          expect($scope.form.$loading).to.equal(false);
        });
      });
    });
  });

  context('when the directive is not added to a form', () => {
    it('when the directive is not added to a form - the compilation fails', inject(($compile) => {
      element = angular.element(`
        <form name="form">
          <div bh-submit="models.submit(form)">
            <input ng-model="models.formValue" name="formValue">
          </div>
        </form>
      `);

      try {
        $compile(element)($scope);
      } catch (error) {
        expect(error.message).to.have.string('Controller \'form\', '
            + 'required by directive \'bhSubmit\', can\'t be found');
      }
    }));
  });
});
