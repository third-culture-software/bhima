angular.module('bhima.controllers')
  .controller('LoginController', LoginController);

LoginController.$inject = [
  'appcache', 'SessionService', 'LanguageService', 'ProjectService',
  'HelpdeskService', 'NotifyService', 'InstallService', '$state',
];

/**
 * Login Controller
 *
 * The login controller powers the bhima login page.
 * @param AppCache
 * @param Session
 * @param Languages
 * @param Projects
 * @param Helpdesk
 * @param Notify
 * @param Install
 * @param $state
 */
function LoginController(AppCache, Session, Languages, Projects, Helpdesk, Notify, Install, $state) {
  const vm = this;

  // the is the same as the SettingsContoller
  const cache = AppCache('preferences');

  // tracks the number of login attempts made by this user to show a
  // "forgot password" message if too many requests are made
  let attempts = 0;
  const maxAttempts = 3;

  // contains the values from the login form
  vm.credentials = {};
  vm.login = login;
  vm.languageService = Languages;
  vm.helpdesk_info = null;

  // vm.finishInstallationChecking help to :
  // hide loading indicator after checking
  // decide if the login form or the intallation button can be displayed
  vm.finishInstallationChecking = false;

  // signal if an error occured while checking(connection error,...)
  // in the case of error none of (login form and the intallation button) will be displayed
  vm.installationCheckingError = false;

  // displays a message if the user attempts more than maxCount
  // times to login and fails each time.
  vm.excessiveAttempts = false;

  // check basic installation information exist
  Install.checkBasicInstallExist()
    .then(handleCheckInstallExist)
    .catch(err => {
      vm.installationCheckingError = true;
      Notify.handleError(err);
    })
    .finally(() => {
      vm.finishInstallationChecking = true;
    });

  /**
   *
   * @param res
   */
  function handleCheckInstallExist(res) {
    vm.installationExist = res.isInstalled;
  }

  Languages.read()
    .then(handleLanguages);

  /**
   *
   * @param languages
   */
  function handleLanguages(languages) {
    vm.languages = languages;
  }

  Helpdesk.read()
    .then(setHelpdeskInfo);

  /**
   *
   * @param info
   */
  function setHelpdeskInfo(info) {
    if (info.helpdesk) {
      vm.helpdesk_info = info.helpdesk;
    }
  }

  // load project dependencies
  Projects.read()
    .then(handleProjects);

  /**
   *
   * @param projects
   */
  function handleProjects(projects) {
    vm.projects = projects;

    /** @todo - proper error handling in case there are no projects */
    if (vm.projects.length) {
      loadStoredProject();
    }
  }

  // If the user has logged in previously, the project will
  // be stored in appcache.  We will load it up as the default
  // choice.  If the user has not logged in previously, we will
  // select the first project as default.
  /**
   *
   */
  function loadStoredProject() {
    const defaultProjectIndex = 0;

    // if the project was found in the cache, set it to the default project
    // otherwise, use the defaultProjectIndex to set the default project
    vm.credentials.project = (cache.project)
      ? cache.project.id
      : vm.projects[defaultProjectIndex].id;
  }

  // logs the user in, creates the user client session
  /**
   *
   * @param form
   */
  function login(form) {
    // if the form is not valid, do not generate an $http request
    if (form.$invalid) { return null; }

    // use the session service to log the user in
    return Session.login(vm.credentials)
      .then(cacheProject)
      .catch(handleLoginResponse);
  }

  /**
   *
   * @param session
   */
  function cacheProject(session) {
    cache.project = session.project;

    // navigate to the main page
    $state.go('index');
  }

  /**
   *
   * @param response
   */
  function handleLoginResponse(response) {
    // if the user has tried too many times, display a fatal error working for
    // ten seconds.
    if (maxAttempts <= attempts++) {
      return Notify.danger('AUTH.TOO_MANY_TRYS');
    }

    // use growl-notifications to display an error at the top of the window
    return Notify.danger(response.data.code);
  }
}
