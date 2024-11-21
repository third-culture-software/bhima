Contributor's Guide
=======================

 - Project page: https://github.com/Third-Culture-Software/bhima
 - Email us: developers@imaworldhealth.org

Thank you for your interest!  This document aims to provide a step by step guide for making your first contribution to the bhima codebase.  If you have any questions, feel free to email the team.

#### Step 1: Obtaining the code

For an in-depth installation guide (including trouble-shooting tips), please refer to the [INSTALL.md](./docs/INSTALL.md) file.  Continue reading for the basic steps.

 1. Clone the official repository onto your local machine: `git clone git@github.com:IMA-WorldHealth/bhima.git bhima`
 2. Install the development dependencies: `npm install && bower install`
 3. Build the client and server `npm run build`
 4. Startup the server `npm run app`.

For troubleshooting, please see [the installation guide](./docs/INSTALL.md).

#### Step 2: Setting up GitHub

All our code contributions are monitored via pull requests on Github.  If you have not already, set up an account on Github and
fork the bhima repository.

#### Step 3: Determining what to contribute

There are three main areas you can contribute:
 1. **Bugs**  We use GitHub isssues as our bug tracker.  Did the application crash?  Is there a misspelling or poor word choice?  Something else that just annoys you?  Sometimes our design choices are deliberate, other times they are the result of carelessness.  Create an issue about it so that we can fix it!

 2. **Translation** We aim to be an international application.  Therefore, all text in the application can be translated.  We use [angular-translate](https://github.com/angular-translate/angular-translate) to transform key-value pairs into the appropriate text.  If you would like to translate the application, simply add your language to the database (in the table `languages`), and add the language file to in the folder client/i18n/`.  You will see `en.json` and `fr.json` as templates for the initial translation.

 3. **Code** Bugs, features, patches all require code generation or rewrites.  We highly recommend emailing us before trying to make significant code changes so that we may answer any questions and guide you through the process.

#### Step 4: Rinse and Repeat

Thank you!  If you've gotten to this step, you have made a valuable contribution to the bhima codebase.  There is still more work to be done; please recurse to step 3 and repeat!


Other Forms of Contribution
---------------------------

#### Translation

Bhima is an international piece of software.  Our development team operates in both French and English, but would love to round out our supported languages!  If you would like to get involved in translation work, you can either translate documentation
(see the [user manual](https://github.com/Third-Culture-Software/bhima/tree/development/docs/BHIMA%20User%20Guide)) or the application itself.

We use [angular-translate](https://github.com/angular-translate/angular-translate) for all client-side translation.  The files are located in `client/src/i18n/{locale}.json`.  Feel free to translate the key-value pairs and store it in your own langage.



Contributor Tips & Tricks
-------------------------

Some helpful tips for code organization:

 1. Pick a good branch name for clarity.  Below are some examples of good naming schemes.
  - `feature-patient-discharge-form`   implements a new feature for a patient discharge
  - `patch-fiscal-year-transfer`       adds in missing (but intended) functionality transfering budgets between fiscal years
  - `fix-posting-journal-bug-1193`     fixes bug #1193 in the posting ouranl
  - `docs-budget-documentation`        adds in documentation for the budgeting module

 2. Include `fix {#}`, `fixes {#}` in your git commits (where # is a link to an issue).  This links issues to pull requests to track progress.

 3. If you plan to tackle an issue, please comment on the issue indicating you will begin working on it.   This will prevent
our team from doubling up effort on code you are working on.  Also, there are no hard feelings if you try and fail, or begin
and discover that it is grounded in a design decision that cannot be changed immediately.  Give it your best shot!

 4. Check out the [wiki](https://github.com/Third-Culture-Software/bhima/wiki).  We have more tutorials on how to contribute there!  It is kept more up to date than this guide is.
