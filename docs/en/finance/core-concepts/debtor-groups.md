# Debtor Groups

<div class="bs-callout bs-callout-success">
  <p><b>Debtors</b> are individuals or organisations that can procure goods and services from the medical institution and are invoiced as a result.  The vast majority of debtors will be patients, though other kinds of clients may also be modeled as debtors in certain contexts.</p>
</div>

All debtors in BHIMA are organized into Debtor Groups.  Debtor Groups determine the accounts and billing structure for individual debtors.

## Required Information

Because debtor groups are principally a financial concept, BHIMA requires certain financial information to create one.  This includes:

1. **Name** - the name of the group that will show up in labels and dropdown menus throughout the application.
2. **Locked** - locks the group to prevent patient assignment and further invoicing of group members.
3. **Account** - the account used in transactions involving a member of the debtor group.
4. **Price List** - a price list to apply to the debtor group.
5. **Max Credit** - prevents members of the debtor group from being invoiced if the debt of the group goes beyond this limit.  _Not implemented yet_ ([#5068](https://github.com/IMA-WorldHealth/bhima/issues/5068)).

Optional information includes:

1. **Notes** - a text field for user notes
2. **Phone** - a field with phone contact information for representatives of the debtor group.
3. **Email** - a field with email contact information for representatives of the group.
4. **Location** - a series of selects to specify where the group is located.
5. **Color** - a color to associate with the group for easy recognition.  This shows up on the patient dropdown to indicate to which group they belong.

## Conventions and Health Maintenance Organisations 

A "convention" is a collective of individuals who are under contract with the medical institution to pay for care of individual members.  It is analogous to a health management organisation (HMO).  Instead of invoicing individual members of the group, the institution will invoice the group for medical care provided to any member of the group.

In BHIMA, conventions are non-cash clients.  This means BHIMA will _block payments at the cash window_ for patients that are in a convention, to prevent double-payment.  Instead, conventions are expected to pay periodically in bulk for their members using [journal vouchers](../bookkeeping/vouchers.md).  Using journal vouchers allows much finer-grained control over payments made by the organisation. 

## Group Policies

Hospitals often charge patients associated with organizations or health maintenance organisations (HMOs) full price to subsidize care for patients who cannot afford to pay. Conversely, some debtor groups may have agreements with the hospital to waive administrative fees.

To manage these scenarios, BHIMA provides administrators with a "group policies" feature. This feature allows administrators to configure exemptions for specific groups, overriding standard rules for subsidies, discounts, or administrative fees that would otherwise apply to individual group members.  

## Subscriptions

Debtor Groups can be assigned specific fees or subsidies. For example, clients who consistently pay via mobile money platforms (e.g., M-Pesa) may incur a processing fee for each invoice. Similarly, church members might receive a subsidy sponsored by a religious organization.

The "Subscriptions" section in the debtor group management module allows administrators to configure group-specific fees and subsidies. The available subscription types include:

  1. **Invoicing Fees**: Adds a percentage increase to the total invoice amount. Multiple invoicing fees are sequentially to the base price, not compounding upon each other.
  2. **Subsidies**: Reduces the total invoice amount by a percentage. Like invoicing fees, multiple subsidies are applied sequentially to the base price, not compounding upon each other.

For more information on invoicing, see the [../bookkeeping/patient-invoices.md](Patient Invoices) documentation.
