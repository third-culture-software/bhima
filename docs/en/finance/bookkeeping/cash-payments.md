# The Cash Window

The cash window is responsible for receiving payments by patients.  Two kinds of payments are supported:

1. **Invoice Payments** are made for goods and services invoiced in the [Patient Invoice](/finance-modules/patient-invoicing.md) module.
2. **Prepayments** are made in anticipation of future goods and services rendered.

Both payment types generate transactions in with a record identifier `CP`.

<div class="bs-callout bs-callout-info">
<h4>No prepayments?</h4>

Not all institutions ask for advances from patients.  Prepayments may be disabled entirely in the [enterprise settings](/enterprise-settings.md) if the institution does not collect prepayments.
</div>

## Configuring the Cash Window

When a user first accesses the Cash Window, they will be asked to choose a cashbox to use.  The cashbox selected will directly determine which cash account is used in the underlying financial transactions.  Two factors determine which cashboxes a user is presented:

1. The cashbox must have been created and configured in the [cashboxes module](#).
2. The user must be granted permission to access the cashbox from the [user management](#) module.

Cashboxes typically correspond to physical locations, and are therefore classified by project.  If the desired cashbox is not in the list, confirm that the above two conditions are met for the user and cashbox.

If a user wishes to change their cashbox, they can do so by clicking **Menu &gt; Change Cashbox**.  This will bring up the cashbox selection modal.

## Creating a Cash Payment

A cash payment requires the following fields:

1. **Patient** - all cash payments are made by patients  The patient directly sets the debtor account in the underlying transaction via the patient's debtor group.
2. **Date**
3. **Currency **- the currency sets the the underlying cash account.  Cash windows that accept multiple currencies must put each currency value in the correct currency account.  The currency field manages this automatically for the cashier.
4. **Type** - toggles the choice between a prepayment and an invoice payment.  See the distinction below.
5. **Notes** - any further information to be included on the invoice.
6. **Amount** - the amount paid by the patient.

<div class="bs-callout bs-callout-warning">
<h4>Limiting payments by Debtor Group</h4>
Only cash paying clients should be permitted to make payments at the cash window.  To prevent accidentally receiving cash from a client that should not pay at the cash window, be sure to change the "accept cash payments" setting on their Debtor Group!
</div>

### Invoice Payments

The most common payment is against one or more invoices.  To create this payment, the cashier will need to choose the _invoice payment_** **type.  Upon doing so, a button will appear with the text "Select Invoices".  Clicking this button will bring up the invoice selection modal.

Patients can only pay for invoices made against their personal account.  If a patient has not been selected in the **patient** input, an error message will appear instructing the user to fill out that field prior to selecting invoices.  If a patient has been selected, a list of zero or more unbalanced invoices will appear.  If the patient has not been invoiced, or if the patient has paid all their invoices in full, their invoice list will be empty.  If there are one or more unbalanced invoices, these will be listed.  Selecting one or more of these invoices will queue them up for payment.

A patient is allowed to pay up to the total amount of all invoices billed.  Partial payments will be allocated against each invoice from oldest to newest until the payment has been consumed.  Despite paying multiple invoices, an invoice payment will always generate a single transaction containing a single line moving the total payment into the cashbox's account and one line for each invoice paid.  An example transaction for a payment against two invoices \(`IV.TPA.1` and `IV.TPA.2`\) might appear like this:

| Transaction | Record | **Account** | Debit | Credit | Entity | Reference |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TRANS1 | CP.TPA.1 | 570001 | $10.00 |  |  |  |
| TRANS1 | CP.TPA.1 | 410001 |  | $4.50 | PA.HEV.1 | IV.TPA.1 |
| TRANS1 | CP.TPA.1 | 410001 |  | $5.50 | PA.HEV.1 | IV.TPA.2 |
|  |  |  | **$10.00** | **$10.00** |  | - |

In the above transaction, the cash account \(570001\) is **debited $10.00**, indicating that the patient paid money into this account.  The patient's account \(410001\) is **credited for each invoice paid**.  References to the invoices are attached to the transaction on their corresponding line.

### Prepayments

Some institutions accept _prepayments_.  These payment are made without reference to an invoice, in anticipation of future invoices made against the patient.

As compared to _invoice payments_, creating a prepayment is simple.  The user must select the prepayment option and enter the amount received into the cash payment form.  The underlying transaction generated will contain two lines: one that debits the cash box and a second that credits the patient's account.

Importantly, if a prepayment exists on a patient's account during invoicing, a secondary transaction will be generated which allocates part or all of the prepayment amount to the invoice.  If the amount exceeds the invoice, then a remainder will exist on the prepayment and it may be used again.  If multiple prepayments exist, they may be combined to pay the total of the invoice as needed.  Notably, these transactions are made against *a single account*.  They serve not to move balances between accounts, but to track the allocation of the patient's funds from a credit with the institution to payment for the invoices.  

As an example, suppose that patient PA.HEV.1 has made two prepayments: the first for $5 USD (CP.TPA.2) and the second for $13 USD (CP.TPA.3).  Subsequently, an invoice is made for $20 USD (IV.TPA.3).  The following transaction will be made as a Journal Voucher immediately following the invoice:


| Transaction | Record | **Account** | Debit | Credit | Entity | Reference |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TRANS2 | VO.TPA.1 | 410001 |        | $18.00 | PA.HEV.1 | IV.TPA.3 | 
| TRANS2 | VO.TPA.1 | 410001 |  $5.00 |        | PA.HEV.1 | CP.TPA.2 |
| TRANS2 | VO.TPA.1 | 410001 |  $13.0 |        | PA.HEV.1 | CP.TPA.3 |

After this transaction, the patient will have an outstanding balance of $2 USD on their invoice for the remaining amount.

