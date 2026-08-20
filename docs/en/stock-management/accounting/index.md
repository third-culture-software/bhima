&raquo; [Home](../../index.md) / [Inventory & Stock Management](../index.md) / Stock Management & Accounting

# Stock Management & Accounting
Stock management in BHIMA can be a standalone package or with automated accounting features.  The automated
accounting features are enabled in the [Stock Settings](../stock.settings.md#individual-stock-settings) module under
the "Enable Automatic Stock Accounting" setting.  It is on by default.

BHIMA behaves differently depending on the accounting standard being followed.  For completeness, below we'll present
the two accounting strategies and discuss how BHIMA automates each.  We'll present an overview, then the purchasing procedure,
then the consumption of medicines.

## OHADA Stock Accounting

### Overview
In OHADA accounting, purchases are modeled as an expense.  When goods are delivered to the enterprise, the expense is offset
with a credit to bring the sum of the expense back to zero.  Finally, the consumption of medicines decreases the value of goods
in stock and creates an expense for the institution.

These are the families of accounts used in the OHADA examples below:

Number | Label | Type
-- | -- | --
30 | Stock | asset
40 | Supplier | liability
57 | Cash | asset
601 | Purchases of Goods | expense
603 | Variation of Goods | expense

The actual accounts may vary in practice with multiple sub accounts for taxes, shipping and handling, etc, but these accounts
are representative for the examples that follow.

------

### Purchasing Stock on Credit
In this scenario, the organisation purchases $105 of stock on credit from some supplier.  There are three steps
to complete:

1. Record an expense for the medicine purchased
2. Receive the goods in stock
3. Pay the supplier for the goods

The first step is to _record the expense_ for the medicines purchased.  This is done by debiting the expense account
for purchase (601) and crediting the supplier's account.  The transaction is presented below:

Account Label | Number | Debit | Credit
-- | -- | -- | --
Supplier | 40 | | 105
Purchases of Goods | 601 | 105 |

The next two operations can happen in any order.  Suppose that the warehouse receives the goods before the
enterprise pays the supplier for them.  In this case, the stock account (30) is debited for the value of the goods
and the stock variation account (603) is credited for the value of the goods.  The transaction is presented below:

Account Label | Number | Debit | Credit
-- | -- | -- | --
Variation of Goods | 603 | | 105
Stock | 30 | 105 |

The final operation can now be performed: the payment of the supplier for the goods purchased.  This is a direct transaction
between the supplier's account (40) and the cash or bank account (57).

Account Label | Number | Debit | Credit
-- | -- | -- | --
Cash | 57 | | 105
Supplier | 40 | 105 |


### Purchasing with Cash
In this scenario, the organisation purchases $105 of stock directly by paying cash to a shop.  In this case, OHADA does
not require going through a supplier account.  Instead, the value of the medicine is directly expended from the cash account.
The transaction looks like this:

Account  Label | Number | Debit | Credit
-- | -- | -- | --
Cash | 57 | | 105
Purchases of Goods | 601 | 105 |

The only remaining step is to receive the goods in stock.  This is identical to the transaction written when receiving goods
purchased on credit.

Account Label | Number | Debit | Credit
-- | -- | -- | --
Variation of Goods | 603 | | 105
Stock | 30 | 105 |

### After the Purchase
It's important to note the balance of accounts in the OHADA chart of accounts after the purchase operation is completed.  In the more complex case
of purchasing on credit, the balance of each account will be as follows:

Number | Label | Debit | Credit | Balance
-- | -- | -- | -- | --
30 | Stock | $105.00 | | $105.00
40 | Supplier | $105.00 | $105.00 | $0.00
57 | Cash | $0.00 | $105.00 | ($105.00)
601 | Purchases of Goods | $105.00 | | $105.00
603 | Variation of Goods | | $105.00 | ($105.00)
  | | | Total | $0.00

Since the sum of balances is $0.00, the general ledger is balanced.  The profit and loss statement (Compte d'exploitation) will show a net zero expense
to the institution:

Number | Label | Debit | Credit | Balance
-- | -- | -- | -- | --
601 | Purchases of Goods | $105.00 | | $105.00
603 | Variation of Goods | | $105.00 | ($105.00)
  | | | Net | $0.00

Intuitively, this makes sense - the purchase of medicines converts cash assets into physical assets.  Those assets could be converted back to cash without
a loss to the insitution.


### Consumption of Medicines
The consumption of medications under OHADA concerns only two accounts: the stock account (30) and the variation of goods account (603).  To exit stock $25.00 of stock,
the stock account is credited and the variation account is debited.  The transaction is presented below.

Account Label | Number | Debit | Credit
-- | -- | -- | --
Stock | 30 | | 25
Variation of Goods | 603 | 25 |

### Computing the Cost of Goods Sold (COGS)
Under OHADA accounting, the value of the cost of goods sold is not immediately available in the P&L statement like in IFRS accounting.  Instead, the value is
spread out between the 601 and 603 accounts.  To recover the cost of goods sold, there can be no outstanding deliveries, and the 601 and 603 accounts must be summed
to produce the cost of goods sold.  The sum should always be a debitor balance and treated as the cost of goods sold.


## IFRS Stock Accounting

In the IFRS accounting, purchasing medicines is never considered an expense, but the transfer of assets via an accounts payable.  Generally, a supplier issues an invoice
for goods and the enterprise pays the supplier by cash or by bank.  The goods are entered into stock from the supplier's account.  So there are two transactions to consider:
the invoicing for goods by the supplier and the payment for the goods by the enterprise.  Finally, when stock is consumed/destroyed/removed, the value of the stock is written
to a cost of goods sold (COGS) expense account.  This makes computing the cost of goods sold very easy - simply read the value of the COGS account.

Consider the following accounts:

Number | Label | Type
-- | -- | --
30 | Stock | asset
40 | Supplier | liability
57 | Cash | asset
62 | Cost of Goods Sold | expense

### Purchasing Medications
For medicines to be purchased, the payment happens either in advance of receipt of goods, after receiving the goods, or in multiple installments, depending on the contract.  For
simplicity, consider the payment of medications after full delivery.

First, medicines are delivered to the warehouse by a supplier.  This is a direct transaction between the supplier's account (40) and the stock account (30).

Account Label | Number | Debit | Credit
-- | -- | -- | --
Stock | 30 | 250 |
Supplier | 40 | | 250

This creates a creditor balance in the supplier account - a payable for the enterprise.  In order to balance this account out, the enterpise will pay from their cash account (57)
to the supplier (40) for the value of goods received.

Account Label | Number | Debit | Credit
-- | -- | -- | --
Cash | 57 | | 250
Supplier | 40 | 250 |

### Consumption of Medications
For the consumption operation, a single transaction is recorded to remove the value of the assets from the stock account (30) and write an expense to the cost of goods sold
account (62).  Assuming $25.00 of medication was consummed:

Account Label | Number | Debit | Credit
-- | -- | -- | --
Stock | 30 | | $25
Cost of Goods Sold | 62 | $25 |

This completes the stock accounting process with IFRS accounting.
