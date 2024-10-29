BHIMA
=================

BHIMA is a free, open source accounting and hospital information management system
(HIMS) tailored for rural hospitals in the Democratic Republic of the Congo.  We
are an international team based all over the world.

BHIMA is an acronym for _basic hospital information management application_.  It was originally
developed by [IMA World Health](https://imaworldhealth.org/) with funding from the Foreign Commonwealth and Development Office (FCDO).

Project Goals
--------------------

BHIMA provides a flexible and robust accounting and managerial solution
for rural hospitals.  This includes, but is not limited to, income/expense
reporting, budgeting, patient and organisational billing, depreciation,
inventory and pricing, and purchasing.

Additionally, BHIMA bundles reports and optional reporting plugins to aid
hospital administrators, aid organisations, and governmental/non-governmental
agencies access up to date utilization data.  It targets insitutions that must conform
to the [OHADA](https://en.wikipedia.org/wiki/OHADA) reporting standards in western
and central Africa.

Finally, the entire project is designed to scale from a single, low cost device
in a clinic, to a large multi-hundred bed institution with tens of users
accessing the server simultaneously.

Technology
---------------

The client is written in AngularJS and the server is NodeJS.  Session management
is enabled by Redis, and the backend is a MySQL database.

Contributing
---------------
All contributions are welcome!  If you want to get started hacking on BHIMA, the
[developer wiki](https://github.com/Third-Culture-Software/bhima/wiki) contains notes
on our designs and testing infrastructure.  We also have a dedicated documentation
website https://docs.bhi.ma.  If you have any questions or need help getting started,
please [open an issue](https://github.com/Third-Culture-Software/bhima/issues/new) - chances
are you are not the only one!

If you just want to jump into to messing with the software, check out [Getting Up And Running](https://github.com/Third-Culture-Software/bhima/wiki/Getting-Up-and-Running).

If you are new to GitHub, they have an [excellent guide](https://docs.github.com/en/github/getting-started-with-github).

Installation
-------------------
See the [installation guide](https://docs.bhi.ma/en/for-developers/installing-bhima.html).

License
---------------
BHIMA is licensed under GPL-2.0.  [Read the License](./LICENSE).
