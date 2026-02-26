angular.module('bhima.controllers')
  .controller('settings', SettingsController);

SettingsController.$inject = [
  'LanguageService', 'SessionService', 'bhConstants', '$translate',
  'NotifyService', '$window', 'SystemService', 'ReceiptService',
];

/**
 * Settings Page Controller
 *
 * The settings page allows a user to control the local application settings,
 * such as display language.
 * @param Languages
 * @param Session
 * @param Constants
 * @param $translate
 * @param Notify
 * @param $window
 * @param System
 * @param Receipts
 * @class
 */
function SettingsController(Languages, Session, Constants, $translate, Notify, $window, System, Receipts) {
  const vm = this;

  vm.back = function back() { $window.history.back(); };
  vm.cachePosReceipt = cachePosReceipt;
  vm.cacheSimplified = cacheSimplified;
  vm.cacheInvoiceCurrency = cacheInvoiceCurrency;
  vm.cacheReceiptRenderer = cacheReceiptRenderer;

  // load settings from services
  vm.settings = {
    language : Languages.key,
    posReceipt : Receipts.posReceipt,
    simplified : Receipts.simplified,
    renderer : Receipts.renderer,
  };

  vm.rendererOptions = [
    { id : Receipts.renderers.HTML, label : 'REPORT.UTIL.HTML' },
    { id : Receipts.renderers.PDF, label : 'REPORT.UTIL.PDF' },
  ];

  // bind methods/services to the view
  vm.languageService = Languages;
  vm.logout = Session.logout;

  // bind the language service for use in the view
  Languages.read()
    .then(languages => {
      vm.languages = languages;
    })
    .catch(Notify.handleError);

  // formatting or bug report
  const emailAddress = Constants.settings.CONTACT_EMAIL;
  const subject = `[BUG] ${new Date().toLocaleDateString()} -  ${Session.enterprise.name}`;

  // get the translated bug report
  $translate('SETTINGS.BUG_REPORT')
    .then(body => {

      const text = `${Session.user.username} ${new Date().toLocaleDateString()}

      ${body}`;

      // template in the bug link
      vm.bugLink = encodeURI(`${emailAddress}?subject=${subject}&body=${text}`);
    })
    .catch(Notify.handleError);

  // loads system information from the server
  /**
   *
   */
  function loadSystemInformation() {
    System.information()
      .then(data => {
        vm.system = data;
      });
  }

  /**
   *
   * @param value
   */
  function cachePosReceipt(value) {
    Receipts.setPosReceipt(value);
  }

  /**
   *
   * @param value
   */
  function cacheSimplified(value) {
    Receipts.setSimplified(value);
  }

  /**
   *
   * @param value
   */
  function cacheInvoiceCurrency(value) {
    Receipts.setReceiptCurrency(value);
  }

  /**
   *
   * @param value
   */
  function cacheReceiptRenderer(value) {
    Receipts.setReceiptRenderer(value);
  }

  // initialize with data
  loadSystemInformation();
}
