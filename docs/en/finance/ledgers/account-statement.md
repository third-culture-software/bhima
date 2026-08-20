# Account Statement Module

The Account Statement module provides a detailed view of transactions in the [General Ledger](/general-ledger.md) for a particular account.  It is identical to the Account Statement Report \(found under Reports &gt; Account Statement Report\).  Since the information comes for the General Ledger, it must be have already been posted from the Journal.

The module is divided into sections: the filter bar, the grid, and the footer.

#### Filter Bar

The module requires the standard[default filters](/grid-features.md)of limit and period.  Additionally, you must provide a default account.  This allows the module to assume an account is always set and display opening balances and movements throughout the period in a meaningful way.

#### Grid

The heart of the module is a grid supporting many of the [grid features](/grid-features.md) found in BHIMA.  This view differs from the Journal by limiting the records to only a single account.  Typically, the view will show a single side of a transaction.  To show the other side of the transaction, you can follow the links in the **Transaction ID** column to view the transaction in the [Journal](/journal-module.md).

