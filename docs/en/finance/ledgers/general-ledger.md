# General Ledger

All valid transactions will one day end up in the General Ledger.  It contains all financial transactions made since the installation of the system and powers the reporting capabilities of BHIMA.  The term "General Ledger" refers to all transactions that have been approved and posted from the Journal.  However, BHIMA also contains a module called "General Ledger".  This section describes the General Ledger module.

The General Ledger module is a matrix of every account in the enterprise in rows by every period in a Fiscal Year in columns.  The cells of the matrix contain the balance of the account on the row for the period on the column.  There are two additional columns: the **Opening Balance** column and the **Balance**column.  The opening balance, as the name implies, is the balance at the beginning of the Fiscal Year, while the balance column sums the values of the opening balance and every period.  See the below table for a simplified representation:

| _Header_ | Account Number | Opening Balance | January | February | Balance |
| :---: | :--- | :--- | :--- | :--- | :--- |
| _Body_ | 1001 | $25.00 | $1.13 | $2.27 | $25 |
| _Footer_ | | | | | |

You will notice that each column has a sum in the foot of the column.  _This value should always be 0_.  If the value is not zero, it indicates that there is missing or incoherent information somewhere in the period, likely from an unbalanced transaction.

