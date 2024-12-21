/*
  This file contains all the stored procedures used in bhima's database.  It
  should be loaded after functions.sql.
*/

DELIMITER $$

/*

--------
OVERVIEW
--------

This section contains all the procedures related to paying cash payments.
Please be sure to read the SCENARIOS section in detail to understand the
multiple scenarios that can occur and how the application handles them. They
should clarify the "why" questions while the code itself documents "how".

---------
SCENARIOS
---------

For all the following scenarios, please consider a world with two currencies A
and B.  The enterprise supports both currencies A and B. A's minimum monetary
unit is 50, and B's minimum monetary unit is .25.  The enterprise's base
currency is A.  Amounts expressed in "A" will be written 100.00A, and amounts
express in "B" will be written 100.00B.


PREPAYMENTS (SINGLE CURRENCY)
-----------------------------
The application allows for debtors to pre-pay into a cashbox, called a caution
payment.  Often, patients will need to provide some sort of guarantee or down
payment before an expensive operation will be performed.  In this case, the
money goes directly into the cashbox as a credit to the patient's account.

Consider the following scenario:

A debtor would like an expensive operation performed.  To prove the debtor has
the required capital, the enterprise requires a down payment of 500A.  The
debtor goes to the cash window to deposit their 500A.

The following two lines will be written in a transaction:
 1. A 500A debit against the cashbox (putting money into it).
 2. A 500A credit to the debtor (increasing their account w/ the enterprise)


PREPAYMENTS (MULTI-CURRENCY)
----------------------------
Consider the following scenario:

Suppose the exchange rate is 1000A to 1B.

The debtor would like an expensive operation performed.  The enterprise requires
that the debtor pay 10000A as a down payment.  The debtor chooses to pay in
currency B at the cash window.  They will pay (10000A * (1B / 1000A)) = 10B.

The debtor provides 10B as payment.  The application will record the following:
 1. A 10000A debit against the cashbox (representing 10B put into it)
 2. A 10000A credit for the debtor.

In the metadata of the transaction, it is recorded that the debtor actually paid
in B a value of 10B.  However, from the enterprise's perspective, they paid the
equivalent in currency A.

PAYING A SINGLE INVOICE
-----------------------
Consider the following scenario:

A debtor is invoiced for a product 750A, with an exchange rate of 1000A to 1B.
If they choose to pay the invoice that day in currency B, they will be required
to pay 0.75B.

They go to the window to pay in currency B.  They pay 0.75B.  The following
transaction is recorded:
 1. A 750A debit against the cashbox account
 2. A 750 credit against the debtor and their invoice.

As above, the fact they paid with currency B is recorded as metadata.


PAYING A SINGLE INVOICE (WITH LAG)
----------------------------------
Consider the following scenario:

A debtor is invoiced for a product 750A, with an exchange rate of 1000A to 1B.
If they choose to pay the invoice that day in currency B, they will be required
to pay .75B.

However, they instead return on a later date, when the exchange rate has jumped
to 1100A to 1B.  Now, if they choose to pay the invoice on that day, they will
be required to pay (750A * (1B / 1100A)) = 0.68B.  This is not a value they can
produce with a minimum monetary unit of 0.25B.

We can round down to 0.50B (a loss to the enterprise of 0.19B) or round up to
0.75B (a gain to the enterprise of 0.7B).  Since rounding up is the smallest
difference (put another way: the closest to the real price), the system will
round up.

The debtor pays into the system 0.75B, but their invoice was only for 0.68B.
The system will write a single transaction that balances the debtor's invoice
and puts the extra 0.7B in a gain account.  This gain account is defined in the
enterprise table's `gain_account_id`.  The resulting transaction will consist of
three lines:
 1. A debit of 0.75B against the cashbox account.
 2. A credit of 0.68B to the debtor for their invoice.
 3. A credit of 0.7B against the gain account.

NOTE: the values above are expressed in currency B for simplicity.  Since the
enterprise is run in currency A, all those values will be converted into
currency A with the exchange rate on the day it was paid.  In this case, 1100A
to 1B.


PAYING MULTIPLE INVOICES (WITH LAG)
-----------------------------------
The above scenario is a reasonable simple case:  The debtor is paying a single
invoice.  However, the scenario is made more complicated if they choose to pay
multiple invoices.

Suppose that our debtor is paying two invoices, for 750A and 450A.  The exchange
rate is still 1100A to 1B.  We calculate their total debt to be:
(750A + 450A) * (1B/1100A) = 1.09B

Each invoice would be:
750A * (1B/1100A) = 0.681B
450A * (1B/1100A) = 0.409B

Since we can only pay B in increments of 0.25, we can round down to 1B or up to
1.25B.  The application will choose 1B, as it is the closest to the sum of the
two invoices, resulting in a loss of 0.09B (99A) to the enterprise.

It is important to realize that, though the debtor is paying 0.09B less than the
total value of their invoice, they are paying their bill in full.  They should
not have a debt remaining with the enterprise after this transaction. Therefore,
our algorithm will need to produce 0.09B from somewhere to complete the value of
both invoices the debtor is paying.  We take the 0.09B from the enterprise's
loss account, found in the enterprise table, in the column loss_account_id.

The debtor pays 1B, even though the total of their invoices was 1.09B.  The
application will write a single transaction that consists of 4 lines:
 1. A debit of 1B against the cashbox account.
 2. A credit of 0.681B against the first invoice of the debtor
 3. A credit of 0.409B against the second invoice of the debtor
 4. A debit of 0.09B against the loss account.

At the end of this procedure, the debtor will have equalized all their debts,
and the loss account will have made up the difference to ensure that every
invoice was correctly balanced.
*/


/*
CALL PostCash()

DESCRIPTION
This procedure is called after values are already written to the cash table.  It
is responsible for checking if a cash payment is a prepayment (caution) and
writing the transaction lines.  It also contains the algorithm for cycling
through all the invoices, crediting each one the appropriate amount and writing
the remaining balance to the gain or loss account.
*/
DROP PROCEDURE IF EXISTS PostCash$$
CREATE PROCEDURE PostCash(
  IN cashUuid binary(16)
)
BEGIN
  -- required posting values
  DECLARE cashDate DATETIME;
  DECLARE cashEnterpriseId SMALLINT(5);
  DECLARE cashCurrencyId TINYINT(3) UNSIGNED;
  DECLARE cashAmount DECIMAL(19,4);
  DECLARE enterpriseCurrencyId INT;
  DECLARE isCaution BOOLEAN;

  -- variables to store core set-up results
  DECLARE cashProjectId SMALLINT(5);
  DECLARE currentFiscalYearId MEDIUMINT(8) UNSIGNED;
  DECLARE currentPeriodId MEDIUMINT(8) UNSIGNED;
  DECLARE currentExchangeRate DECIMAL(19, 8);
  DECLARE transactionId VARCHAR(100);

  -- variables to be set from the enterprise settings
  DECLARE gain_account_id INT UNSIGNED;
  DECLARE loss_account_id INT UNSIGNED;

  DECLARE minMonentaryUnit DECIMAL(19,4);
  DECLARE previousInvoiceBalances DECIMAL(19,4);

  DECLARE remainder DECIMAL(19,4);
  DECLARE lastInvoiceUuid BINARY(16);

  DECLARE cashPaymentOriginId SMALLINT(5);
  DECLARE transIdNumberPart INT;

  -- set origin to the CASH_PAYMENT transaction type
  SET cashPaymentOriginId = 2;

  -- copy cash payment values into working variables
  SELECT cash.amount, cash.date, cash.currency_id, enterprise.id, cash.project_id, enterprise.currency_id, cash.is_caution
    INTO  cashAmount, cashDate, cashCurrencyId, cashEnterpriseId, cashProjectId, enterpriseCurrencyId, isCaution
  FROM cash
    JOIN project ON cash.project_id = project.id
    JOIN enterprise ON project.enterprise_id = enterprise.id
  WHERE cash.uuid = cashUuid;

  -- populate core setup values
  CALL PostingSetupUtil(cashDate, cashEnterpriseId, cashProjectId, cashCurrencyId, currentFiscalYearId, currentPeriodId, currentExchangeRate, enterpriseCurrencyId, transactionId, gain_account_id, loss_account_id);

  -- get the current exchange rate
  SET currentExchangeRate = GetExchangeRate(cashEnterpriseId, cashCurrencyId, cashDate);
  SET currentExchangeRate = (SELECT IF(cashCurrencyId = enterpriseCurrencyId, 1, currentExchangeRate));

  SET transIdNumberPart = GetTransactionNumberPart(transactionId, cashProjectId);

  /*
    Begin the posting process.  We will first write the total value as moving into the cashbox
    (a debit to the cashbox's cash account).  Then, we will loop through each cash_item and credit
    the debtor for the amount they paid towards each invoice.

    NOTE
    In this section we divide by exchange rate (like x * (1/exchangeRate)) because we are converting
    from a non-native currency into the native enterprise currency.
  */

  -- write the cash amount going into the cashbox to the posting_journal
  INSERT INTO posting_journal (
    uuid, project_id, fiscal_year_id, period_id, trans_id, trans_id_reference_number, trans_date,
    record_uuid, description, account_id, debit, credit, debit_equiv,
    credit_equiv, currency_id, user_id, transaction_type_id
  ) SELECT
    HUID(UUID()), cashProjectId, currentFiscalYearId, currentPeriodId, transactionId, transIdNumberPart, c.date, c.uuid, c.description,
    cb.account_id, c.amount, 0, (c.amount * (1 / currentExchangeRate)), 0, c.currency_id, c.user_id, cashPaymentOriginId
  FROM cash AS c
    JOIN cash_box_account_currency AS cb ON cb.currency_id = c.currency_id AND cb.cash_box_id = c.cashbox_id
  WHERE c.uuid = cashUuid;

  /*
    If this is a caution payment, all we need to do is convert and write a single
    line to the posting_journal.
  */
  IF isCaution THEN

    INSERT INTO posting_journal (
      uuid, project_id, fiscal_year_id, period_id, trans_id, trans_id_reference_number, trans_date,
      record_uuid, description, account_id, debit, credit, debit_equiv,
      credit_equiv, currency_id, entity_uuid, user_id, transaction_type_id
    ) SELECT
      HUID(UUID()), cashProjectId, currentFiscalYearId, currentPeriodId, transactionId, transIdNumberPart, c.date, c.uuid,
      c.description, dg.account_id, 0, c.amount, 0, (c.amount * (1 / currentExchangeRate)), c.currency_id,
      c.debtor_uuid, c.user_id, cashPaymentOriginId
    FROM cash AS c
      JOIN debtor AS d ON c.debtor_uuid = d.uuid
      JOIN debtor_group AS dg ON d.group_uuid = dg.uuid
    WHERE c.uuid = cashUuid;

  /*
    In this block, we are paying cash items.  We have to look through each cash item, recording the
    amount paid as a new line in the posting_journal.  The `reference_uuid` is assigned to the
    `invoice_uuid` of the cash_item table.
  */
  ELSE

    -- make sure the temporary tables exist for invoice balances
    CALL VerifyCashTemporaryTables();

    -- write each cash_item into the posting_journal
    INSERT INTO posting_journal (
      uuid, project_id, fiscal_year_id, period_id, trans_id, trans_id_reference_number, trans_date,
      record_uuid, description, account_id, debit, credit, debit_equiv,
      credit_equiv, currency_id, entity_uuid, user_id, reference_uuid, transaction_type_id
    ) SELECT
      HUID(UUID()), cashProjectId, currentFiscalYearId, currentPeriodId, transactionId, transIdNumberPart, c.date, c.uuid,
      c.description, dg.account_id, 0, ci.amount, 0, (ci.amount * (1 / currentExchangeRate)), c.currency_id,
      c.debtor_uuid, c.user_id, ci.invoice_uuid, cashPaymentOriginId
    FROM cash AS c
      JOIN cash_item AS ci ON c.uuid = ci.cash_uuid
      JOIN debtor AS d ON c.debtor_uuid = d.uuid
      JOIN debtor_group AS dg ON d.group_uuid = dg.uuid
    WHERE c.uuid = cashUuid;

    /*
      Finally, we have to see if there is any rounding to do.  If the absolute value of the balance
      due minus the balance paid is less than the minMonentaryUnit, it means we should just round that
      amount away.

      If (cashAmount - previousInvoiceBalances) > 0 then the debtor overpaid and we should debit them and
      credit the rounding account.  If the (cashAmount - previousInvoiceBalances) is negative, then the debtor
      underpaid and we should credit them and debit the rounding account the remainder
    */

    /* These values are in the original currency amount */
    SET previousInvoiceBalances = (
      SELECT SUM(invoice.balance) AS balance FROM stage_cash_invoice_balances AS invoice
    );

    -- this is date ASC to get the most recent invoice
    SET lastInvoiceUuid = (
      SELECT invoice.uuid FROM stage_cash_invoice_balances AS invoice ORDER BY invoice.date LIMIT 1
    );

    SET minMonentaryUnit = (
      SELECT currency.min_monentary_unit FROM currency WHERE currency.id = cashCurrencyId
    );

    SET remainder = cashAmount - previousInvoiceBalances;

    -- check if we should round or not
    -- if the remainder is 0 the invoice is payed without need for rounding
    IF (minMonentaryUnit > ABS(remainder) && remainder <> 0) THEN

      /*
        A positive remainder means that the debtor overpaid slightly and we should debit
        the difference to the debtor and credit the difference as a gain to the gain_account

        - The debtor entity an invoice reference are not included on the gain
          account transaction. In this case the debtor covered MORE than the
          invoiced amount and so referencing them on the enterprise gain will
          actually debit them the additional amount.
      */
      IF (remainder > 0) THEN

        -- The debtor is not debited in this transaction. They have already
        -- balanced the invoice and their debt according to the invoice (the
        -- exact amount). The additional payment can just be put in a gain account.

        -- credit the rounding account
        INSERT INTO posting_journal (
          uuid, project_id, fiscal_year_id, period_id, trans_id, trans_id_reference_number, trans_date,
          record_uuid, description, account_id, debit, credit, debit_equiv,
          credit_equiv, currency_id, user_id, transaction_type_id
        ) SELECT
          HUID(UUID()), cashProjectId, currentFiscalYearId, currentPeriodId, transactionId, transIdNumberPart, c.date, c.uuid, c.description,
          gain_account_id, 0, remainder, 0, (remainder * (1 / currentExchangeRate)), c.currency_id, c.user_id, cashPaymentOriginId
        FROM cash AS c
          JOIN debtor AS d ON c.debtor_uuid = d.uuid
          JOIN debtor_group AS dg ON d.group_uuid = dg.uuid
        WHERE c.uuid = cashUuid;

      /*
        A negative remainder means that the debtor underpaid slightly and we should credit
        the difference to the debtor and debit the difference as a loss to the loss_account

        - The debtor and invoice are referenced on the loss account transaction
          make up for the amount that is loss. In this case the debtor has not
          actually paid enough money to cover the amount of the invoice. If this
          is not referenced his balance will not be zero.
      */
      ELSE

        -- convert the remainder into the enterprise currency
        SET remainder = (-1 * remainder);

        -- credit the debtor
        INSERT INTO posting_journal (
          uuid, project_id, fiscal_year_id, period_id, trans_id, trans_id_reference_number, trans_date,
          record_uuid, description, account_id, debit, credit, debit_equiv,
          credit_equiv, currency_id, entity_uuid, user_id, reference_uuid, transaction_type_id
        ) SELECT
          HUID(UUID()), cashProjectId, currentFiscalYearId, currentPeriodId, transactionId, transIdNumberPart, c.date, c.uuid, c.description,
          dg.account_id, 0, remainder, 0, (remainder * (1 / currentExchangeRate)), c.currency_id,
          c.debtor_uuid, c.user_id, lastInvoiceUuid, cashPaymentOriginId
        FROM cash AS c
          JOIN debtor AS d ON c.debtor_uuid = d.uuid
          JOIN debtor_group AS dg ON d.group_uuid = dg.uuid
        WHERE c.uuid = cashUuid;

        -- debit the rounding account
        INSERT INTO posting_journal (
          uuid, project_id, fiscal_year_id, period_id, trans_id, trans_id_reference_number, trans_date,
          record_uuid, description, account_id, debit, credit, debit_equiv,
          credit_equiv, currency_id, user_id, transaction_type_id
        ) SELECT
          HUID(UUID()), cashProjectId, currentFiscalYearId, currentPeriodId, transactionId, transIdNumberPart, c.date, c.uuid, c.description,
          loss_account_id, remainder, 0, (remainder * (1 / currentExchangeRate)), 0, c.currency_id, c.user_id, cashPaymentOriginId
        FROM cash AS c
          JOIN debtor AS d ON c.debtor_uuid = d.uuid
          JOIN debtor_group AS dg ON d.group_uuid = dg.uuid
        WHERE c.uuid = cashUuid;
      END IF;
    END IF;
  END IF;
END $$


/*
StageCash()

DESCRIPTION
This procedure exists solely to transfer data between JS and SQL. Since JS is
dynamically typed, but SQL is static, we have to define the order and types of
each variable below.  It is called at the beginning of the posting process.
*/
DROP PROCEDURE IF EXISTS StageCash$$
CREATE PROCEDURE StageCash(
  IN amount DECIMAL(19,4) UNSIGNED,
  IN currency_id TINYINT(3),
  IN cashbox_id MEDIUMINT(8) UNSIGNED,
  IN debtor_uuid BINARY(16),
  IN project_id SMALLINT(5) UNSIGNED,
  IN date TIMESTAMP,
  IN user_id SMALLINT(5) UNSIGNED,
  IN is_caution BOOLEAN,
  IN description TEXT,
  IN uuid BINARY(16)
)
BEGIN
  -- verify if cash stage already exists within this connection, if the
  -- stage already exists simply write to it, otherwise create it select into it
  DECLARE `no_cash_stage` TINYINT(1) DEFAULT 0;
  DECLARE CONTINUE HANDLER FOR SQLSTATE '42S02' SET `no_cash_stage` = 1;
  SELECT NULL FROM stage_cash LIMIT 0;


  IF (`no_cash_stage` = 1) THEN
    CREATE TEMPORARY TABLE stage_cash
      (SELECT uuid, project_id, date, debtor_uuid, currency_id, amount, user_id, cashbox_id, description, is_caution);

  ELSE
    INSERT INTO stage_cash
      (SELECT uuid, project_id, date, debtor_uuid, currency_id, amount, user_id, cashbox_id, description, is_caution);
  END IF;
END $$


/*
StageCashItem()

DESCRIPTION
This procedure exists solely to transfer data between JS and SQL. Since JS is
dynamically typed, but SQL is static, we have to define the order and types of
each variable below.  Like StageCash() it is called for each cash_item at the
beginning of the posting process, after StageCash().
*/
DROP PROCEDURE IF EXISTS StageCashItem$$
CREATE PROCEDURE StageCashItem(
  IN uuid BINARY(16),
  IN cash_uuid BINARY(16),
  IN invoice_uuid BINARY(16)
)
BEGIN
  -- verify if cash_item stage already exists within this connection, if the
  -- stage already exists simply write to it, otherwise create it select into it
  DECLARE `no_cash_item_stage` TINYINT(1) DEFAULT 0;
  DECLARE CONTINUE HANDLER FOR SQLSTATE '42S02' SET `no_cash_item_stage` = 1;
  SELECT NULL FROM `stage_cash_item` LIMIT 0;

  IF (`no_cash_item_stage` = 1) THEN
    CREATE TEMPORARY TABLE stage_cash_item
      (INDEX invoice_uuid (invoice_uuid))
      SELECT uuid, cash_uuid, invoice_uuid;

  ELSE
    INSERT INTO stage_cash_item (SELECT uuid, cash_uuid, invoice_uuid);
  END IF;
END $$


/*
VerifyCashTemporaryTables()

DESCRIPTION
This procedure creates the temporary tables for cash payments in case they do
not exist.  It is used internally to avoid errors about tables not existing or
strange JOINs against nonexistent tables.
*/
DROP PROCEDURE IF EXISTS VerifyCashTemporaryTables$$
CREATE PROCEDURE VerifyCashTemporaryTables()
BEGIN
  CREATE TEMPORARY TABLE IF NOT EXISTS stage_cash_records (
    uuid BINARY(16), debit DECIMAL(19,4), credit DECIMAL(19,4), entity_uuid BINARY(16), date TIMESTAMP,
    INDEX uuid (uuid),
    INDEX entity_uuid (entity_uuid)
  );

  CREATE TEMPORARY TABLE IF NOT EXISTS stage_cash_references (
    uuid BINARY(16), debit DECIMAL(19,4), credit DECIMAL(19,4), entity_uuid BINARY(16), date TIMESTAMP,
    INDEX uuid (uuid),
    INDEX entity_uuid (entity_uuid)
  );

  CREATE TEMPORARY TABLE IF NOT EXISTS stage_cash_invoice_balances (
    uuid BINARY(16), balance DECIMAL(19, 4), date TIMESTAMP,
    INDEX uuid (uuid)
  );
END $$

/*
CalculateCashInvoiceBalances()

DESCRIPTION
Gathers all invoices that the cash payment is attempting to pay and computes
their current balances.  This ensures that all the cash payments will be able
to correctly allocate the total payment to each invoice.
*/
DROP PROCEDURE IF EXISTS CalculateCashInvoiceBalances$$
CREATE PROCEDURE CalculateCashInvoiceBalances(
  IN cashUuid BINARY(16)
)
BEGIN
  DECLARE cashDate DATETIME;
  DECLARE cashCurrencyId INT;
  DECLARE cashEnterpriseId INT;
  DECLARE cashDebtorUuid BINARY(16);
  DECLARE enterpriseCurrencyId INT;
  DECLARE currentExchangeRate DECIMAL(19,4);

  -- copy cash payment values into working variables
  SELECT cash.date, cash.currency_id, enterprise.id, enterprise.currency_id, cash.debtor_uuid
    INTO cashDate, cashCurrencyId, cashEnterpriseId, enterpriseCurrencyId, cashDebtorUuid
  FROM stage_cash AS cash
    JOIN project ON cash.project_id = project.id
    JOIN enterprise ON project.enterprise_id = enterprise.id
  WHERE cash.uuid = cashUuid;

  /* calculate the exchange rate for balances based on the stored cash currency */
  SET currentExchangeRate = GetExchangeRate(cashEnterpriseId, cashCurrencyId, cashDate);
  SET currentExchangeRate = (SELECT IF(cashCurrencyId = enterpriseCurrencyId, 1, currentExchangeRate));

  CALL VerifyCashTemporaryTables();

  INSERT INTO stage_cash_records
    SELECT p.record_uuid AS uuid, p.debit_equiv as debit, p.credit_equiv as credit, p.entity_uuid, p.trans_date as date
    FROM posting_journal AS p
    JOIN stage_cash_item AS ci ON
      ci.invoice_uuid = p.record_uuid
    WHERE ci.cash_uuid = cashUuid
    AND p.entity_uuid = cashDebtorUuid;

  INSERT INTO stage_cash_records
    SELECT g.record_uuid AS uuid, g.debit_equiv as debit, g.credit_equiv as credit, g.entity_uuid, g.trans_date as date
    FROM general_ledger AS g
    JOIN stage_cash_item AS ci ON
      ci.invoice_uuid = g.record_uuid
    WHERE ci.cash_uuid = cashUuid
    AND g.entity_uuid = cashDebtorUuid;

  INSERT INTO stage_cash_references
    SELECT p.reference_uuid AS uuid, p.debit_equiv as debit, p.credit_equiv as credit, p.entity_uuid, p.trans_date as date
    FROM posting_journal AS p
    JOIN stage_cash_item AS ci ON
      ci.invoice_uuid = p.reference_uuid
    WHERE ci.cash_uuid = cashUuid
    AND p.entity_uuid = cashDebtorUuid;

  INSERT INTO stage_cash_references
    SELECT g.reference_uuid AS uuid, g.debit_equiv as debit, g.credit_equiv as credit, g.entity_uuid, g.trans_date as date
    FROM general_ledger AS g
    JOIN stage_cash_item AS ci ON
      ci.invoice_uuid = g.reference_uuid
    WHERE ci.cash_uuid = cashUuid
    AND g.entity_uuid = cashDebtorUuid;

  INSERT INTO stage_cash_invoice_balances
    SELECT zz.uuid, zz.balance, zz.date
    FROM (
      SELECT ledger.uuid, (SUM(ledger.debit - ledger.credit) * currentExchangeRate) AS balance, MIN(ledger.date) AS date
      FROM (
        SELECT crec.uuid, crec.debit, crec.credit, crec.entity_uuid, crec.date FROM stage_cash_records AS crec
      UNION ALL
        SELECT cref.uuid, cref.debit, cref.credit, cref.entity_uuid, cref.date FROM stage_cash_references AS cref
      ) AS ledger
      GROUP BY ledger.uuid
    ) AS zz ORDER BY zz.date;
END $$

/*
WriteCashItems()

DESCRIPTION
Loops through all the cash payments, writing them to disk in the cash_items
table.  In order to determine what value to assign each invoice, the
CalculateCashInvoiceBalances() procedures should be called before this method to
ensure that the current balances of previous invoices are known.  Only once the
up to date balances are known can allocation be performed and payments assigned
to each invoice.

NOTE
This procedure also blocks a debtor from overpaying an invoice.  An overpayment
is defined as having a value greater than the sum of all invoices they are
attempting to pay, plus the min currency monetary unit.  Put another way, the
difference between the payment amount and the total cost of all invoices should
not be greater than the min monetary unit.
*/
DROP PROCEDURE IF EXISTS WriteCashItems$$
CREATE PROCEDURE WriteCashItems(
  IN cashUuid BINARY(16)
)
BEGIN

  DECLARE cashAmount DECIMAL(19, 4);
  DECLARE minMonentaryUnit DECIMAL(19,4);

  DECLARE totalInvoiceCost DECIMAL(19,4);
  DECLARE amountToAllocate DECIMAL(19,4);
  DECLARE allocationAmount DECIMAL(19,4);
  DECLARE invoiceUuid BINARY(16);
  DECLARE invoiceBalance DECIMAL(19,4);
  DECLARE done INT DEFAULT FALSE;

  -- error condition states
  DECLARE Overpaid CONDITION FOR SQLSTATE '45501';

  -- CURSOR for allocation of payments to invoice costs.
  DECLARE curse CURSOR FOR SELECT invoice.uuid, invoice.balance FROM stage_cash_invoice_balances AS invoice;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  -- set local variables
  SELECT cash.amount, currency.min_monentary_unit
    INTO cashAmount, minMonentaryUnit
  FROM cash JOIN currency ON currency.id = cash.currency_id
  WHERE cash.uuid = cashUuid;

  /*
    Calculate the balances on invoices to pay.
    NOTE: this assumes that CalculateCashInvoiceBalances(cashUuid) has been called before this procedure
  */
  SET totalInvoiceCost = (SELECT IFNULL(SUM(invoice.balance), 0) FROM stage_cash_invoice_balances AS invoice);

  /*
    If the difference between the paid amount and the totalInvoiceCost is greater than the
    minMonentaryUnit, the client has overpaid.
  */
  IF ((cashAmount - totalInvoiceCost)  > minMonentaryUnit) THEN
    SET @text = CONCAT(
      'The invoices appear to be overpaid.  The total cost of all invoices are ',
      CAST(totalInvoiceCost AS char), ' but the cash payment amount is ', CAST(cashAmount AS char)
    );

    SIGNAL Overpaid SET MESSAGE_TEXT = @text;
  END IF;

  /*
   NOTE
   It is possible to underpay.  This is never checked - the loop will
   simply exit early and the other invoices will not be credited.

   Loop through the table of invoice balances, allocating money from the total
    payment to balance those invoices.
  */
  SET amountToAllocate = cashAmount;

  OPEN curse;

  allocateCashPayments: LOOP
    FETCH curse INTO invoiceUuid, invoiceBalance;

    IF done THEN
      LEAVE allocateCashPayments;
    END IF;

    -- figure out how much to allocate
    IF (amountToAllocate - invoiceBalance > 0) THEN
      SET amountToAllocate = amountToAllocate - invoiceBalance;
      SET allocationAmount = invoiceBalance;
    ELSE
      SET allocationAmount = amountToAllocate;
      SET amountToAllocate = 0;
      SET done = TRUE;
    END IF;

    INSERT INTO cash_item
      SELECT stage_cash_item.uuid, stage_cash_item.cash_uuid, allocationAmount, invoiceUuid
      FROM stage_cash_item
      WHERE stage_cash_item.invoice_uuid = invoiceUuid AND stage_cash_item.cash_uuid = cashUuid LIMIT 1;

  END LOOP allocateCashPayments;
END $$


/*
WriteCash()

DESCRIPTION
This procedure simply copies the cash values out of the staging tables and
writes them to the cash table.
*/
DROP PROCEDURE IF EXISTS WriteCash$$
CREATE PROCEDURE WriteCash(
  IN cashUuid BINARY(16)
)
BEGIN
  -- cash details
  INSERT INTO cash (uuid, project_id, date, debtor_uuid, currency_id, amount, user_id, cashbox_id, description, is_caution)
    SELECT * FROM stage_cash WHERE stage_cash.uuid = cashUuid;
END $$


/* ---------------------------------------------------------------------------- */

/*
--------
OVERVIEW
--------

This section contains code for creating and posting invoices made to patients.

NOTE
The rationale behind the Stage* procedures is to interface between JS and SQL.
Every stage method sets up a temporary table that can be used by other
methods.  As temporary tables, they are scoped to the current connection,
meaning that all other methods _must_ be called in the same database
transaction.  Once the connection terminates, the tables are cleaned up.


NOTE
The CopyInvoiceToPostingJournal procedure also handles cost center allocation by the following logic:
  a) If a cost center exists for that account, use the account's cost center.
  b) If no cost center exists for the account, use the cost center of the service selected in the invoice.

This logic applies to invoice_items, invoicing_fees, and subsidies.  As long as each service is assigned a cost center,
every income/expense line in the invoice transaction will have
*/


/*
  Prepare the record to be written to the `invoice` table.
*/
DROP PROCEDURE IF EXISTS StageInvoice$$
CREATE PROCEDURE StageInvoice(
  IN date DATETIME,
  IN cost DECIMAL(19, 4) UNSIGNED,
  IN description TEXT,
  IN service_uuid BINARY(16),
  IN debtor_uuid BINARY(16),
  IN project_id SMALLINT(5),
  IN user_id SMALLINT(5),
  IN uuid BINARY(16)
)
BEGIN
  -- verify if invoice stage already exists within this connection, if the
  -- stage already exists simply write to it, otherwise create and select into it
  DECLARE `no_invoice_stage` TINYINT(1) DEFAULT 0;
  DECLARE CONTINUE HANDLER FOR SQLSTATE '42S02' SET `no_invoice_stage` = 1;
  SELECT NULL FROM `stage_invoice` LIMIT 0;

  IF (`no_invoice_stage` = 1) THEN
    CREATE TEMPORARY TABLE stage_invoice (
      SELECT project_id, uuid, cost, debtor_uuid, service_uuid, user_id, date,
        description
    );
  ELSE
    INSERT INTO stage_invoice (
      SELECT project_id, uuid, cost, debtor_uuid, service_uuid, user_id, date,
        description
    );
  END IF;
END $$

/*
  Prepare record(s) to be written to the `invoice_item` table.
*/
DROP PROCEDURE IF EXISTS StageInvoiceItem$$
CREATE PROCEDURE StageInvoiceItem(
  IN uuid BINARY(16),
  IN inventory_uuid BINARY(16),
  IN quantity INT(10) UNSIGNED,
  IN transaction_price decimal(19, 4),
  IN inventory_price decimal(19, 4),
  IN debit decimal(19, 4),
  IN credit decimal(19, 4),
  IN invoice_uuid BINARY(16)
)
BEGIN
  -- verify if invoice item stage already exists within this connection, if the
  -- stage already exists simply write to it, otherwise create it select into it
  DECLARE `no_invoice_item_stage` TINYINT(1) DEFAULT 0;
  DECLARE CONTINUE HANDLER FOR SQLSTATE '42S02' SET `no_invoice_item_stage` = 1;
  SELECT NULL FROM `stage_invoice_item` LIMIT 0;

  -- tables does not exist - create and enter data
  IF (`no_invoice_item_stage` = 1) THEN
    CREATE TEMPORARY TABLE stage_invoice_item (
      SELECT uuid, inventory_uuid, quantity, transaction_price, inventory_price,
        debit, credit, invoice_uuid
    );

  -- table exists - only enter data
  ELSE
    INSERT INTO stage_invoice_item (
      SELECT uuid, inventory_uuid, quantity, transaction_price, inventory_price,
        debit, credit, invoice_uuid
    );
  END IF;
END $$


DROP PROCEDURE IF EXISTS StageInvoicingFee$$
CREATE PROCEDURE StageInvoicingFee(
  IN id SMALLINT UNSIGNED,
  IN invoice_uuid BINARY(16)
)
BEGIN
  CALL VerifyInvoicingFeeStageTable();
  INSERT INTO stage_invoicing_fee (SELECT id, invoice_uuid);
END $$

DROP PROCEDURE IF EXISTS StageSubsidy$$
CREATE PROCEDURE StageSubsidy(
  IN id SMALLINT UNSIGNED,
  IN invoice_uuid BINARY(16)
)
BEGIN
  CALL VerifySubsidyStageTable();
  INSERT INTO stage_subsidy (SELECT id, invoice_uuid);
END $$

-- create a temporary staging table for the subsidies, this is done via a helper
-- method to ensure it has been created as sale writing time (subsidies are an
-- optional entity that may or may not have been called for staging)
DROP PROCEDURE IF EXISTS VerifySubsidyStageTable$$
CREATE PROCEDURE VerifySubsidyStageTable()
BEGIN
  CREATE TEMPORARY TABLE IF NOT EXISTS stage_subsidy (
    id INTEGER,
    invoice_uuid BINARY(16)
  );
END $$

DROP PROCEDURE IF EXISTS VerifyInvoicingFeeStageTable$$
CREATE PROCEDURE VerifyInvoicingFeeStageTable()
BEGIN
  CREATE TEMPORARY TABLE IF NOT EXISTS stage_invoicing_fee (
    id INTEGER,
    invoice_uuid BINARY(16)
  );
END $$

/*
  CALL WriteInvoice(uuid)

  DESCRIPTION
  This procedure takes all staged records and begins to compose the invoice from
  them.  Keep in mind:
    1) Invoicing Fees place percentage increase on the invoice in proportion
      to the base invoice cost.
    2) Subsidies place a percentage reduction on the invoice in proportion to
      the invoice cost.
    3) Invoicing Fees are applied first, then Subsidies are applied to the
      adjusted invoice amount.

  The final value of this algorithm is recorded in the invoices table as the
  cost of the invoice.  In the posting journal, the invoice...
*/

DROP PROCEDURE IF EXISTS WriteInvoice$$
CREATE PROCEDURE WriteInvoice(
  IN uuid BINARY(16)
)
BEGIN
  -- running calculation variables
  DECLARE items_cost decimal(19, 4);
  DECLARE invoicing_fees_cost decimal(19, 4);
  DECLARE total_cost_to_debtor decimal(19, 4);
  DECLARE total_subsidy_cost decimal(19, 4);
  DECLARE total_subsidised_cost decimal(19, 4);

  -- ensure that all optional entities have staging tables available, it is
  -- possible that the invoice has not invoked methods to stage subsidies and
  -- invoicing fees if they are not relevant - this makes sure the tables
  -- exist for queries within this method.
  CALL VerifySubsidyStageTable();
  CALL VerifyInvoicingFeeStageTable();

  -- invoice details
  INSERT INTO invoice (
    project_id, uuid, cost, debtor_uuid, service_uuid, user_id, date, description
  )
  SELECT * FROM stage_invoice WHERE stage_invoice.uuid = uuid;

  -- invoice item details
  INSERT INTO invoice_item (
    uuid, inventory_uuid, quantity, transaction_price, inventory_price, debit,
    credit, invoice_uuid
  )

  SELECT * from stage_invoice_item WHERE stage_invoice_item.invoice_uuid = uuid;

  -- Total cost of all invoice items.  This is important to determine how much
  -- the invoicing fees
  SET items_cost = (
    SELECT SUM(credit) as cost FROM invoice_item where invoice_uuid = uuid
  );

  -- calculate invoicing fee based on total item cost
  INSERT INTO invoice_invoicing_fee (invoice_uuid, value, invoicing_fee_id)
  SELECT uuid, (invoicing_fee.value / 100) * items_cost, invoicing_fee.id
  FROM invoicing_fee WHERE id in (
    SELECT id FROM stage_invoicing_fee where invoice_uuid = uuid
  );

  -- total cost of all invoice items and invoicing fees
  SET invoicing_fees_cost = (
    SELECT IFNULL(SUM(value), 0) AS value
    FROM invoice_invoicing_fee
    WHERE invoice_uuid = uuid
  );

  -- cost so far to the debtor
  SET total_cost_to_debtor = items_cost + invoicing_fees_cost;

  -- calculate subsidy cost based on total cost to debtor
  INSERT INTO invoice_subsidy (invoice_uuid, value, subsidy_id)
  SELECT uuid, (subsidy.value / 100) * total_cost_to_debtor, subsidy.id
  FROM subsidy WHERE id in (
    SELECT id FROM stage_subsidy where invoice_uuid = uuid
  );

  -- calculate final value debtor must pay based on subsidised costs
  SET total_subsidy_cost = (
    SELECT IFNULL(SUM(value), 0) AS value
    FROM invoice_subsidy
    WHERE invoice_uuid = uuid
  );

  SET total_subsidised_cost = total_cost_to_debtor - total_subsidy_cost;

  -- update relevant fields to represent final costs
  UPDATE invoice SET cost = total_subsidised_cost WHERE invoice.uuid = uuid;

  -- return information relevant to the final calculated and written bill
  SELECT items_cost, invoicing_fees_cost, total_cost_to_debtor,
    total_subsidy_cost, total_subsidised_cost;
END $$


/*
  CALL PostInvoice(uuid);

  DESCRIPTION
  This procedure is called after an invoice is created and written into the
  `invoice` and `invoice_item` tables.  This procedure sets up the initial
  variable definitions before copying rows from the invoice tables into the
  posting journal.  It also performs basic checks for data integrity - that
  every account is properly defined.
*/
DROP PROCEDURE IF EXISTS PostInvoice$$
CREATE PROCEDURE PostInvoice(
  IN uuid binary(16)
)
BEGIN
  DECLARE InvalidSalesAccounts CONDITION FOR SQLSTATE '45006';

  -- required posting values
  DECLARE date DATETIME;
  DECLARE enterprise_id SMALLINT(5);
  DECLARE project_id SMALLINT(5);
  DECLARE currency_id TINYINT(3) UNSIGNED;

  -- variables to store core set-up results
  DECLARE current_fiscal_year_id MEDIUMINT(8) UNSIGNED;
  DECLARE current_period_id MEDIUMINT(8) UNSIGNED;
  DECLARE current_exchange_rate DECIMAL(19, 8) UNSIGNED;
  DECLARE enterprise_currency_id TINYINT(3) UNSIGNED;
  DECLARE transaction_id VARCHAR(100);
  DECLARE gain_account_id INT UNSIGNED;
  DECLARE loss_account_id INT UNSIGNED;

  DECLARE verify_invalid_accounts SMALLINT(5);

  -- populate initial values specifically for this invoice
  SELECT invoice.date, enterprise.id, project.id, enterprise.currency_id
    INTO date, enterprise_id, project_id, currency_id
  FROM invoice JOIN project JOIN enterprise ON
    invoice.project_id = project.id AND
    project.enterprise_id = enterprise.id
  WHERE invoice.uuid = uuid;

  -- populate core set-up values
  CALL PostingSetupUtil(
    date, enterprise_id, project_id, currency_id, current_fiscal_year_id,
    current_period_id, current_exchange_rate, enterprise_currency_id,
    transaction_id, gain_account_id, loss_account_id
  );

  -- Check that all invoice items have sales accounts - if they do not the
  -- transaction will be unbalanced and the account_id will be NULL
  SELECT COUNT(invoice_item.uuid)
    INTO verify_invalid_accounts
  FROM invoice JOIN invoice_item JOIN inventory JOIN inventory_group
  ON invoice.uuid = invoice_item.invoice_uuid
    AND invoice_item.inventory_uuid = inventory.uuid
    AND inventory.group_uuid = inventory_group.uuid
  WHERE invoice.uuid = uuid
  AND inventory_group.sales_account IS NULL;

  IF verify_invalid_accounts > 0 THEN
    SIGNAL InvalidSalesAccounts
    SET MESSAGE_TEXT =
      'A NULL sales account has been found for an inventory item in this invoice.';
  END IF;

  -- now that we are sure that we have all error handled, lets go into the
  CALL CopyInvoiceToPostingJournal(
    uuid, transaction_id, project_id, current_fiscal_year_id, current_period_id,
    currency_id
  );

END $$

DROP PROCEDURE IF EXISTS PostingSetupUtil$$
CREATE PROCEDURE PostingSetupUtil(
  IN date DATETIME,
  IN enterprise_id SMALLINT(5),
  IN project_id SMALLINT(5),
  IN currency_id TINYINT(3) UNSIGNED,
  OUT current_fiscal_year_id MEDIUMINT(8) UNSIGNED,
  OUT current_period_id MEDIUMINT(8) UNSIGNED,
  OUT current_exchange_rate DECIMAL(19, 4) UNSIGNED,
  OUT enterprise_currency_id TINYINT(3) UNSIGNED,
  OUT transaction_id VARCHAR(100),
  OUT gain_account INT UNSIGNED,
  OUT loss_account INT UNSIGNED
)
BEGIN
  SET current_fiscal_year_id = (
    SELECT id FROM fiscal_year AS fy
    WHERE date BETWEEN fy.start_date
      AND DATE(ADDDATE(fy.start_date, INTERVAL fy.number_of_months MONTH))
      AND fy.enterprise_id = enterprise_id
  );

  SET current_period_id = (
    SELECT id FROM period AS p
    WHERE DATE(date) BETWEEN DATE(p.start_date) AND DATE(p.end_date)
      AND p.fiscal_year_id = current_fiscal_year_id
  );

  SELECT e.gain_account_id, e.loss_account_id, e.currency_id
    INTO gain_account, loss_account, enterprise_currency_id
  FROM enterprise AS e WHERE e.id = enterprise_id;

  -- this uses the currency id passed in as a dependency
  SET current_exchange_rate = GetExchangeRate(enterprise_id, currency_id, date);
  SET current_exchange_rate = (
    SELECT IF(currency_id = enterprise_currency_id, 1, current_exchange_rate)
  );

  -- get the transaction id from the GenerateTransactionId function
  SET transaction_id = GenerateTransactionId(project_id);

  -- error handling
  CALL PostingJournalErrorHandler(
    enterprise_id, project_id, current_fiscal_year_id,
    current_period_id, current_exchange_rate, date
  );
END $$

-- detects MySQL Posting Journal Errors
DROP PROCEDURE IF EXISTS PostingJournalErrorHandler$$
CREATE PROCEDURE PostingJournalErrorHandler(
  enterprise INT,
  project INT,
  fiscal INT,
  period INT,
  exchange DECIMAL,
  date DATETIME
)
BEGIN

  -- set up error declarations
  DECLARE NoEnterprise CONDITION FOR SQLSTATE '45001';
  DECLARE NoProject CONDITION FOR SQLSTATE '45002';
  DECLARE NoFiscalYear CONDITION FOR SQLSTATE '45003';
  DECLARE NoPeriod CONDITION FOR SQLSTATE '45004';
  DECLARE NoExchangeRate CONDITION FOR SQLSTATE '45005';

  IF enterprise IS NULL THEN
    SIGNAL NoEnterprise
      SET MESSAGE_TEXT = 'No enterprise found in the database.';
  END IF;

  IF project IS NULL THEN
    SIGNAL NoProject
      SET MESSAGE_TEXT = 'No project provided for that record.';
  END IF;

  IF fiscal IS NULL THEN
    SET @text = CONCAT('No fiscal year found for the provided date: ', CAST(date AS char));
    SIGNAL NoFiscalYear
      SET MESSAGE_TEXT = @text;
  END IF;

  IF period IS NULL THEN
    SET @text = CONCAT('No period found for the provided date: ', CAST(date AS char));
    SIGNAL NoPeriod
      SET MESSAGE_TEXT = @text;
  END IF;

  IF exchange IS NULL THEN
    SET @text = CONCAT('No exchange rate found for the provided date: ', CAST(date AS char));
    SIGNAL NoExchangeRate
      SET MESSAGE_TEXT = @text;
  END IF;
END
$$

-- Credit For Cautions
DROP PROCEDURE IF EXISTS CopyInvoiceToPostingJournal$$
CREATE PROCEDURE CopyInvoiceToPostingJournal(
  iuuid BINARY(16),  -- the UUID of the patient invoice
  transId TEXT,
  projectId INT,
  fiscalYearId INT,
  periodId INT,
  currencyId INT
)
BEGIN
  -- local variables
  DECLARE done INT DEFAULT FALSE;

  -- invoice variables
  DECLARE idate DATETIME;
  DECLARE icost DECIMAL(19,4);
  DECLARE ientityId BINARY(16);
  DECLARE iuserId INT;
  DECLARE idescription TEXT;
  DECLARE iaccountId INT;
  DECLARE serviceCostCenterId INT;

  DECLARE transIdNumberPart INT;

  -- caution variables
  DECLARE cid BINARY(16);
  DECLARE cbalance DECIMAL(19,4);
  DECLARE cdate DATETIME;
  DECLARE cdescription TEXT;

 -- cursor for debtor's cautions
 -- TODO(@jniles) - remove MAX() call.  This violates ONLY_FULL_GROUP_BY.
  DECLARE curse CURSOR FOR
    SELECT c.id, c.date, MAX(c.description), SUM(c.credit - c.debit) AS balance FROM (

        -- get the record_uuids in the posting journal
        SELECT debit_equiv as debit, credit_equiv as credit, posting_journal.trans_date as date, posting_journal.description, record_uuid AS id
        FROM posting_journal JOIN cash
          ON cash.uuid = posting_journal.record_uuid
        WHERE reference_uuid IS NULL AND entity_uuid = ientityId AND cash.is_caution = 0

      UNION ALL

        -- get the record_uuids in the general ledger
        SELECT debit_equiv as debit, credit_equiv as credit, general_ledger.trans_date as date, general_ledger.description, record_uuid AS id
        FROM general_ledger JOIN cash
          ON cash.uuid = general_ledger.record_uuid
        WHERE reference_uuid IS NULL AND entity_uuid = ientityId AND cash.is_caution = 0

      UNION ALL

        -- get the reference_uuids in the posting_journal
        SELECT debit_equiv as debit, credit_equiv as credit, posting_journal.trans_date as date, posting_journal.description, reference_uuid AS id
        FROM posting_journal JOIN cash
          ON cash.uuid = posting_journal.reference_uuid
        WHERE entity_uuid = ientityId AND cash.is_caution = 0

      UNION ALL

        -- get the reference_uuids in the general_ledger
        SELECT debit_equiv as debit, credit_equiv as credit, general_ledger.trans_date as date, general_ledger.description, reference_uuid AS id
        FROM general_ledger JOIN cash
          ON cash.uuid = general_ledger.reference_uuid
        WHERE entity_uuid = ientityId AND cash.is_caution = 0
    ) AS c
    GROUP BY c.id, c.date
    HAVING balance > 0
    ORDER BY c.date;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  SET transIdNumberPart = GetTransactionNumberPart(transId, projectId);

  -- set the invoice variables
  SELECT cost, debtor_uuid, date, user_id, description, GetCostCenterByServiceUuid(service_uuid)
    INTO icost, ientityId, idate, iuserId, idescription, serviceCostCenterId
  FROM invoice WHERE invoice.uuid = iuuid;

  -- set the transaction variables (account)
  SELECT account_id INTO iaccountId
  FROM debtor JOIN debtor_group
   ON debtor.group_uuid = debtor_group.uuid
  WHERE debtor.uuid = ientityId;

  -- open the cursor
  OPEN curse;

  -- create a prepared statement for efficiently writing to the posting_journal
  -- from within the caution LOOP

  -- loop through the cursor of caution payments and allocate payments against
  -- the current invoice to the caution by setting reference_uuid to the
  -- caution's record_uuid.
  cautionLoop: LOOP
    FETCH curse INTO cid, cdate, cdescription, cbalance;

    IF done THEN
      LEAVE cautionLoop;
    END IF;

    -- check: if the caution is more than the cost, assign the total cost of the
    -- invoice to the caution and exit the loop.
    IF cbalance >= icost THEN

      -- write the cost value from into the posting journal
      INSERT INTO posting_journal
          (uuid, project_id, fiscal_year_id, period_id, trans_id, trans_id_reference_number, trans_date,
          record_uuid, description, account_id, debit, credit, debit_equiv,
          credit_equiv, currency_id, entity_uuid, reference_uuid,
          user_id, transaction_type_id)
        VALUES (
          HUID(UUID()), projectId, fiscalYearId, periodId, transId, transIdNumberPart, idate, iuuid, cdescription,
          iaccountId, icost, 0, icost, 0, currencyId, ientityId, cid, iuserId, 11
        );

      -- exit the loop
      SET done = TRUE;

    -- else: the caution is less than the cost, assign the total caution cost to
    -- the caution (making it 0), and continue
    ELSE

      -- if there is no more caution balance escape
      IF cbalance = 0 THEN
        SET done = TRUE;
      ELSE
        -- subtract the caution's balance from the cost
        SET icost = icost - cbalance;

        INSERT INTO posting_journal (
          uuid, project_id, fiscal_year_id, period_id, trans_id, trans_id_reference_number, trans_date,
          record_uuid, description, account_id, debit, credit, debit_equiv,
          credit_equiv, currency_id, entity_uuid, reference_uuid,
          user_id, transaction_type_id
        ) VALUES (
          HUID(UUID()), projectId, fiscalYearId, periodId, transId, transIdNumberPart, idate,
          iuuid, cdescription, iaccountId, cbalance, 0, cbalance, 0,
          currencyId, ientityId, cid, iuserId, 11
        );

      END IF;
    END IF;
  END LOOP;

  -- close the cursor
  CLOSE curse;

  -- if there is remainder cost, bill the debtor the full amount
  IF icost >= 0 THEN
    INSERT INTO posting_journal (
      uuid, project_id, fiscal_year_id, period_id, trans_id, trans_id_reference_number, trans_date,
      record_uuid, description, account_id, debit, credit, debit_equiv,
      credit_equiv, currency_id, entity_uuid, user_id, transaction_type_id
    ) VALUES (
      HUID(UUID()), projectId, fiscalYearId, periodId, transId, transIdNumberPart, idate,
      iuuid, idescription, iaccountId, icost, 0, icost, 0,
      currencyId, ientityId, iuserId, 11
    );
  END IF;

  -- copy the invoice_items into the posting_journal
  INSERT INTO posting_journal (
    uuid, project_id, fiscal_year_id, period_id, trans_id, trans_id_reference_number, trans_date,
    record_uuid, description, account_id, debit, credit, debit_equiv,
    credit_equiv, currency_id, transaction_type_id, user_id, cost_center_id
  )
   SELECT
    HUID(UUID()), i.project_id, fiscalYearId, periodId, transId, transIdNumberPart, i.date, i.uuid,
    CONCAT(dm.text,': ', inv.text) as txt, ig.sales_account, ii.debit, ii.credit, ii.debit, ii.credit,
    currencyId, 11, i.user_id, IFNULL(GetCostCenterByAccountId(ig.sales_account), serviceCostCenterId)
  FROM invoice AS i JOIN invoice_item AS ii JOIN inventory as inv JOIN inventory_group AS ig JOIN document_map as dm ON
    i.uuid = ii.invoice_uuid AND
    ii.inventory_uuid = inv.uuid AND
    inv.group_uuid = ig.uuid AND
    dm.uuid = i.uuid
  WHERE i.uuid = iuuid;

  -- copy the invoice_subsidy records into the posting_journal (debits)
  INSERT INTO posting_journal (
    uuid, project_id, fiscal_year_id, period_id, trans_id, trans_id_reference_number, trans_date,
    record_uuid, description, account_id, debit, credit, debit_equiv,
    credit_equiv, currency_id, transaction_type_id, user_id, cost_center_id
  ) SELECT
    HUID(UUID()), i.project_id, fiscalYearId, periodId, transId, transIdNumberPart, i.date, i.uuid,
    i.description, su.account_id, isu.value, 0, isu.value, 0, currencyId, 11,
    i.user_id,  IFNULL(GetCostCenterByAccountId(su.account_id), serviceCostCenterId)
  FROM invoice AS i JOIN invoice_subsidy AS isu JOIN subsidy AS su ON
    i.uuid = isu.invoice_uuid AND
    isu.subsidy_id = su.id
  WHERE i.uuid = iuuid;

  -- copy the invoice_invoicing_fee records into the posting_journal (credits)
  INSERT INTO posting_journal (
    uuid, project_id, fiscal_year_id, period_id, trans_id, trans_id_reference_number, trans_date,
    record_uuid, description, account_id, debit, credit, debit_equiv,
    credit_equiv, currency_id, transaction_type_id, user_id, cost_center_id
  ) SELECT
    HUID(UUID()), i.project_id, fiscalYearId, periodId, transId, transIdNumberPart, i.date, i.uuid,
    i.description, b.account_id, 0, ib.value, 0, ib.value, currencyId, 11,
    i.user_id, IFNULL(GetCostCenterByAccountId(b.account_id), serviceCostCenterId)
  FROM invoice AS i JOIN invoice_invoicing_fee AS ib JOIN invoicing_fee AS b ON
    i.uuid = ib.invoice_uuid AND
    ib.invoicing_fee_id = b.id
  WHERE i.uuid = iuuid;
END $$

/*
CALL LinkPrepaymentsToInvoice(invoiceUuid, debtorUuid);

This procedure establishes links between payments that have occurred before
goods or services have been billed.  At invoicing time, the system will check
if the debtor has a creditor balance.  If so, it will attempt to "link" the
prepayments by calling the LinkPrepaymentsToInvoice() method.

The following steps happen:
 1. All unbalanced cash payments before the invoice date are collected, along
with their balances.
 2. For each cash payment, a voucher line is added debiting the debtor and
crediting the invoice.  This line's value is MIN(invoice cost, cash value).
 3. The reference_uuid column is populated with the assigned cash payment's uuid.
 4. The invoice_cost is reduced by MIN(invoice cost, cash value).
 5. If invoice_cost is 0, break.  Otherwise, continue until out of cash payments.

This will either:
 1. Halt after the invoice has been completely allocated to a series of cash
payments.
OR
 2. Halt once all cash payments have been assigned to the invoice. There may or
may not be a remaining balance on the invoice.
*/
DROP PROCEDURE IF EXISTS LinkPrepaymentsToInvoice$$
CREATE PROCEDURE LinkPrepaymentsToInvoice(
  IN invoice_uuid BINARY(16),
  IN debtor_uuid BINARY(16),
  IN description TEXT
)
BEGIN
  -- local variables
  DECLARE done INT DEFAULT FALSE;

  -- these are used in the loop
  DECLARE recordUuid BINARY(16);
  DECLARE recordBalance DECIMAL(19,4);
  DECLARE amountToAllocate DECIMAL(19,4);
  DECLARE allocationAmount DECIMAL(19,4);
  DECLARE totalAllocated DECIMAL(19,4);

  -- voucher properties
  DECLARE vUuid BINARY(16);
  DECLARE enterpriseCurrencyId SMALLINT(5);
  DECLARE linkTransactionTypeId SMALLINT(5);
  DECLARE debtorAccountId INT(10);

  DECLARE curse CURSOR FOR
    SELECT payment.uuid, payment.balance FROM stage_payment_balances AS payment;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  -- TODO(@jniles): propose issue for how to deal with this kind of transaction
  -- type that is automatically generated by the system.
  SET linkTransactionTypeId = 19;
  SET vUuid = HUID(UUID());

  SET enterpriseCurrencyId = (
    SELECT currency_id FROM enterprise
    JOIN project ON enterprise.id = project.enterprise_id
    JOIN invoice ON invoice.project_id = project.id
    WHERE invoice.uuid = invoice_uuid
    LIMIT 1
  );

  SET debtorAccountId = (
    SELECT account_id FROM debtor_group JOIN debtor
    ON debtor_group.uuid = debtor.group_uuid
    WHERE debtor.uuid = debtor_uuid
  );

  -- make the voucher that will link the debtor's invoices to their cautions.
  INSERT INTO voucher (uuid, date, project_id, currency_id, amount, description, user_id, type_id)
    SELECT vUuid, date, project_id, enterpriseCurrencyId, 0, description, user_id, linkTransactionTypeId
    FROM invoice WHERE invoice.uuid = invoice_uuid;

  SELECT cost INTO amountToAllocate FROM invoice WHERE uuid = invoice_uuid;

  -- set up the prepayment balances table
  CALL CalculatePrepaymentBalances(debtor_uuid);

  OPEN curse;

  allocatePrepayments: LOOP
    FETCH curse INTO recordUuid, recordBalance;

    -- if done, break
    IF done THEN
      LEAVE allocatePrepayments;
    END IF;

    -- This portion of the loop figures out how much to allocate.
    IF (amountToAllocate - recordBalance > 0) THEN
      -- Branch A: We have more to allocate than in this record, so we'll allocate
      -- the _entire_ record and keep looping.
      SET amountToAllocate = amountToAllocate - recordBalance;
      SET allocationAmount = recordBalance;
    ELSE
      -- Branch B: We have enough to cover the allocation amount in this record.
      -- Set the amount allocated to the amount required and then exit the loop.
      SET allocationAmount = amountToAllocate;
      SET amountToAllocate = 0;
      SET done = TRUE;
    END IF;

    INSERT INTO voucher_item (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`) VALUES (
      HUID(UUID()), debtorAccountId, allocationAmount, 0, vUuid, recordUuid, debtor_uuid
    );
  END LOOP allocatePrepayments;

  SET totalAllocated = (SELECT SUM(debit) from voucher_item WHERE voucher_uuid = vUuid);

  -- insert the final voucher item row that hits the invoice
  INSERT INTO voucher_item (`uuid`, `account_id`, `debit`, `credit`, `voucher_uuid`, `document_uuid`, `entity_uuid`)
  VALUES (HUID(UUID()), debtorAccountId, 0, totalAllocated, vUuid, invoice_uuid, debtor_uuid);

  UPDATE voucher SET amount = totalAllocated WHERE voucher.uuid = vUuid;

  CALL PostVoucher(vUuid);
END $$

DROP PROCEDURE IF EXISTS VerifyPrepaymentTemporaryTables$$
CREATE PROCEDURE VerifyPrepaymentTemporaryTables()
BEGIN
  CREATE TEMPORARY TABLE IF NOT EXISTS stage_payment_records (
    uuid BINARY(16), debit DECIMAL(19,4), credit DECIMAL(19,4), date TIMESTAMP,
    INDEX uuid (uuid)
  );

  CREATE TEMPORARY TABLE IF NOT EXISTS stage_payment_references (
    uuid BINARY(16), debit DECIMAL(19,4), credit DECIMAL(19,4), date TIMESTAMP,
    INDEX uuid (uuid)
  );

  CREATE TEMPORARY TABLE IF NOT EXISTS stage_payment_balances (
    uuid BINARY(16), balance DECIMAL(19, 4), date TIMESTAMP,
    INDEX uuid (uuid)
  );
END $$

DROP PROCEDURE IF EXISTS CalculatePrepaymentBalances$$
CREATE PROCEDURE CalculatePrepaymentBalances(
  IN debtor_uuid BINARY(16)
)
BEGIN
  CALL VerifyPrepaymentTemporaryTables();

  -- pull in posting_journal data
  INSERT INTO stage_payment_records
    SELECT p.record_uuid AS uuid, p.debit_equiv as debit, p.credit_equiv as credit, p.trans_date as date
    FROM posting_journal AS p
      JOIN cash c ON c.uuid = p.record_uuid
    WHERE c.debtor_uuid = debtor_uuid
      AND c.reversed = 0
      AND c.is_caution = 1
      AND p.entity_uuid IS NOT NULL;

  -- pull in general_ledger data
  INSERT INTO stage_payment_records
    SELECT p.record_uuid AS uuid, p.debit_equiv as debit, p.credit_equiv as credit, p.trans_date as date
    FROM general_ledger AS p
      JOIN cash c ON c.uuid = p.record_uuid
    WHERE c.debtor_uuid = debtor_uuid
      AND c.reversed = 0
      AND c.is_caution = 1
      AND p.entity_uuid IS NOT NULL;

  -- pull in posting_journal references
  INSERT INTO stage_payment_references
    SELECT p.reference_uuid AS uuid, p.debit_equiv as debit, p.credit_equiv as credit, p.trans_date as date
    FROM posting_journal AS p
      JOIN cash c ON c.uuid = p.reference_uuid
    WHERE c.debtor_uuid = debtor_uuid AND c.reversed = 0 AND c.is_caution = 1;

  -- pull in general_ledger references
  INSERT INTO stage_payment_references
    SELECT p.reference_uuid AS uuid, p.debit_equiv as debit, p.credit_equiv as credit, p.trans_date as date
    FROM general_ledger AS p
      JOIN cash c ON c.uuid = p.reference_uuid
    WHERE c.debtor_uuid = debtor_uuid AND c.reversed = 0 AND c.is_caution = 1;

  INSERT INTO stage_payment_balances
    SELECT zz.uuid, zz.balance, zz.date
    FROM (
      SELECT ledger.uuid, SUM(ledger.credit - ledger.debit) AS balance, MIN(ledger.date) AS date
      FROM (
        SELECT records.uuid, records.debit, records.credit, records.date FROM stage_payment_records AS records
      UNION ALL
        SELECT refs.uuid, refs.debit, refs.credit, refs.date FROM stage_payment_references AS refs
      ) AS ledger
      GROUP BY ledger.uuid
      HAVING balance <> 0
    ) AS zz ORDER BY zz.date;
END $$


/*
PROCEDURE UnbalancedInvoicePayments

USAGE: Call UnbalancedInvoicePayments(dateFrom, dateTo);

Description:
This SP retrieves the balance of invoices made during a period of time.  It
filters out invoices that are reversed (they should be balanced by default),
as well as balanced invoices.

*/
DROP PROCEDURE IF EXISTS UnbalancedInvoicePayments$$
CREATE PROCEDURE UnbalancedInvoicePayments(
  IN dateFrom DATE,
  IN dateTo DATE
) BEGIN

  -- this holds all the invoices that were made during the period
  -- two copies are needed for the UNION ALL query.
  DROP TABLE IF EXISTS tmp_invoices_1;
  CREATE TEMPORARY TABLE tmp_invoices_1 (INDEX uuid (uuid)) AS
    SELECT invoice.uuid, invoice.debtor_uuid, invoice.date
    FROM invoice
    WHERE
      DATE(invoice.date) BETWEEN DATE(dateFrom) AND DATE(dateTo)
      AND reversed = 0
    ORDER BY invoice.date;

  DROP TABLE IF EXISTS tmp_invoices_2;
  CREATE TEMPORARY TABLE tmp_invoices_2 AS SELECT * FROM tmp_invoices_1;

  -- This holds the invoices from the PJ/GL
  DROP TEMPORARY TABLE IF EXISTS tmp_records;
  CREATE TABLE tmp_records AS
    SELECT ledger.record_uuid AS uuid, ledger.debit_equiv, ledger.credit_equiv
    FROM (
      SELECT pj.record_uuid, pj.debit_equiv, pj.credit_equiv
      FROM posting_journal pj
        JOIN tmp_invoices_1 i ON i.uuid = pj.record_uuid
          AND pj.entity_uuid = i.debtor_uuid

      UNION ALL

      SELECT gl.record_uuid, gl.debit_equiv, gl.credit_equiv
      FROM general_ledger gl
        JOIN tmp_invoices_2 i ON i.uuid = gl.record_uuid
            AND gl.entity_uuid = i.debtor_uuid
  ) AS ledger;

  -- this holds the references/payments against the invoices
  DROP TABLE IF EXISTS tmp_references;
  CREATE TEMPORARY TABLE tmp_references AS
    SELECT ledger.reference_uuid AS uuid, ledger.debit_equiv, ledger.credit_equiv
    FROM (
      SELECT pj.reference_uuid, pj.debit_equiv, pj.credit_equiv
      FROM posting_journal pj
        JOIN tmp_invoices_1 i ON i.uuid = pj.reference_uuid
          AND pj.entity_uuid = i.debtor_uuid

      UNION ALL

      SELECT gl.reference_uuid, gl.debit_equiv, gl.credit_equiv
      FROM general_ledger gl
        JOIN tmp_invoices_2 i ON i.uuid = gl.reference_uuid
          AND gl.entity_uuid = i.debtor_uuid
  ) AS ledger;

  -- combine invoices and references to get the balance of each invoice.
  -- note that we filter out balanced invoices
  DROP TABLE IF EXISTS tmp_invoice_balances;
  CREATE TEMPORARY TABLE tmp_invoice_balances AS
    SELECT z.uuid, SUM(z.debit_equiv) AS debit_equiv,
      SUM(z.credit_equiv) AS credit_equiv,
      SUM(z.debit_equiv) - SUM(z.credit_equiv) AS balance
    FROM (
      SELECT i.uuid, i.debit_equiv, i.credit_equiv FROM tmp_records i
      UNION ALL
      SELECT p.uuid, p.debit_equiv, p.credit_equiv FROM tmp_references p
    )z
    GROUP BY z.uuid
    HAVING balance <> 0;

  -- even though this column is called "balance", it is actually the amount remaining
  -- on the invoice.
  SELECT em.text AS debtorReference, debtor.text AS debtorName, balances.debit_equiv AS debit,
    balances.credit_equiv AS credit, iv.date AS creation_date, balances.balance,
     (balances.credit_equiv / IF(balances.debit_equiv = 0, 1, balances.debit_equiv )) AS paymentPercentage,
    dm.text AS reference
  FROM tmp_invoices_1 AS iv
    JOIN tmp_invoice_balances AS balances ON iv.uuid = balances.uuid
    LEFT JOIN document_map AS dm ON dm.uuid = iv.uuid
    JOIN debtor ON debtor.uuid = iv.debtor_uuid
    LEFT JOIN entity_map AS em ON em.uuid = iv.debtor_uuid
  ORDER BY iv.date;
END$$


-- this procedure speeds up the unbalanced invoices report by putting
-- the queries in SQL.  It creates a temporary table 'unbalanced_invoices'
-- that can be queried to return all invoices that are not balanced.
DROP PROCEDURE IF EXISTS UnbalancedInvoicePaymentsTable$$
CREATE PROCEDURE UnbalancedInvoicePaymentsTable(
  IN dateFrom DATE,
  IN dateTo DATE,
  IN currencyId INT
) BEGIN

  DECLARE exchangeRate DECIMAL(19, 8) UNSIGNED;
  DECLARE _enterpriseId SMALLINT;
  SET _enterpriseId = (SELECT id FROM enterprise LIMIT 1);

  -- this holds all the invoices that were made during the period
  -- two copies are needed for the UNION ALL query.
  DROP TEMPORARY TABLE IF EXISTS tmp_invoices_1;
  CREATE TEMPORARY TABLE tmp_invoices_1 (INDEX uuid (uuid)) AS
    SELECT invoice.uuid, invoice.debtor_uuid, invoice.date
    FROM invoice
    WHERE
      DATE(invoice.date) BETWEEN DATE(dateFrom) AND DATE(dateTo)
      AND reversed = 0
    ORDER BY invoice.date;

  DROP TEMPORARY TABLE IF EXISTS tmp_invoices_2;
  CREATE TEMPORARY TABLE tmp_invoices_2 AS SELECT * FROM tmp_invoices_1;

  DROP TEMPORARY TABLE IF EXISTS tmp_records;
  -- This holds the invoices from the PJ/GL
  CREATE TEMPORARY TABLE tmp_records AS
    SELECT ledger.record_uuid AS uuid, ledger.debit_equiv, ledger.credit_equiv
    FROM (
      SELECT pj.record_uuid, pj.debit_equiv, pj.credit_equiv
      FROM posting_journal pj
        JOIN tmp_invoices_1 i ON i.uuid = pj.record_uuid
          AND pj.entity_uuid = i.debtor_uuid

      UNION ALL

      SELECT gl.record_uuid, gl.debit_equiv, gl.credit_equiv
      FROM general_ledger gl
        JOIN tmp_invoices_2 i ON i.uuid = gl.record_uuid
            AND gl.entity_uuid = i.debtor_uuid
  ) AS ledger;

  -- this holds the references/payments against the invoices
  DROP TEMPORARY TABLE IF EXISTS tmp_references;
  CREATE TEMPORARY TABLE tmp_references AS
    SELECT ledger.reference_uuid AS uuid, ledger.debit_equiv, ledger.credit_equiv
    FROM (
      SELECT pj.reference_uuid, pj.debit_equiv, pj.credit_equiv
      FROM posting_journal pj
        JOIN tmp_invoices_1 i ON i.uuid = pj.reference_uuid
          AND pj.entity_uuid = i.debtor_uuid

      UNION ALL

      SELECT gl.reference_uuid, gl.debit_equiv, gl.credit_equiv
      FROM general_ledger gl
        JOIN tmp_invoices_2 i ON i.uuid = gl.reference_uuid
          AND gl.entity_uuid = i.debtor_uuid
  ) AS ledger;

  -- combine invoices and references to get the balance of each invoice.
  -- note that we filter out balanced invoices
  DROP TEMPORARY TABLE IF EXISTS tmp_invoice_balances;
  CREATE TEMPORARY TABLE tmp_invoice_balances AS
    SELECT z.uuid, SUM(z.debit_equiv) AS debit_equiv,
      SUM(z.credit_equiv) AS credit_equiv,
      SUM(z.debit_equiv) - SUM(z.credit_equiv) AS balance
    FROM (
      SELECT i.uuid, i.debit_equiv, i.credit_equiv FROM tmp_records i
      UNION ALL
      SELECT p.uuid, p.debit_equiv, p.credit_equiv FROM tmp_references p
    )z
    GROUP BY z.uuid
    HAVING balance <> 0;

  -- even though this column is called "balance", it is actually the amount remaining
  -- on the invoice.

  SET exchangeRate = (SELECT IFNULL(GetExchangeRate(_enterpriseId, currencyId, dateTo), 1));

  DROP TEMPORARY TABLE IF EXISTS unbalanced_invoices;
  CREATE TEMPORARY TABLE `unbalanced_invoices` AS (
    SELECT BUID(ivc.uuid) as invoice_uuid , em.text AS debtorReference, debtor.text AS debtorName,
      BUID(debtor.uuid) as debtorUuid,
      (balances.debit_equiv * exchangeRate) AS debit,
      (balances.credit_equiv  * exchangeRate) AS credit,
      (balances.balance * exchangeRate) AS balance,
      iv.date AS creation_date,
      dm.text AS reference, ivc.project_id, p.name as 'projectName', dbtg.name as 'debtorGroupName',
      s.name as 'serviceName', s.uuid as 'serviceUuid',
      ((balances.credit_equiv * exchangeRate / IF(balances.debit_equiv = 0, 1, balances.debit_equiv * exchangeRate)) * 100) AS paymentPercentage
    FROM tmp_invoices_1 AS iv
        JOIN invoice ivc ON ivc.uuid = iv.uuid
        JOIN service s On s.uuid = ivc.service_uuid
        JOIN debtor dbt ON ivc.debtor_uuid = dbt.uuid
        JOIN debtor_group dbtg ON dbtg.uuid = dbt.group_uuid
        JOIN project p ON p.id = ivc.project_id
      JOIN tmp_invoice_balances AS balances ON iv.uuid = balances.uuid
      LEFT JOIN document_map AS dm ON dm.uuid = iv.uuid
      JOIN debtor ON debtor.uuid = iv.debtor_uuid
      LEFT JOIN entity_map AS em ON em.uuid = iv.debtor_uuid
    ORDER BY iv.date
  );
END$$

/* ---------------------------------------------------------------------------- */

/*

This section is responsible for procedures for fiscal years and periods.

Create Fiscal Year and Periods

This procedure help to create fiscal year and fiscal year's periods
periods include period `0` and period `13`
*/

DROP PROCEDURE IF EXISTS CreateFiscalYear$$
CREATE PROCEDURE CreateFiscalYear(
  IN p_enterprise_id SMALLINT(5),
  IN p_previous_fiscal_year_id MEDIUMINT(8),
  IN p_user_id SMALLINT(5),
  IN p_label VARCHAR(50),
  IN p_number_of_months MEDIUMINT(8),
  IN p_start_date DATE,
  IN p_end_date DATE,
  IN p_note TEXT,
  OUT fiscalYearId MEDIUMINT(8)
)
BEGIN
  INSERT INTO fiscal_year (
    `enterprise_id`, `previous_fiscal_year_id`, `user_id`, `label`,
    `number_of_months`, `start_date`, `end_date`, `note`
  ) VALUES (
    p_enterprise_id, p_previous_fiscal_year_id, p_user_id, p_label,
    p_number_of_months, p_start_date, p_end_date, p_note
  );

  SET fiscalYearId = LAST_INSERT_ID();
  CALL CreatePeriods(fiscalYearId);
END $$

DROP PROCEDURE IF EXISTS GetPeriodRange$$
CREATE PROCEDURE GetPeriodRange(
  IN fiscalYearStartDate DATE,
  IN periodNumberIndex SMALLINT(5),
  OUT periodStartDate DATE,
  OUT periodEndDate DATE
) BEGIN
  DECLARE `innerDate` DATE;

  SET innerDate = (SELECT DATE_ADD(fiscalYearStartDate, INTERVAL periodNumberIndex-1 MONTH));
  SET periodStartDate = (SELECT CAST(DATE_FORMAT(innerDate ,'%Y-%m-01') as DATE));
  SET periodEndDate = (SELECT LAST_DAY(innerDate));
END $$

DROP PROCEDURE IF EXISTS CreatePeriods$$
CREATE PROCEDURE CreatePeriods(
  IN fiscalYearId MEDIUMINT(8)
)
BEGIN
  DECLARE periodId MEDIUMINT(8);
  DECLARE periodNumber SMALLINT(5) DEFAULT 0;
  DECLARE periodStartDate DATE;
  DECLARE periodEndDate DATE;
  DECLARE periodLocked TINYINT(1);

  DECLARE fyEnterpriseId SMALLINT(5);
  DECLARE fyNumberOfMonths MEDIUMINT(8) DEFAULT 0;
  DECLARE fyLabel VARCHAR(50);
  DECLARE fyStartDate DATE;
  DECLARE fyEndDate DATE;
  DECLARE fyPreviousFYId SMALLINT(5);
  DECLARE fyLocked TINYINT(1);
  DECLARE fyCreatedAt TIMESTAMP;
  DECLARE fyUpdatedAt TIMESTAMP;
  DECLARE fyUserId MEDIUMINT(5);
  DECLARE fyNote TEXT;

  -- get the fiscal year informations
  SELECT
    enterprise_id, number_of_months, label, start_date, end_date,
    previous_fiscal_year_id, locked, created_at, updated_at, user_id, note
    INTO
    fyEnterpriseId, fyNumberOfMonths, fyLabel, fyStartDate, fyEndDate,
    fyPreviousFYId, fyLocked, fyCreatedAt, fyUpdatedAt, fyUserId, fyNote
  FROM fiscal_year WHERE id = fiscalYearId;

  -- insert N+1 period
  WHILE periodNumber <= fyNumberOfMonths + 1 DO

    IF periodNumber = 0 THEN
      -- Extremum periods 0 and N+1
      -- Insert periods with null dates - period id is YYYY00
      INSERT INTO period (`id`, `fiscal_year_id`, `number`, `start_date`, `end_date`, `locked`)
      VALUES (CONCAT(YEAR(fyStartDate), periodNumber), fiscalYearId, periodNumber, NULL, NULL, 0);

    ELSEIF periodNumber = fyNumberOfMonths + 1 THEN
      -- Extremum periods N+1
      -- Insert periods with null dates - period id is YYYY13
      INSERT INTO period (`id`, `fiscal_year_id`, `number`, `start_date`, `end_date`, `locked`)
      VALUES (CONCAT(YEAR(fyStartDate), periodNumber), fiscalYearId, periodNumber, NULL, NULL, 0);

    ELSE
      -- Normal periods
      -- Get period dates range
      CALL GetPeriodRange(fyStartDate, periodNumber, periodStartDate, periodEndDate);

      -- Inserting periods -- period id is YYYYMM
      INSERT INTO period(`id`, `fiscal_year_id`, `number`, `start_date`, `end_date`, `locked`)
      VALUES (DATE_FORMAT(periodStartDate, '%Y%m'), fiscalYearId, periodNumber, periodStartDate, periodEndDate, 0);
    END IF;

    SET periodNumber = periodNumber + 1;

    CALL UpdatePeriodLabels();
  END WHILE;
END $$


DROP PROCEDURE IF EXISTS `UpdatePeriodLabels`$$
CREATE PROCEDURE `UpdatePeriodLabels`()
BEGIN
DECLARE _id mediumint(8) unsigned;
DECLARE _start_date DATE;

DECLARE done BOOLEAN;
DECLARE curs1 CURSOR FOR
   SELECT id, start_date FROM period;

DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

OPEN curs1;
    read_loop: LOOP
    FETCH curs1 INTO _id, _start_date;
        IF done THEN
            LEAVE read_loop;
        END IF;
         UPDATE period SET
        period.translate_key = CONCAT('TABLE.COLUMNS.DATE_MONTH.', UPPER(DATE_FORMAT(_start_date, "%M"))),
        period.year =  YEAR(_start_date)
      WHERE period.id = _id;
    END LOOP;
CLOSE curs1;
END$$

/*
CALL CloseFiscalYear();

DESCRIPTION
This procedure closes a fiscal year in the follow way:
 1. Look up the next fiscal year.  You can only close a fiscal year if you
have a subsequent fiscal year created.
 2. Retrieve the balances for every account by summing the period_totals.
 3. Find the balance of income and expense accounts by summing both groups and
subtracting the total income from the total expense.
 4. Write the balances of every account that isn't an income or expense account
to the period 0 of the subsequent year.
 5. Write the balance of income and expense accounts (step 3) to the period 0
value of the account provided. If this account had a previous value, add the two
to get the final opening balance.

TODO - check that there are no unposted records from previous years.
*/
DROP PROCEDURE IF EXISTS CloseFiscalYear$$
CREATE PROCEDURE CloseFiscalYear(
  IN fiscalYearId MEDIUMINT UNSIGNED,
  IN closingAccountId INT UNSIGNED
)
BEGIN
  DECLARE NoSubsequentFiscalYear CONDITION FOR SQLSTATE '45010';
  DECLARE nextFiscalYearId MEDIUMINT UNSIGNED;
  DECLARE nextPeriodZeroId MEDIUMINT UNSIGNED;
  DECLARE currentFiscalYearClosingPeriod INT;

  DECLARE incomeAccountType SMALLINT;
  DECLARE expenseAccountType SMALLINT;

  -- constants
  SET incomeAccountType = 4;
  SET expenseAccountType = 5;

  -- find the subsequent fiscal year
  SET nextFiscalYearId = (
    SELECT id FROM fiscal_year
    WHERE previous_fiscal_year_id = fiscalYearId
    LIMIT 1
  );

  -- get the current fiscal year date
  SET currentFiscalYearClosingPeriod = (
    SELECT period.id FROM period WHERE period.fiscal_year_id = fiscalYearId ORDER BY period.number DESC LIMIT 1
  );

  IF nextFiscalYearId IS NULL THEN
    SIGNAL NoSubsequentFiscalYear
    SET MESSAGE_TEXT =
      'A fiscal year can only be closed into a subsequent fiscal year.  There is no following year for this fiscal year.';
  END IF;

  -- find the period id of the period 0 for the subsequent fiscal year
  SET nextPeriodZeroId = (
    SELECT period.id FROM period
    WHERE period.fiscal_year_id = nextFiscalYearId AND period.number = 0
  );

  -- create the fiscal year balances
  CREATE TEMPORARY TABLE FiscalYearBalances AS
    SELECT a.id, MAX(fy.id) AS fiscal_year_id, MAX(fy.enterprise_id) AS enterprise_id,
      SUM(pt.credit) AS credit, SUM(pt.debit) AS debit,
      SUM(pt.debit - pt.credit) AS balance, MAX(a.type_id) AS type_id
    FROM period_total AS pt
      JOIN account AS a ON pt.account_id = a.id
      JOIN account_type AS at ON a.type_id = at.id
      JOIN fiscal_year AS fy ON pt.fiscal_year_id = fy.id
    WHERE pt.fiscal_year_id = fiscalYearId
    GROUP BY a.id
    ORDER BY a.number;

  -- reverse the income/expense accounts in closing period into the closing account
  -- If they have a debit balance, credit them the difference, if they have a
  -- credit balance, debit them the difference
  INSERT INTO period_total
    (enterprise_id, fiscal_year_id, period_id, account_id, credit, debit)
  SELECT fyb.enterprise_id, fyb.fiscal_year_id, currentFiscalYearClosingPeriod, fyb.id,
    IF(fyb.debit > fyb.credit, fyb.debit - fyb.credit, 0),
    IF(fyb.debit < fyb.credit, fyb.credit - fyb.debit, 0)
  FROM FiscalYearBalances AS fyb
  WHERE fyb.type_id IN (incomeAccountType, expenseAccountType);

  -- sum all income/expense accounts from the fiscal year into the closing
  -- account in the closing period
  INSERT INTO period_total
    (enterprise_id, fiscal_year_id, period_id, account_id, credit, debit)
  SELECT fyb.enterprise_id, fyb.fiscal_year_id, currentFiscalYearClosingPeriod,
    closingAccountId, SUM(fyb.credit) credit, SUM(fyb.debit) debit
  FROM FiscalYearBalances AS fyb
  WHERE fyb.type_id IN (incomeAccountType, expenseAccountType)
  GROUP BY fyb.enterprise_id
  ON DUPLICATE KEY UPDATE credit = credit + VALUES(credit), debit = debit + VALUES(debit);

  -- copy all balances of non-income and non-expense accounts as the opening
  -- balance of the next fiscal year.  Leaving off the closing account, since it
  -- will be migrated from the closing period.
  INSERT INTO period_total
    (enterprise_id, fiscal_year_id, period_id, account_id, credit, debit)
  SELECT fyb.enterprise_id, nextFiscalYearId, nextPeriodZeroId, fyb.id,
    fyb.credit, fyb.debit
  FROM FiscalYearBalances AS fyb
  WHERE fyb.type_id NOT IN (incomeAccountType, expenseAccountType)
    AND fyb.id <> closingAccountId;

  -- now bring over the closing account from the closing period
  INSERT INTO period_total
    (enterprise_id, fiscal_year_id, period_id, account_id, credit, debit)
  SELECT enterprise_id, nextFiscalYearId, nextPeriodZeroId, account_id, credit, debit
  FROM period_total
  WHERE period_id = currentFiscalYearClosingPeriod
    AND account_id = closingAccountId;

  -- lock the fiscal year and associated periods
  UPDATE fiscal_year SET locked = 1 WHERE id = fiscalYearId;
  UPDATE period SET locked = 1 WHERE fiscal_year_id = fiscalYearId;
END $$


/* ---------------------------------------------------------------------------- */

/*

--------
OVERVIEW
--------

This procedures section contains all procedures for creating vouchers.  A "voucher"
is a generic accounting document that can model essentially any transaction.
Given their flexibility, they are expected to be a user's main method of
creating non-standard transactions, such as recording generic payments or
balancing accounts.  All transactions that are not an invoice or cash payment
are modeled as vouchers.

Unlike cash payments and invoices, where many additional calculations may need
to take place prior to writing the transaction, vouchers alone have no
additional preprocessing.  For this reason, they are missing the StageVoucher()
and StageVoucherItem() methods.  The tables can be written to directly from JS.

There is also a special facility for reversing transactions.  In double-entry
accounting, to reverse a transaction, one only needs to flip the debits and
credits of a previous transaction.  However, this does not capture the reason
for which the transaction needed to be reversed.  To overcome this limitation,
BHIMA implements ReverseTransaction(), which adds special text to the previous
transaction's description, as well as points the voucher's "reference_uuid"
column to the reversed transaction.  Despite a similar sounding name, the
"reference_uuid" column is never written to the posting_journal.  It is used
only for reference lookups on the voucher table.
*/


/*
CALL PostVoucher();

DESCRIPTION
This function posts a voucher that has already been written to the vouchers
table.  The route will convert currencies from the given currency into the
enterprise currency directly as it writes the values into the posting_journal.
*/
DROP PROCEDURE IF EXISTS PostVoucher$$
CREATE PROCEDURE PostVoucher(
  IN uuid BINARY(16)
)
BEGIN
  DECLARE enterprise_id INT;
  DECLARE project_id INT;
  DECLARE currency_id INT;
  DECLARE date TIMESTAMP;

  -- variables to store core set-up results
  DECLARE fiscal_year_id MEDIUMINT(8) UNSIGNED;
  DECLARE period_id MEDIUMINT(8) UNSIGNED;
  DECLARE current_exchange_rate DECIMAL(19, 8) UNSIGNED;
  DECLARE enterprise_currency_id TINYINT(3) UNSIGNED;
  DECLARE transaction_id VARCHAR(100);
  DECLARE gain_account_id INT UNSIGNED;
  DECLARE loss_account_id INT UNSIGNED;


  DECLARE transIdNumberPart INT;
  --
  SELECT p.enterprise_id, p.id, v.currency_id, v.date
    INTO enterprise_id, project_id, currency_id, date
  FROM voucher AS v JOIN project AS p ON v.project_id = p.id
  WHERE v.uuid = uuid;

  -- populate core setup values
  CALL PostingSetupUtil(date, enterprise_id, project_id, currency_id, fiscal_year_id, period_id, current_exchange_rate, enterprise_currency_id, transaction_id, gain_account_id, loss_account_id);

  -- make sure the exchange rate is correct
  SET current_exchange_rate = GetExchangeRate(enterprise_id, currency_id, date);
  SET current_exchange_rate = (SELECT IF(currency_id = enterprise_currency_id, 1, current_exchange_rate));

  SET transIdNumberPart = GetTransactionNumberPart(transaction_id, project_id);

  -- POST to the posting journal
  -- @TODO(sfount) transaction ID number reference should be fetched seperately from full transaction ID to model this relationship better
  INSERT INTO posting_journal (uuid, project_id, fiscal_year_id, period_id,
    trans_id, trans_id_reference_number, trans_date, record_uuid, description, account_id, debit,
    credit, debit_equiv, credit_equiv, currency_id, entity_uuid,
    reference_uuid, comment, transaction_type_id, cost_center_id, user_id)
  SELECT
    HUID(UUID()), v.project_id, fiscal_year_id, period_id, transaction_id, transIdNumberPart, v.date,
    v.uuid, IF((vi.description IS NULL), v.description, vi.description), vi.account_id, vi.debit, vi.credit,
    vi.debit * (1 / current_exchange_rate), vi.credit * (1 / current_exchange_rate), v.currency_id,
    vi.entity_uuid, vi.document_uuid, NULL, v.type_id, vi.cost_center_id, v.user_id
  FROM voucher AS v JOIN voucher_item AS vi ON v.uuid = vi.voucher_uuid
  WHERE v.uuid = uuid;

  -- NOTE: this does not handle any rounding - it simply converts the currency as needed.
END $$

/*
CALL ReverseTransaction()

DESCRIPTION
A unique procedure specifically for reversing cash payments or invoices.  It
should not be called for vouchers.  The procedures will simply copy the previous
transaction and create a voucher reversing the debits and credits of the
transaction.  In double-entry accounting, this will effectively annul the last
transaction.  Additionally, the voucher will store the uuid of the record that
is being reversed in the "reference_uuid" column of the "voucher" table.  This
enables filters to look up the reversing entry later for any cash payment or
invoice.

Once the procedure has finished, the corresponding cash or invoice record will
have the "reversed" column set to "1".
*/
DROP PROCEDURE IF EXISTS ReverseTransaction $$
CREATE PROCEDURE ReverseTransaction(
  IN uuid BINARY(16),
  IN user_id INT,
  IN description TEXT,
  IN voucher_uuid BINARY(16),
  IN preserveDate BOOLEAN /* use the original transaction date */
)
BEGIN
  -- NOTE: someone should check that the record_uuid is not used as a reference_uuid somewhere
  -- This is done in JS currently, but could be done here.
  DECLARE isInvoice BOOLEAN;
  DECLARE isCashPayment BOOLEAN;
  DECLARE isVoucher BOOLEAN;
  DECLARE reversalType INT;
  DECLARE oldDate TIMESTAMP;

  SET reversalType = 10;

  SET isInvoice = (SELECT IFNULL((SELECT 1 FROM invoice WHERE invoice.uuid = uuid), 0));
  SET isVoucher = (SELECT IFNULL((SELECT 1 FROM voucher WHERE voucher.uuid = uuid), 0));

  -- avoid a scan of the cash table if we already know this is an invoice reversal
  IF NOT isInvoice THEN
    SET isCashPayment = (SELECT IFNULL((SELECT 1 FROM cash WHERE cash.uuid = uuid), 0));
  END IF;

  -- set old date
  IF preserveDate THEN
    IF isInvoice THEN
      SET oldDate = (SELECT date FROM invoice WHERE invoice.uuid = uuid);
    ELSEIF isVoucher THEN
      SET oldDate = (SELECT date FROM voucher WHERE voucher.uuid = uuid);
    ELSE
      SET oldDate = (SELECT date FROM cash WHERE cash.uuid = uuid);
    END IF;
  ELSE
    set oldDate = (SELECT NOW());
  END IF;

  -- @fixme - why do we have `amount` in the voucher table?

  INSERT INTO voucher (uuid, date, project_id, currency_id, amount, description, user_id, type_id, reference_uuid)
    SELECT voucher_uuid, oldDate, zz.project_id, enterprise.currency_id, 0, CONCAT_WS(' ', '(CORRECTION)', description), user_id, reversalType, uuid
    FROM (
      SELECT pj.project_id, pj.description FROM posting_journal AS pj WHERE pj.record_uuid = uuid
      UNION ALL
      SELECT gl.project_id, gl.description FROM general_ledger AS gl WHERE gl.record_uuid = uuid
    ) AS zz
      JOIN project ON zz.project_id = project.id
      JOIN enterprise ON project.enterprise_id = enterprise.id
    LIMIT 1;

  -- NOTE: the debits and credits are swapped on purpose here
  INSERT INTO voucher_item (uuid, account_id, debit, credit, voucher_uuid, document_uuid, entity_uuid, cost_center_id)
    SELECT HUID(UUID()), zz.account_id, zz.credit_equiv, zz.debit_equiv, voucher_uuid, zz.reference_uuid, zz.entity_uuid, zz.cost_center_id
    FROM (
      SELECT pj.account_id, pj.credit_equiv, pj.debit_equiv, pj.reference_uuid, pj.entity_uuid, pj.cost_center_id
      FROM posting_journal AS pj WHERE pj.record_uuid = uuid
      UNION ALL
      SELECT gl.account_id, gl.credit_equiv, gl.debit_equiv, gl.reference_uuid, gl.entity_uuid, gl.cost_center_id
      FROM general_ledger AS gl WHERE gl.record_uuid = uuid
    ) AS zz;

  -- update the "amount" with the sum of the voucher_items.  We could choose either
  -- debits or credits to sum here ... they should be equivalent.
  UPDATE voucher SET amount = (
    SELECT SUM(vi.debit) FROM (
      SELECT * FROM voucher_item) AS vi WHERE vi.voucher_uuid = voucher.uuid
    ) WHERE voucher.uuid = voucher_uuid;

  -- make sure we update the invoice with the fact that it got reversed.
  IF isInvoice THEN
    UPDATE invoice SET reversed = 1 WHERE invoice.uuid = uuid;
  END IF;

  -- make sure we update the cash payment that was reversed
  IF isCashPayment THEN
    UPDATE cash SET reversed = 1 WHERE cash.uuid = uuid;
  END IF;

  IF isVoucher THEN
    UPDATE voucher SET reversed = 1 where voucher.uuid = uuid;
  END IF;

  CALL PostVoucher(voucher_uuid);
END $$

/*

CALL UndoEntityReversal

DESCRIPTION:
Reset the reversed = 1 flag if an entity has been incorrectly reversed or an
operation that depends on reversal has failed

@TODO(sfount) A generic function for either setting or un-setting this flag would
              be preferred - new financial entities would have to be added to both
              this function and to ReverseTransaction
*/
DROP PROCEDURE IF EXISTS UndoEntityReversal$$
CREATE PROCEDURE UndoEntityReversal(
  IN uuid BINARY(16)
)
BEGIN
  DECLARE isInvoice BOOLEAN;
  DECLARE isCashPayment BOOLEAN;
  DECLARE isVoucher BOOLEAN;

  SET isInvoice = (SELECT IFNULL((SELECT 1 FROM invoice WHERE invoice.uuid = uuid), 0));
  SET isVoucher = (SELECT IFNULL((SELECT 1 FROM voucher WHERE voucher.uuid = uuid), 0));

  -- avoid a scan of the cash table if we already know this is an invoice reversal
  IF NOT isInvoice THEN
    SET isCashPayment = (SELECT IFNULL((SELECT 1 FROM cash WHERE cash.uuid = uuid), 0));
  END IF;

  IF isInvoice THEN
    UPDATE invoice SET reversed = 0 WHERE invoice.uuid = uuid;
  END IF;

  -- make sure we update the cash payment that was reversed
  IF isCashPayment THEN
    UPDATE cash SET reversed = 0 WHERE cash.uuid = uuid;
  END IF;

  IF isVoucher THEN
    UPDATE voucher SET reversed = 0 where voucher.uuid = uuid;
  END IF;
END $$

/* ---------------------------------------------------------------------------- */

/*

--------
OVERVIEW
--------

This procedures section contains procedures to ensure data integrity.  It allows an
administrator to merge two locations if they have database access. No clientside
scripts currently access these procedures, but we may write a client interface
in the future.
*/


/*
CALL MergeLocations()

DESCRIPTION
This procedure merges two locations by changing all references to a single uuid.
A "location" is synonymous with a village.uuid.  The first parameter is the
village to remove, and the second is the new village uuid.  A user might want to
do this when there are duplicated locations.
*/
DROP PROCEDURE IF EXISTS MergeLocations$$
CREATE PROCEDURE MergeLocations(
  IN beforeUuid BINARY(16),
  IN afterUuid BINARY(16)
) BEGIN

  -- Go through every location in the database, replacing the location uuid with the new location uuid
  UPDATE patient SET origin_location_id = afterUuid WHERE origin_location_id = beforeUuid;
  UPDATE patient SET current_location_id = afterUuid WHERE current_location_id = beforeUuid;

  UPDATE debtor_group SET location_id = afterUuid WHERE location_id = beforeUuid;

  UPDATE enterprise SET location_id = afterUuid WHERE location_id = beforeUuid;

  -- delete the beforeUuid village and leave the afterUuid village.
  DELETE FROM village WHERE village.uuid = beforeUuid;
END $$


/* ---------------------------------------------------------------------------- */

/*

--------
OVERVIEW
--------

This section contains the logic for safeguarding the general_ledger from invalid
transaction by enforcing a series of checks, known as the Trial Balance.  The
end result is 0 or more errors returned to the client as well as a preview of
how the account balances will change once the data is transferred from the
posting_journal to the general_ledger.

Since much preprocessing is required, several temporary tables are used.  This
allows the data to enter SQL as quickly as possible and leverage INDEXes, JOINs,
and GROUP BYs as quickly as possible.

---------
SCENARIOS
---------

There are several reasons why a transaction might fail a trial balance check.
We will discuss a few of them below:

ADDING TO LOCKED FISCAL YEARS
-----------------------------
Once an accountant has approved of the end of year report, the previous fiscal
year is generally locked and balance accounts are carried forward while income
and expense accounts are zeroed out.  This operation ensures that the general
ledger will remain faithful to the last audit.

However, a user may potentially generate transactions for a previous fiscal
year.  These transactions may not be malicious in intent - some unexpected prior
invoices may need to be added after a year has been locked.  The Trial Balance
will block these invoices from being posted, requiring that the accountant
carefully review why these transactions.  If they are valid, the accountant may
unlock the fiscal year and post them.


LOCKED ACCOUNTS
---------------
An accountant may close down an account in the system for any reason - perhaps
to remove a duplication, perhaps to indicate that a client will no longer be
serviced by the hospital.  This operation can be achieved by locking the account
in the accounts management page.  If there are pending transactions, these will
be blocked from posting until a decision can be made about them.
*/


/*
CALL StageTrialBalanceTransaction()

DESCRIPTION
Copies the transaction into a staging table to be quickly operated on.
*/
DROP PROCEDURE IF EXISTS StageTrialBalanceTransaction$$
CREATE PROCEDURE StageTrialBalanceTransaction(
  IN record_uuid BINARY(16)
)
BEGIN
  CREATE TEMPORARY TABLE IF NOT EXISTS stage_trial_balance_transaction (record_uuid BINARY(16));
  INSERT INTO stage_trial_balance_transaction SET stage_trial_balance_transaction.record_uuid = record_uuid;
END $$

/*
CALL TrialBalanceErrors()

DESCRIPTION
This stored procedure validates records that are used in the Trial Balance before they are posted
to the General Ledger.  The records are run through a series of SQL queries to validate their
correctness.  The follow assertions are made:
 1. The transaction dates are within the identified period
 2. Every line has some sort of description (best practice)
 3. All affected periods are unlocked.
 4. All affected accounts are unlocked.
 5. All transactions are balanced.
 6. All transactions have at least two lines (required for double-entry accounting)
 7. All transactions with an income/expense account have a cost center.
 8. All liens with a cost center are income/expense accounts

Please be sure to stage all transactions for use via the StageTrialBalanceTransaction()
call.

SAMPLE OUTPUT
Running this query will return NULL if no errors have occurred.  If errors exist in the transaction,
the following table will be emitted.
+--------------------------------------+----------+------------------------------------------------+
| record_uuid                          | trans_id | code                                           |
+--------------------------------------+----------+------------------------------------------------+
| 666bfbbe-48d4-435e-997b-238a48760a1a | HEV39508 | POSTING_JOURNAL.ERRORS.UNBALANCED_TRANSACTIONS |
+--------------------------------------+----------+------------------------------------------------+

USAGE: CALL TrialBalanceErrors()
*/
DROP PROCEDURE IF EXISTS TrialBalanceErrors$$
CREATE PROCEDURE TrialBalanceErrors()
BEGIN
  DECLARE title_account_id INT UNSIGNED DEFAULT 6;
  DECLARE income_account_id INT UNSIGNED DEFAULT 4;
  DECLARE expense_account_id INT UNSIGNED DEFAULT 5;

  DROP TEMPORARY TABLE IF EXISTS stage_trial_balance_errors;

  -- this will hold our error cases
  CREATE TEMPORARY TABLE stage_trial_balance_errors (
    record_uuid BINARY(16),
    trans_id TEXT,
    error_description TEXT,
    code TEXT
  );

  -- check if there are any title accounts in the mix
  INSERT INTO stage_trial_balance_errors
    SELECT pj.record_uuid, MAX(pj.trans_id), CONCAT(a.number,' - ', a.label) as error_description, 'POSTING_JOURNAL.ERRORS.HAS_TITLE_ACCOUNT_BALANCE' AS code
    FROM posting_journal AS pj
      JOIN stage_trial_balance_transaction AS temp ON pj.record_uuid = temp.record_uuid
      JOIN account a ON pj.account_id = a.id
    WHERE a.type_id = title_account_id GROUP BY pj.record_uuid;

  -- check that all lines with income/expense accounts also have cost centers
  INSERT INTO stage_trial_balance_errors
    SELECT pj.record_uuid, MAX(pj.trans_id), CONCAT(a.number,' - ', a.label) as error_description, 'POSTING_JOURNAL.ERRORS.MISSING_COST_CENTER' AS code
    FROM posting_journal AS pj
      JOIN stage_trial_balance_transaction AS temp ON pj.record_uuid = temp.record_uuid
      JOIN account a ON pj.account_id = a.id
      JOIN project proj ON proj.id = pj.project_id
      JOIN enterprise e ON e.id = proj.enterprise_id
      JOIN enterprise_setting es ON es.enterprise_id = e.id AND es.enable_require_cost_center_for_posting = 1
    WHERE a.type_id IN (income_account_id, expense_account_id) AND pj.cost_center_id IS NULL
    GROUP BY pj.record_uuid;

  -- check that all lines with cost centers also concern income/expense accounts.
  INSERT INTO stage_trial_balance_errors
    SELECT pj.record_uuid, MAX(pj.trans_id), CONCAT(a.number,' - ', a.label) as error_description, 'POSTING_JOURNAL.ERRORS.INVALID_COST_CENTER' AS code
    FROM posting_journal AS pj
      JOIN stage_trial_balance_transaction AS temp ON pj.record_uuid = temp.record_uuid
      JOIN account a ON pj.account_id = a.id
      JOIN project proj ON proj.id = pj.project_id
      JOIN enterprise e ON e.id = proj.enterprise_id
      JOIN enterprise_setting es ON es.enterprise_id = e.id AND es.enable_require_cost_center_for_posting = 1
    WHERE a.type_id NOT IN (income_account_id, expense_account_id) AND pj.cost_center_id IS NOT NULL
    GROUP BY pj.record_uuid;

  -- check if dates are in the correct period
  INSERT INTO stage_trial_balance_errors
    SELECT pj.record_uuid, MAX(pj.trans_id), CONCAT(pj.trans_id, ' : ', pj.trans_date) as error_description, 'POSTING_JOURNAL.ERRORS.DATE_IN_WRONG_PERIOD' AS code
    FROM posting_journal AS pj
      JOIN stage_trial_balance_transaction AS temp ON pj.record_uuid = temp.record_uuid
      JOIN period AS p ON pj.period_id = p.id
    WHERE DATE(pj.trans_date) NOT BETWEEN DATE(p.start_date) AND DATE(p.end_date)
    GROUP BY pj.record_uuid;

  -- check to make sure that the fiscal year is not closed
  INSERT INTO stage_trial_balance_errors
    SELECT pj.record_uuid, MAX(pj.trans_id), fiscal_year.label as error_description,'POSTING_JOURNAL.ERRORS.CLOSED_FISCAL_YEAR' AS code
    FROM posting_journal AS pj JOIN stage_trial_balance_transaction AS temp
      ON pj.record_uuid = temp.record_uuid
      JOIN fiscal_year ON pj.fiscal_year_id = fiscal_year.id
    WHERE fiscal_year.locked <> 0
    GROUP BY pj.record_uuid;

  -- check to make sure that all lines of a transaction have a description
  INSERT INTO stage_trial_balance_errors
    SELECT pj.record_uuid, MAX(pj.trans_id), pj.trans_id as error_description, 'POSTING_JOURNAL.ERRORS.MISSING_DESCRIPTION' AS code
    FROM posting_journal AS pj JOIN stage_trial_balance_transaction AS temp
      ON pj.record_uuid = temp.record_uuid
    WHERE pj.description IS NULL
    GROUP BY pj.record_uuid;

  -- check that all periods are unlocked
  INSERT INTO stage_trial_balance_errors
    SELECT pj.record_uuid, MAX(pj.trans_id), CONCAT(p.start_date, ' ', p.end_date) as error_description, 'POSTING_JOURNAL.ERRORS.LOCKED_PERIOD' AS code
    FROM posting_journal AS pj JOIN stage_trial_balance_transaction AS temp
      ON pj.record_uuid = temp.record_uuid
    JOIN period p ON pj.period_id = p.id
    WHERE p.locked = 1 GROUP BY pj.record_uuid;

  -- check that there are no transactions with accounts of locked creditor groups
  INSERT INTO stage_trial_balance_errors
    SELECT pj.record_uuid, MAX(pj.trans_id), cg.name as error_description, 'POSTING_JOURNAL.ERRORS.LOCKED_CREDITOR_GROUP_ACCOUNT' AS code
    FROM posting_journal AS pj JOIN stage_trial_balance_transaction AS temp
      ON pj.record_uuid = temp.record_uuid
    JOIN creditor_group cg ON pj.account_id = cg.account_id
    WHERE cg.locked = 1 GROUP BY pj.record_uuid;

  -- check that there are no transactions with accounts of locked debtor groups
  INSERT INTO stage_trial_balance_errors
    SELECT pj.record_uuid, MAX(pj.trans_id), dg.name as error_description, 'POSTING_JOURNAL.ERRORS.LOCKED_DEBTOR_GROUP_ACCOUNT' AS code
    FROM posting_journal AS pj JOIN stage_trial_balance_transaction AS temp
      ON pj.record_uuid = temp.record_uuid
    JOIN debtor_group dg ON pj.account_id = dg.account_id
    WHERE dg.locked = 1 GROUP BY pj.record_uuid;

  -- check that all accounts are unlocked
  INSERT INTO stage_trial_balance_errors
    SELECT pj.record_uuid, MAX(pj.trans_id), CONCAT(a.number,' - ', a.label) as error_description, 'POSTING_JOURNAL.ERRORS.LOCKED_ACCOUNT' AS code
    FROM posting_journal AS pj JOIN stage_trial_balance_transaction AS temp
      ON pj.record_uuid = temp.record_uuid
    JOIN account a ON pj.account_id = a.id
    WHERE a.locked = 1 GROUP BY pj.record_uuid;

  -- check that users are active (no deactivated users)
  INSERT INTO stage_trial_balance_errors
    SELECT pj.record_uuid, MAX(pj.trans_id), u.display_name as error_description, 'POSTING_JOURNAL.ERRORS.DEACTIVATED_USER' AS code
    FROM posting_journal AS pj JOIN stage_trial_balance_transaction AS temp
      ON pj.record_uuid = temp.record_uuid
    JOIN user u ON pj.user_id = u.id
    WHERE u.deactivated = 1 GROUP BY pj.record_uuid;

  -- check that all transactions are balanced
  INSERT INTO stage_trial_balance_errors
    SELECT pj.record_uuid, MAX(pj.trans_id), pj.trans_id as error_description, 'POSTING_JOURNAL.ERRORS.UNBALANCED_TRANSACTIONS' AS code
    FROM posting_journal AS pj JOIN stage_trial_balance_transaction AS temp
      ON pj.record_uuid = temp.record_uuid
    GROUP BY pj.record_uuid
    HAVING ROUND(SUM(pj.debit_equiv), 2) <> ROUND(SUM(pj.credit_equiv), 2);

  -- check that all transactions have two or more lines
  INSERT INTO stage_trial_balance_errors
    SELECT pj.record_uuid, MAX(pj.trans_id), pj.trans_id as error_description, 'POSTING_JOURNAL.ERRORS.SINGLE_LINE_TRANSACTION' AS code
    FROM posting_journal AS pj JOIN stage_trial_balance_transaction AS temp
      ON pj.record_uuid = temp.record_uuid
    GROUP BY pj.record_uuid
    HAVING COUNT(pj.record_uuid) < 2;

  SELECT DISTINCT BUID(record_uuid) AS record_uuid, trans_id, error_description, code FROM stage_trial_balance_errors ORDER BY code, trans_id;
END $$

/*
CALL TrialBalanceSummary()

DESCRIPTION
This stored procedure produces the traditional Trial Balance table showing the account balances for any affected accounts
prior to the balance (`balance_before`), the debits to the accounts (`debit_equiv`), the credits to the accounts
(`credit_equiv`), and the proposed balances at the end of the operation (`balance_final`).  It should be used before
posting to the General Ledger to ensure that all transactions are correctly processed.

To use this method, a Trial Balance must first be _staged_.  The application expects that the record_uuids of all
transactions are already placed in the stage_trial_balance_transaction table via a call to
StageTrialBalanceTransaction().

SAMPLE OUTPUT
Running this a table with the following type:
+------------+--------+----------------------+----------------+-------------+--------------+----------------+
| account_id | number | label                | balance_before | debit_equiv | credit_equiv | balance_final  |
+------------+--------+----------------------+----------------+-------------+--------------+----------------+
|       3880 | 411900 | Patients Payant Cash | -22554880.0000 |  12250.0000 |   29100.0000 | -22571730.0000 |
|       3734 | 570001 | Petite Caisse (FC)   |   3331350.0000 |  29100.0000 |       0.0000 |   3360450.0000 |
|       3704 | 700100 | Pharmacie d’usage    |  -2516075.0000 |  17250.0000 |       0.0000 |  -2498825.0000 |
|       3886 | 700102 | Medicaments          | -23284054.9000 |      0.0000 |   29000.0000 | -23313054.9000 |
|       3887 | 700201 | Fiches               |   -497600.0000 |      0.0000 |     500.0000 |   -498100.0000 |
+------------+--------+----------------------+----------------+-------------+--------------+----------------+


USAGE: CALL TrialBalanceSummary()
*/
--
DROP PROCEDURE IF EXISTS TrialBalanceSummary$$
CREATE PROCEDURE TrialBalanceSummary()
BEGIN
  -- this assumes lines have been staged using CALL StageTrialBalanceTransaction()

  -- fiscal year to limit period_total search
  DECLARE fiscalYearId MEDIUMINT;

  DROP TEMPORARY TABLE IF EXISTS staged_account;
  DROP TEMPORARY TABLE IF EXISTS before_totals;

  -- get the fiscal year of the oldest record to limit period_total search
  SET fiscalYearId = (
    SELECT MIN(fiscal_year_id)
    FROM posting_journal JOIN stage_trial_balance_transaction
      ON posting_journal.record_uuid = stage_trial_balance_transaction.record_uuid
  );

  -- gather the staged accounts
  CREATE TEMPORARY TABLE IF NOT EXISTS staged_accounts AS
    SELECT DISTINCT account_id FROM posting_journal JOIN stage_trial_balance_transaction
    ON posting_journal.record_uuid = stage_trial_balance_transaction.record_uuid;

  -- gather the beginning period_totals
  CREATE TEMPORARY TABLE before_totals AS
    SELECT u.account_id, IFNULL(SUM(totals.debit - totals.credit), 0) AS balance_before
    FROM staged_accounts as u
    LEFT JOIN (
      SELECT account_id, debit, credit FROM period_total
      WHERE period_total.fiscal_year_id = fiscalYearId
    ) totals ON u.account_id = totals.account_id
    GROUP BY u.account_id;

  SELECT account_id, account.number AS number, account.label AS label, account.type_id,
    balance_before, debit_equiv, credit_equiv,
    balance_before + debit_equiv - credit_equiv AS balance_final
  FROM (
    SELECT posting_journal.account_id, MAX(totals.balance_before) AS balance_before, SUM(debit_equiv) AS debit_equiv,
      SUM(credit_equiv) AS credit_equiv
    FROM posting_journal JOIN before_totals as totals
    ON posting_journal.account_id = totals.account_id
    WHERE posting_journal.record_uuid IN (
      SELECT record_uuid FROM stage_trial_balance_transaction
    ) GROUP BY posting_journal.account_id
  ) AS combined
  JOIN account ON account.id = combined.account_id
  ORDER BY account.number;
END $$

/*
PostToGeneralLedger()

This procedure uses the same staging code as the Trial Balance to stage and then post transactions
from the posting_journal table to the General Ledger table.

*/
DROP PROCEDURE IF EXISTS PostToGeneralLedger$$
CREATE PROCEDURE PostToGeneralLedger()
BEGIN

  DECLARE isInvoice, isCash, isVoucher INT;

  -- write into the posting journal
  INSERT INTO general_ledger (
    project_id, uuid, fiscal_year_id, period_id, trans_id, trans_id_reference_number, trans_date,
    record_uuid, description, account_id, debit, credit, debit_equiv,
    credit_equiv, currency_id, entity_uuid, reference_uuid, comment, transaction_type_id, cost_center_id, user_id
  ) SELECT project_id, uuid, fiscal_year_id, period_id, trans_id, trans_id_reference_number, trans_date, posting_journal.record_uuid,
    description, account_id, debit, credit, debit_equiv, credit_equiv, currency_id,
    entity_uuid, reference_uuid, comment, transaction_type_id, cost_center_id, user_id
  FROM posting_journal JOIN stage_trial_balance_transaction AS staged
    ON posting_journal.record_uuid = staged.record_uuid;

  -- write into period_total
  INSERT INTO period_total (
    account_id, credit, debit, fiscal_year_id, enterprise_id, period_id
  )
  SELECT account_id, SUM(credit_equiv) AS credit, SUM(debit_equiv) as debit,
    fiscal_year_id, project.enterprise_id, period_id
  FROM posting_journal JOIN stage_trial_balance_transaction JOIN project
    ON posting_journal.record_uuid = stage_trial_balance_transaction.record_uuid
    AND project_id = project.id
  GROUP BY fiscal_year_id, period_id, account_id
  ON DUPLICATE KEY UPDATE credit = credit + VALUES(credit), debit = debit + VALUES(debit);

  -- write into cost_center_aggregate
  INSERT INTO cost_center_aggregate (
    period_id, debit, credit, cost_center_id
  )
  SELECT period_id, SUM(debit_equiv) AS debit, SUM(credit_equiv) AS credit, cost_center_id
  FROM posting_journal
  WHERE cost_center_id IS NOT NULL
  GROUP BY period_id, cost_center_id
  ON DUPLICATE KEY UPDATE credit = credit + VALUES(credit), debit = debit + VALUES(debit);

  -- remove from posting journal
  DELETE FROM posting_journal WHERE record_uuid IN (SELECT record_uuid FROM stage_trial_balance_transaction);

  -- Let specify that this invoice or the cash payment is posted
  SELECT COUNT(uuid) INTO isInvoice  FROM invoice  WHERE invoice.uuid IN (SELECT record_uuid FROM stage_trial_balance_transaction);
  SELECT COUNT(uuid) INTO isCash  FROM cash  WHERE cash.uuid IN (SELECT record_uuid FROM stage_trial_balance_transaction);
  SELECT COUNT(uuid) INTO isVoucher  FROM voucher  WHERE voucher.uuid IN (SELECT record_uuid FROM stage_trial_balance_transaction);

  -- NOTE(@jniles): DO NOT OPTIMIZE THESE QUERIES.
  -- NOTE(@jniles): these queries look funny, like they could be optimized.  DO NOT DO IT.  They are purposefully nested
  -- to defeat MySQL8's _really smart_ query optimizer that optimizes them into an invalid query that crashes the posting
  -- proceedure.

  IF isInvoice > 0 THEN
    UPDATE invoice SET posted = 1 WHERE uuid IN (SELECT z.record_uuid FROM (SELECT record_uuid FROM stage_trial_balance_transaction) AS z);
  END IF;

  IF isCash > 0 THEN
    UPDATE cash SET posted = 1 WHERE uuid IN (SELECT z.record_uuid FROM (SELECT record_uuid FROM stage_trial_balance_transaction) AS z);
  END IF;

  IF isVoucher > 0 THEN
    UPDATE voucher SET posted = 1 WHERE uuid IN (SELECT z.record_uuid FROM (SELECT record_uuid FROM stage_trial_balance_transaction) AS z);
  END IF;

END $$

-- post stock movement into vouchers
DROP PROCEDURE IF EXISTS PostStockMovement$$
CREATE PROCEDURE PostStockMovement (
  IN documentUuid BINARY(16),
  IN isExit TINYINT(1),
  IN projectId SMALLINT(5)
)
BEGIN
  -- voucher
  DECLARE voucher_uuid BINARY(16);
  DECLARE voucher_date DATETIME;
  DECLARE voucher_project_id SMALLINT(5);
  DECLARE voucher_currency_id SMALLINT(5);
  DECLARE voucher_user_id SMALLINT(5);
  DECLARE voucher_type_id SMALLINT(3);
  DECLARE voucher_description TEXT;
  DECLARE voucher_amount DECIMAL(19, 4);

  DECLARE currencyId TINYINT(3) UNSIGNED;

  -- voucher item
  DECLARE voucher_item_uuid BINARY(16);
  DECLARE voucher_item_account INT(10);
  DECLARE voucher_item_account_debit DECIMAL(19, 4);
  DECLARE voucher_item_account_credit DECIMAL(19, 4);
  DECLARE voucher_item_voucher_uuid BINARY(16);
  DECLARE voucher_item_document_uuid BINARY(16);
  DECLARE voucher_item_cost_center_id MEDIUMINT(8);

  -- variables
  DECLARE v_stock_account INT(10);
  DECLARE v_cogs_account INT(10);
  DECLARE v_unit_cost DECIMAL(19, 4);
  DECLARE v_quantity INT(11);
  DECLARE v_document_uuid BINARY(16);
  DECLARE v_is_exit TINYINT(1);
  DECLARE v_item_description TEXT;

  DECLARE sm_flux_id INT(11);
  DECLARE ss_enable_supplier_credit TINYINT(1) DEFAULT 0;
  DECLARE FROM_PURCHASE_FLUX_ID INT(11) DEFAULT 1;
  DECLARE TO_PATIENT_FLUX_ID INT(11) DEFAULT 9;
  DECLARE TO_SERVICE_FLUX_ID INT(11) DEFAULT 10;
  DECLARE TO_LOSS_FLUX_ID INT(11) DEFAULT 11;

  -- transaction type
  DECLARE STOCK_EXIT_TYPE SMALLINT(5) DEFAULT 13;
  DECLARE STOCK_ENTRY_TYPE SMALLINT(5) DEFAULT 14;

  -- variables for checking invalid accounts
  DECLARE ERR_INVALID_INVENTORY_ACCOUNTS CONDITION FOR SQLSTATE '45006';
  DECLARE v_has_invalid_accounts SMALLINT(5);

  -- cursor declaration
  DECLARE v_finished INTEGER DEFAULT 0;

  DECLARE stage_stock_movement_cursor CURSOR FOR
    SELECT temp.stock_account, temp.cogs_account, temp.unit_cost, temp.quantity, temp.document_uuid, temp.is_exit, temp.item_description
  FROM stage_stock_movement as temp;

  -- variables for the cursor
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_finished = 1;

  -- set the currencyId from the enterprise's currencyId
  SELECT e.currency_id INTO currencyId
    FROM enterprise AS e JOIN project AS p ON e.id = p.enterprise_id
    WHERE p.id = projectId;

  -- Check that every inventory has a stock account and a variation account
  -- if they do not, the transaction will be unbalanced, so the operation will not continue
  SELECT COUNT(l.uuid)
    INTO v_has_invalid_accounts
  FROM stock_movement AS sm
  JOIN lot l ON l.uuid = sm.lot_uuid
  JOIN inventory i ON i.uuid = l.inventory_uuid
  JOIN inventory_group ig ON ig.uuid = i.group_uuid
  WHERE ig.stock_account IS NULL AND ig.cogs_account IS NULL AND sm.document_uuid = documentUuid AND sm.is_exit = isExit;

  IF (v_has_invalid_accounts > 0) THEN
    SIGNAL ERR_INVALID_INVENTORY_ACCOUNTS SET MESSAGE_TEXT = 'Every inventory should belong to a group with a COGS account and stock account.';
  END IF;

  -- temporary table for the stock movement
  CREATE TEMPORARY TABLE stage_stock_movement (
      SELECT
        projectId as project_id, currencyId as currency_id,
        CONCAT(ig.name, ' - ', m.quantity, ' ', iu.text, ' of ', i.text , ' (', l.label, ')') AS item_description,
        m.uuid, m.description, m.date, m.flux_id, m.is_exit, m.document_uuid, m.quantity, m.unit_cost, m.user_id,
        ig.cogs_account, ig.stock_account, m.invoice_uuid, m.entity_uuid
      FROM stock_movement m
      JOIN depot d ON d.uuid = m.depot_uuid
      JOIN lot l ON l.uuid = m.lot_uuid
      JOIN inventory i ON i.uuid = l.inventory_uuid
      JOIN inventory_unit iu ON iu.id = i.unit_id
      JOIN inventory_group ig
        ON ig.uuid = i.group_uuid AND (ig.stock_account IS NOT NULL AND ig.cogs_account IS NOT NULL)
      WHERE m.document_uuid = documentUuid AND m.is_exit = isExit
    );

  -- define voucher variables
  SELECT HUID(UUID()), date, project_id, currency_id, user_id, description, SUM(unit_cost * quantity)
    INTO voucher_uuid, voucher_date, voucher_project_id, voucher_currency_id, voucher_user_id, voucher_description, voucher_amount
  FROM stage_stock_movement;

  IF (isExit = 1) THEN
    SET voucher_type_id = STOCK_EXIT_TYPE;
  ELSE
    SET voucher_type_id = STOCK_ENTRY_TYPE;
  END IF;

  -- get the flux id
  SET sm_flux_id = (SELECT flux_id FROM stock_movement WHERE document_uuid = documentUuid AND is_exit = isExit LIMIT 1);

  -- check if enable_supplier_credit is set for this enterprise
  SET ss_enable_supplier_credit = (
    SELECT enable_supplier_credit FROM stock_setting AS es
      JOIN enterprise AS e ON e.id = es.enterprise_id
      JOIN project AS p ON e.id = p.enterprise_id
    WHERE p.id = projectId
  );

  -- if this is from a purchase, grap the supplier's account as the account to credit in the voucher, not
  -- the COGS account
  IF (sm_flux_id = FROM_PURCHASE_FLUX_ID AND ss_enable_supplier_credit = 1) THEN
    SET voucher_item_account_credit = (
      SELECT creditor_group.account_id FROM purchase
        JOIN supplier ON purchase.supplier_uuid = supplier.uuid
        JOIN creditor ON supplier.creditor_uuid = creditor.uuid
        JOIN creditor_group ON creditor_group.uuid = creditor.group_uuid
      WHERE purchase.uuid IN (
        SELECT entity_uuid FROM stock_movement WHERE document_uuid = documentUuid AND is_exit = isExit
      )
    );
  END IF;

  /* EXIT TO PATIENT : get cost_center_id */
  IF (sm_flux_id = TO_PATIENT_FLUX_ID AND isExit = 1) THEN
    SET voucher_item_cost_center_id = (
      SELECT GetCostCenterByInvoiceUuid(invoice_uuid) FROM stage_stock_movement
      WHERE invoice_uuid IS NOT NULL
      LIMIT 1
    );
  END IF;

  /* EXIT TO SERVICE : get cost_center_id */
  IF (sm_flux_id = TO_SERVICE_FLUX_ID AND isExit = 1) THEN
    SET voucher_item_cost_center_id = (
      SELECT GetCostCenterByServiceUuid(sm.entity_uuid) FROM stage_stock_movement sm
      JOIN service s ON s.uuid = sm.entity_uuid
      WHERE sm.entity_uuid IS NOT NULL
      LIMIT 1
    );
  END IF;

  /* EXIT TO LOSS : get cost_center_id */
  IF (sm_flux_id = TO_LOSS_FLUX_ID AND isExit = 1) THEN
    SET voucher_item_cost_center_id = (
      SELECT default_cost_center_for_loss FROM stock_setting LIMIT 1
    );
  END IF;

  -- insert into voucher
  INSERT INTO voucher (uuid, date, project_id, currency_id, user_id, type_id, description, amount) VALUES (
    voucher_uuid, voucher_date, voucher_project_id, voucher_currency_id, voucher_user_id,
    voucher_type_id, voucher_description, voucher_amount
  );

  -- handle voucher items via cursor
  OPEN stage_stock_movement_cursor;

  -- create a temporary table for voucher credit items
  CREATE TEMPORARY TABLE tmp_voucher_credit_item (
    `account_id`      INT UNSIGNED NOT NULL,
    `debit`           DECIMAL(19,4) UNSIGNED NOT NULL DEFAULT 0.0000,
    `credit`          DECIMAL(19,4) UNSIGNED NOT NULL DEFAULT 0.0000
  );

  -- loop in the cursor
  insert_voucher_item : LOOP
    FETCH stage_stock_movement_cursor INTO v_stock_account, v_cogs_account, v_unit_cost, v_quantity, v_document_uuid, v_is_exit, v_item_description;

    IF v_finished = 1 THEN
      LEAVE insert_voucher_item;
    END IF;

    if (v_is_exit = 1) THEN
      SET voucher_item_account_debit = v_cogs_account;
      SET voucher_item_account_credit = v_stock_account;
    ELSEIF (sm_flux_id = FROM_PURCHASE_FLUX_ID AND ss_enable_supplier_credit = 1) THEN
      -- we already set the credit account above for the purchase case
      SET voucher_item_account_debit = v_stock_account;
    ELSE
      SET voucher_item_account_debit = v_stock_account;
      SET voucher_item_account_credit = v_cogs_account;
    END IF;

    -- insert debit
    -- insert cost center id only for debit (exploitation account in case of stock exit)
    INSERT INTO voucher_item (uuid, account_id, debit, credit, voucher_uuid, document_uuid, description, cost_center_id)
      VALUES (HUID(UUID()), voucher_item_account_debit, (v_unit_cost * v_quantity), 0, voucher_uuid, v_document_uuid, v_item_description, voucher_item_cost_center_id);

    -- insert credit into temporary table for later aggregation.
    INSERT INTO tmp_voucher_credit_item (account_id, debit, credit)
      VALUES (voucher_item_account_credit, 0, (v_unit_cost * v_quantity));

  END LOOP insert_voucher_item;

  -- write the credit lines
  INSERT INTO voucher_item (uuid, account_id, debit, credit, voucher_uuid, document_uuid, description)
    SELECT HUID(UUID()), tmp_v.account_id, SUM(tmp_v.debit), SUM(tmp_v.credit), voucher_uuid, documentUuid, voucher_description
    FROM tmp_voucher_credit_item AS tmp_v
    GROUP BY tmp_v.account_id;

  -- close the cursor
  CLOSE stage_stock_movement_cursor;

  -- drop the stage tabel
  DROP TEMPORARY TABLE stage_stock_movement;
  DROP TEMPORARY TABLE tmp_voucher_credit_item;

  -- post voucher into journal
  CALL PostVoucher(voucher_uuid);
END $$

/* ---------------------------------------------------------------------------- */

/*

This section contains procedures for stock management in BHIMA.

---------------------------------------------------
Import Stock Procedure
---------------------------------------------------

*/
DROP PROCEDURE IF EXISTS ImportStock$$
CREATE PROCEDURE ImportStock (
  IN operationDate DATE,
  IN enterpriseId SMALLINT(5),
  IN projectId SMALLINT(5),
  IN userId SMALLINT(5),
  IN depotUuid BINARY(16),
  IN documentUuid BINARY(16),
  IN inventoryGroupName VARCHAR(100),
  IN inventoryCode VARCHAR(30),
  IN inventoryText VARCHAR(100),
  IN inventoryType VARCHAR(30),
  IN inventoryUnit VARCHAR(30),
  IN inventoryUnitCost DECIMAL(18, 4),
  IN inventoryCmm DECIMAL(10, 4),
  IN inventoryConsumable TINYINT(1),
  IN inventoryIsAsset TINYINT(1),
  IN inventoryBrand TEXT,
  IN inventoryModel TEXT,
  IN stockLotLabel VARCHAR(191),
  IN stockLotQuantity INT(11),
  IN stockLotExpiration DATE,
  IN stockSerialNumber VARCHAR(40),
  IN stockAcquisitionDate DATE,
  IN inventoryDepreciationRate DECIMAL(18, 4),
  IN periodId MEDIUMINT(8)
)
BEGIN
  DECLARE existInventory TINYINT(1);
  DECLARE existLot TINYINT(1);

  DECLARE inventoryUuid BINARY(16);
  DECLARE lotUuid BINARY(16);
  DECLARE fluxId INT(11);

  /*
    =======================================================================
    check if the inventory exists
    =======================================================================

    if the inventory exists we will use it, if not we will create a new one
  */
  SET existInventory = (SELECT IF((SELECT COUNT(`text`) AS total FROM `inventory` WHERE `text` = inventoryText) > 0, 1, 0));

  IF (existInventory = 1) THEN

    /* the inventory exists so we have to get its uuid (inventoryUuid) for using it */
    SELECT inventory.uuid, inventory.code INTO inventoryUuid, inventoryCode FROM inventory WHERE `text` = inventoryText LIMIT 1;

  ELSE

    /* the inventory doesn't exists so we have to create a new one */
    IF (inventoryCode = NULL OR inventoryCode = '' OR inventoryCode = 'NULL') THEN

      /* if the inventory code is missing, create a new one randomly */
      SET inventoryCode = (SELECT ROUND(RAND() * 10000000));

    END IF;

    /* call the procedure ImportInventory for creating a new inventory and its dependencies */
    CALL ImportInventory(enterpriseId, inventoryGroupName, inventoryCode, inventoryText, inventoryType, inventoryUnit, inventoryUnitCost,
                         inventoryConsumable, inventoryIsAsset, inventoryDepreciationRate, inventoryBrand, inventoryModel, '');

    /* set the inventory uuid */
    SET inventoryUuid = (SELECT `uuid` FROM inventory WHERE `text` = inventoryText OR `code` = inventoryCode LIMIT 1);

  END IF;

  /* continue only if inventoryUuid is defined */
  IF (inventoryUuid IS NOT NULL) THEN

    /*
      =======================================================================
      check if the lot exists in the depot
      =======================================================================

      if the lot exists we will use it, if not we will create a new one
    */
    SET existLot = (SELECT IF((SELECT COUNT(*) AS total FROM `stock_movement` JOIN `lot` ON `lot`.`uuid` = `stock_movement`.`lot_uuid` WHERE `stock_movement`.`depot_uuid` = depotUuid AND `lot`.`inventory_uuid` = inventoryUuid AND `lot`.`label` = stockLotLabel) > 0, 1, 0));

    IF (existLot = 1) THEN

      /* if the lot exist use its uuid */
      SET lotUuid = (SELECT `stock_movement`.`lot_uuid` FROM `stock_movement` JOIN `lot` ON `lot`.`uuid` = `stock_movement`.`lot_uuid` WHERE `stock_movement`.`depot_uuid` = depotUuid AND `lot`.`inventory_uuid` = inventoryUuid AND `lot`.`label` = stockLotLabel LIMIT 1);

    ELSE

      /* create the lot */
      SET lotUuid = HUID(UUID());
      INSERT INTO lot (`uuid`, `label`, `quantity`, `unit_cost`, `expiration_date`, `inventory_uuid`, `serial_number`, `acquisition_date`)
      VALUES (lotUuid, stockLotLabel, stockLotQuantity, inventoryUnitCost, DATE(stockLotExpiration), inventoryUuid, stockSerialNumber, DATE(stockAcquisitionDate));

    END IF;

    /* create the stock movement */
    /* 13 is the id of integration flux */
    SET fluxId = 13;
    INSERT INTO stock_movement (`uuid`, `document_uuid`, `depot_uuid`, `lot_uuid`, `flux_id`, `date`, `quantity`, `unit_cost`, `is_exit`, `user_id`, `period_id`)
    VALUES (HUID(UUID()), documentUuid, depotUuid, lotUuid, fluxId, DATE(operationDate), stockLotQuantity, inventoryUnitCost, 0, userId, periodId);

  END IF;

  /* Update the stock_value table */
  CALL ComputeInventoryStockValue(inventoryUuid, NOW());

END $$

/*
CALL StageInventoryForAMC(inventoryUuid)

DESCRIPTION
This procedure adds an inventory uuid to a temporary table for later use in the
ComputeStockStatus() stored procedure.  The idea is to allow the database to use a
JOIN to group the calculation upon the stock_movement table.

*/
DROP PROCEDURE IF EXISTS StageInventoryForAMC$$
CREATE PROCEDURE StageInventoryForAMC(
  IN _inventory_uuid BINARY(16)
) BEGIN
  CREATE TEMPORARY TABLE IF NOT EXISTS stage_inventory_for_amc (inventory_uuid BINARY(16) NOT NULL);
  INSERT INTO stage_inventory_for_amc SET stage_inventory_for_amc.inventory_uuid = _inventory_uuid;
END $$

DROP PROCEDURE IF EXISTS ComputeStockStatusForStagedInventory$$
CREATE PROCEDURE ComputeStockStatusForStagedInventory(
  IN _start_date DATE,
  IN _depot_uuid BINARY(16)
) BEGIN
  DECLARE TO_DEPOT INTEGER DEFAULT 8;
  DECLARE TO_PATIENT INTEGER DEFAULT 9;
  DECLARE TO_SERVICE INTEGER DEFAULT 10;
  DECLARE TO_AGGREGATE_CONSUMPTION INTEGER DEFAULT 16;

  /*
    Creates a temporary table of stock movements for the depot, inventory items, and time frame under consideration.
    The purpose of this table is to classify movements by "is_consumption", using the following logic:
      - if the movement is an exit from a warehouse, it is a consumption if and only if it is to a depot, patient, or serivce
      - else if the movement is an exit from a depot, it is a consumption if and only if it is to a patient or service
      - else it is not a consumption

    This allows us to easily SUM/GROUP on this logic in future tables.  This is essentially a raw copy of the stock_movement table

    TODO(@jniles): I think we can actually completely do away with this table by combining it into the following query.  But it would
    be rather hard to read.  This is a TODO for a future optimisation.
  */
  CREATE TEMPORARY TABLE stock_movement_grp AS
    SELECT DATE(sm.date) as date, l.inventory_uuid, sm.depot_uuid, sm.quantity, is_exit, flux_id,
      CASE
        WHEN d.is_warehouse AND flux_id IN (TO_DEPOT, TO_PATIENT, TO_SERVICE, TO_AGGREGATE_CONSUMPTION) THEN TRUE
        WHEN flux_id IN (TO_PATIENT, TO_SERVICE, TO_AGGREGATE_CONSUMPTION) THEN TRUE
        ELSE FALSE
      END AS is_consumption
    FROM stage_inventory_for_amc AS tmp
      JOIN lot AS l ON tmp.inventory_uuid = l.inventory_uuid
      JOIN stock_movement AS sm ON l.uuid = sm.lot_uuid
      JOIN depot d ON sm.depot_uuid = d.uuid
    WHERE sm.depot_uuid = _depot_uuid AND DATE(sm.date) >= DATE(_start_date);

    /*
      Creates a temporary table of the stock_movements grouped by day.  This allows us to get daily
      SUMs for movements.  Using the previous table (stock_movement_grp), we are able to aggregate:
        - quantity - the daily increase/decrease of stock for that inventory/depot combo.
        - in_quantity - the daily amount of stock entering the depot
        - out_quantity_consumption - the daily amount of stock exiting the depot as consumptions
        - out_quantity_exit - the daily amount of stock exiting by all other non-consumption means

      At this point, we should have unique dates.  At this point, we have everything for the stock_movement_status
      table except the running balances.  Everything beyond this point is to set up the running balances.
    */
    CREATE TEMPORARY TABLE tmp_sms AS
      SELECT date, depot_uuid, inventory_uuid,
        SUM(IF(is_exit, -1 * quantity, quantity)) as quantity,
        SUM(IF(NOT is_exit, quantity, 0)) as in_quantity,
        SUM(IF(is_exit AND is_consumption, quantity, 0)) as out_quantity_consumption,
        SUM(IF(is_exit AND NOT is_consumption, quantity, 0)) as out_quantity_exit
      FROM stock_movement_grp
      GROUP BY date, depot_uuid, inventory_uuid
      ORDER BY date;

    -- we no longer need this table
    DROP TEMPORARY TABLE stock_movement_grp;

    -- clone the temporary table to prevent self-referencing issues in temporary tables
    -- https://dev.mysql.com/doc/refman/5.7/en/temporary-table-problems.html
    CREATE TEMPORARY TABLE tmp_sms_cp AS SELECT * FROM tmp_sms;

    /*
      Creates a temporary table of running totals for the date range in question.  We still
      don't have opening balances though, so this is only half way there.
    */
    CREATE TEMPORARY TABLE tmp_grouped AS
    SELECT date, depot_uuid, inventory_uuid,
      quantity AS quantity,
      in_quantity AS in_quantity,
      out_quantity_consumption AS out_quantity_consumption,
      out_quantity_exit as out_quantity_exit,
      SUM(sum_quantity) AS sum_quantity,
      SUM(sum_in_quantity) AS sum_in_quantity,
      SUM(sum_out_quantity_consumption) AS sum_out_quantity_consumption,
      SUM(sum_out_quantity_exit) as sum_out_quantity_exit
    FROM (
      SELECT t1.date, t1.depot_uuid, t1.inventory_uuid,
      t1.quantity, -- current balances
      t1.in_quantity,
      t1.out_quantity_consumption,
      t1.out_quantity_exit,
      IFNULL(t2.quantity, 0) AS sum_quantity, -- running balances
      IFNULL(t2.in_quantity, 0) AS sum_in_quantity,
      IFNULL(t2.out_quantity_consumption, 0) AS sum_out_quantity_consumption,
      IFNULL(t2.out_quantity_exit, 0) AS sum_out_quantity_exit
      FROM tmp_sms t1 JOIN tmp_sms_cp t2 WHERE
        t2.date <= t1.date AND
        t1.inventory_uuid = t2.inventory_uuid AND
        t1.depot_uuid = t2.depot_uuid
      ORDER BY t1.date
    )z
    GROUP BY date, depot_uuid, inventory_uuid
    ORDER BY date;

    -- clean up temporary tables
    DROP TEMPORARY TABLE tmp_sms;
    DROP TEMPORARY TABLE tmp_sms_cp;

    -- remove all rows from stock_movement_status that will need to be recomputed.
    DELETE sms FROM stock_movement_status AS sms
      JOIN stage_inventory_for_amc AS staged ON sms.inventory_uuid = staged.inventory_uuid
    WHERE sms.date >= DATE(_start_date) AND sms.depot_uuid = _depot_uuid;

    -- get the max date from the stock_movement_status table (remember, we deleted the invalidated rows above)
    -- to look up the opening balances with.
    CREATE TEMPORARY TABLE tmp_max_dates AS
      SELECT sms.inventory_uuid, MAX(date) AS max_date FROM stage_inventory_for_amc AS staged LEFT JOIN stock_movement_status AS sms
        ON staged.inventory_uuid = sms.inventory_uuid
        WHERE sms.depot_uuid = _depot_uuid
        GROUP BY staged.inventory_uuid;

    -- now get the "opening balances" based on the date.  I think this needs to be two queries because one cannot
    -- reuse an SQL query with a temporary tabel. But we may be able to optimize it down the road.
    CREATE TEMPORARY TABLE tmp_max_values AS
      SELECT sms.inventory_uuid, tmd.max_date, sms.sum_quantity, sms.sum_in_quantity, sms.sum_out_quantity_exit, sum_out_quantity_consumption
      FROM stock_movement_status AS sms JOIN tmp_max_dates AS tmd ON
        sms.inventory_uuid = tmd.inventory_uuid AND tmd.max_date = sms.date
      WHERE sms.depot_uuid = _depot_uuid
      GROUP BY sms.inventory_uuid, sms.date;

    -- we don't need to know those max dates anymore
    DROP TEMPORARY TABLE tmp_max_dates;

    -- copy all staged records into stock_movement_status, including the opening balances!
    -- NOTE(@jniles) - we are going to need a second pass to caluclate the duration.  Maybe there is a better way?
    INSERT INTO stock_movement_status
      SELECT tg.depot_uuid, tg.inventory_uuid, tg.date,
        tg.quantity AS quantity_delta,
        tg.in_quantity,
        tg.out_quantity_exit,
        tg.out_quantity_consumption,

        -- these gnarly SQL queries just get the current sum, the current values of this movement, and the beginning balances
        tg.sum_quantity + IFNULL(tmv.sum_quantity, 0),
        tg.sum_in_quantity + IFNULL(tmv.sum_in_quantity, 0),
        tg.sum_out_quantity_exit + IFNULL(tmv.sum_out_quantity_exit, 0),
        tg.sum_out_quantity_consumption + IFNULL(tmv.sum_out_quantity_consumption, 0),
        0 AS duration
      FROM tmp_grouped AS tg LEFT JOIN tmp_max_values AS tmv
        ON tg.inventory_uuid = tmv.inventory_uuid;

    DROP TEMPORARY TABLE tmp_max_values;
    DROP TEMPORARY TABLE tmp_grouped;

    -- create a temporary table pointing to the next record
    CREATE TEMPORARY TABLE tmp_next_sms AS
      SELECT
        sms.inventory_uuid,
        sms.date,
        (SELECT next.date FROM stock_movement_status AS next
          WHERE next.inventory_uuid = sms.inventory_uuid
            AND next.depot_uuid = sms.depot_uuid
            AND next.date > sms.date
          ORDER BY next.date ASC
          LIMIT 1
        ) AS next_date
      FROM stock_movement_status AS sms
      JOIN stage_inventory_for_amc AS staged
        ON staged.inventory_uuid = sms.inventory_uuid
      WHERE sms.depot_uuid = _depot_uuid
        AND sms.date >= _start_date;

    DROP TEMPORARY TABLE stage_inventory_for_amc;

    -- finally, update the durations for this inventory_uuid/depot_uuid combo
    -- TODO(@jniles): can we do this at the same time as another query above?
    -- TODO(@jniles): investigate the performance of this query
    -- NOTE(@jniles): the final record will always have a duration of "0".  It should be the only record with a duration of "0".
    UPDATE stock_movement_status AS sms
      JOIN tmp_next_sms AS next
        ON sms.inventory_uuid = next.inventory_uuid
          AND sms.date = next.date
    SET sms.duration = IFNULL(DATEDIFF(next.next_date, next.date), 0)
    WHERE sms.depot_uuid = _depot_uuid;

    DROP TEMPORARY TABLE tmp_next_sms;

    /*
      We are done. We've removed, then recreated, all data in the stock_movement_status table
      corresponding to the depot_uuid and inventory_uuids from the start date on (including the
      start date).  We've also computed the duration between each row and the subsequent row.
    */
END $$


DROP PROCEDURE IF EXISTS GetAMC$$
CREATE PROCEDURE GetAMC(
  IN _date DATE, /* what date the user wants to know the AMC for */
  IN _depot_uuid BINARY(16), /* the depot for the AMC */
  IN _inventory_uuid BINARY(16) /* the inventory for the AMC */
) BEGIN

  DECLARE _start_date,
          _min_date,
          _max_date DATE;

  DECLARE _sum_consumed_quantity,
          _sum_exit_quantity,
          _last_quantity,
          _initial_quantity DECIMAL(19,4);

  DECLARE _sum_stock_day,
          _sum_consumption_day,
          _sum_stock_out_day,
          _sum_day,
          _number_of_month,
          _head_days,
          _tail_days INTEGER;

  DECLARE _algo_def,
          _algo_msh DECIMAL(19,4);

  -- NOTE(@jniles): I am ignoring the enterprise_id for ease of use.  For full correctness,
  -- we will need to pass in the enteprise_id.  However, we always only have a single enterprise
  -- in production, so this works for now.
  SELECT
    ss.month_average_consumption,
    DATE_SUB(_date, INTERVAL ss.month_average_consumption MONTH)
  INTO
    _number_of_month,
    _start_date
  FROM stock_setting AS ss LIMIT 1;

  SELECT
    SUM(IF(sms.sum_quantity <= 0, sms.duration, 0)),
    SUM(IF(sms.sum_quantity > 0, sms.duration, 0)),
    SUM(IF(sms.out_quantity_consumption != 0, 1, 0)),
    MIN(sms.date),
    MAX(sms.date),

    -- NOTE(@jniles): sum_* fields are monotonically increasing, so the MAX is the last,
    -- MIN is the first
    MAX(sms.sum_out_quantity_consumption) - MIN(sms.sum_out_quantity_consumption),
    MAX(sms.sum_out_quantity_exit) - MIN(sms.sum_out_quantity_exit)

  INTO
    _sum_stock_out_day,
    _sum_stock_day,
    _sum_consumption_day,
    _min_date,
    _max_date,
    _sum_consumed_quantity,
    _sum_exit_quantity
  FROM stock_movement_status AS sms WHERE
    sms.date >=_start_date AND
    sms.date <= _date AND
    sms.depot_uuid = _depot_uuid AND
    sms.inventory_uuid = _inventory_uuid;

  -- account for the "tail"
  -- the "tail" (number of days since final record until today) will not be included in either
  -- _sum_stock_out_day or _sum_stock_day, since duration is always 0 for the last record.  Here
  -- we check what condition we are in to figure out if the tail
  SELECT sms.sum_quantity INTO _last_quantity FROM stock_movement_status AS sms WHERE
      sms.date = _max_date AND
      sms.inventory_uuid = _inventory_uuid AND
      sms.depot_uuid = _depot_uuid;

  SELECT DATEDIFF(_date, _max_date) INTO _tail_days;

  IF (_last_quantity = 0) THEN
    -- ended in a stock out.  Add the "tail" to the days of stock outs
    SELECT _sum_stock_out_day + _tail_days INTO _sum_stock_out_day;
  ELSE
    -- ended with stock.  Add the "tail" to the days of stock
    SELECT _sum_stock_day + _tail_days INTO _sum_stock_day;
  END IF;

  -- account for the "head"
  -- the "head" (number of days before the first record captured in this range) needs to be considered
  -- separately, since it won't be picked up by the above query.  We just need to know if we were in stock
  -- out or had stock at the beginning of our window of time.
  -- NOTE: we only need to be concerned about days here, not quantities.  If there were a change of quantities, it would
  -- have corresponded to a record.
  SELECT
    sms.sum_quantity INTO _initial_quantity
  FROM stock_movement_status AS sms WHERE
    -- get the record right before the start
    sms.date < _start_date AND
    sms.depot_uuid = _depot_uuid AND
    sms.inventory_uuid = _inventory_uuid
    ORDER BY sms.date DESC
    LIMIT 1;

  SELECT DATEDIFF(_min_date, _start_date)  INTO _head_days;

  IF (_initial_quantity = 0 OR _initial_quantity IS NULL) THEN
    -- started without stock. Add the "head" to  days to stock out days.
    SELECT _sum_stock_out_day + _head_days INTO _sum_stock_out_day;
  ELSE
    -- started with stock.  Add the "head" to the days of stock.
    SELECT _sum_stock_day + _head_days INTO _sum_stock_day;
  END IF;

  -- the number of days in the period
  SELECT DATEDIFF(_date, _start_date) INTO _sum_day;

  -- Default algorithm
  -- The average monthly consumption is obtained by dividing the quantity consumed during the period by
  -- the number of days with stock during the period, and by multiplying the result by 30.5.
  SET _algo_def = (_sum_consumed_quantity / IF(_sum_stock_day IS NULL OR _sum_stock_day = 0, 1, _sum_stock_day)) * 30.5;

  -- MSH algorithm
  -- The average consumption is obtained by dividing the quantity consumed during the period by the difference of the
  -- number of months in the period minus the total number of days of stock out in the period. The MSH algorithm
  -- is recommended by the Management Sciences for Health organization (https://www.msh.org).
  SET _algo_msh = (_sum_consumed_quantity / IF((_number_of_month - (_sum_stock_out_day / 30.5)) = 0 OR NULL, 1, (_number_of_month - (_sum_stock_out_day / 30.5))));

  SELECT
    BUID(_depot_uuid) AS depot_uuid,
    BUID(_inventory_uuid) AS inventory_uuid,
    _start_date AS start_date,
    _date AS end_date,
    ROUND(IFNULL(_algo_def, 0), 2) AS algo_def,
    ROUND(IFNULL(_algo_msh, 0), 2) AS algo_msh,
    _last_quantity AS quantity_in_stock,
    _sum_day AS sum_days,
    _sum_stock_day AS sum_stock_day,
    _sum_stock_out_day AS sum_stock_out_days,
    _sum_consumption_day AS sum_consumption_day,
    _sum_consumed_quantity AS sum_consumed_quantity,
    _max_date AS max_date,
    _min_date AS min_date,
    _number_of_month AS number_of_month,
    _head_days AS head_days,
    _tail_days AS tail_days,
    _initial_quantity AS quantity_at_beginning;
END $$


/*
CALL StageInventoryForStockValue(inventoryUuid)

DESCRIPTION
This procedure adds an inventory uuid to a temporary table for later use in the
RecomputeStockValueForStagedInventory() stored procedure.
*/
DROP PROCEDURE IF EXISTS StageInventoryForStockValue$$
CREATE PROCEDURE StageInventoryForStockValue(
  IN _inventory_uuid BINARY(16)
) BEGIN
  CREATE TEMPORARY TABLE IF NOT EXISTS stage_inventory_for_stock_value(inventory_uuid BINARY(16) NOT NULL);
  INSERT INTO stage_inventory_for_stock_value SET stage_inventory_for_stock_value.inventory_uuid = _inventory_uuid;
END $$

/*
 * ComputeInventoryStockValue
 * This procedure computes the stock value for a given inventory
 * and update value in the database, the value is computed
 * in the enterprise currency
 */
DROP PROCEDURE IF EXISTS ComputeInventoryStockValue$$
CREATE PROCEDURE ComputeInventoryStockValue(
  IN _inventory_uuid BINARY(16),
  IN _date DATE
)
BEGIN
  DECLARE v_cursor_all_movements_finished INTEGER DEFAULT 0;

  DECLARE v_quantity_in_stock INT(11) DEFAULT 0;
  DECLARE v_wac DECIMAL(19, 4) DEFAULT 0;
  DECLARE v_is_exit TINYINT(1) DEFAULT 0;

  DECLARE v_line_quantity INT(11);
  DECLARE v_line_unit_cost DECIMAL(19, 4);
  DECLARE v_line_is_exit TINYINT(1);

  DECLARE cursor_all_movements CURSOR FOR
    SELECT sm.quantity, sm.unit_cost, sm.is_exit
      FROM stock_movement AS sm
      JOIN lot AS l ON l.uuid = sm.lot_uuid
      JOIN depot d ON d.uuid = sm.depot_uuid
      WHERE
        (l.inventory_uuid = _inventory_uuid) AND DATE(sm.date) <= DATE(_date)
      ORDER BY DATE(sm.date), sm.created_at ASC;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_cursor_all_movements_finished = 1;

  OPEN cursor_all_movements;

  loop_cursor_all_movements : LOOP
    FETCH cursor_all_movements INTO v_line_quantity, v_line_unit_cost, v_line_is_exit;

    IF v_cursor_all_movements_finished = 1 THEN
      LEAVE loop_cursor_all_movements;
    END IF;

    IF v_line_is_exit <> 0 THEN
      SET v_is_exit = -1;
    ELSE
      SET v_is_exit = 1;
    END IF;

    /*
      WAC calculation is performed for new entries

      v_quantity_in_stock will contains cumulative quantity for our movements
      in case of entry v_quantity_in_stock will be incremented else v_quantity_in_stock
      will keep its last value, the v_quanitity_in_stock is initialized with 0

      WAC = (current stock value + the value of the new entry) / the final quantity

      Since all entry are made in enterprise currency we do not have to do
      conversion here, so the wac is based on movement unit_cost * 1
      (in other word wac is based on movement cost which is in the enterprise currency)
    */
    IF v_line_is_exit = 0 AND v_quantity_in_stock > 0 THEN
      SET v_wac = ((v_quantity_in_stock * v_wac) + (v_line_quantity * v_line_unit_cost)) / (v_line_quantity + v_quantity_in_stock);
    ELSEIF v_line_is_exit = 0 AND v_quantity_in_stock = 0 THEN
      SET v_wac = (v_line_unit_cost * 1);
    END IF;

    SET v_quantity_in_stock = v_quantity_in_stock + (v_line_quantity * v_is_exit);
    SET v_line_quantity = v_quantity_in_stock;

  END LOOP loop_cursor_all_movements;

  CLOSE cursor_all_movements;

  /* update the line in the database */
  DELETE FROM `stock_value` WHERE `inventory_uuid` = _inventory_uuid;
  INSERT INTO `stock_value` VALUES (_inventory_uuid, _date, v_quantity_in_stock, v_wac);

END $$

DROP PROCEDURE IF EXISTS RecomputeInventoryStockValue$$
CREATE PROCEDURE RecomputeInventoryStockValue(
  IN _inventory_uuid BINARY(16),
  IN _date DATE
)
BEGIN

  IF _date IS NOT NULL THEN
    CALL ComputeInventoryStockValue(_inventory_uuid, _date);
  ELSE
    CALL ComputeInventoryStockValue(_inventory_uuid, CURRENT_DATE());
  END IF;

END $$

DROP PROCEDURE IF EXISTS RecomputeStockValueForStagedInventory$$
CREATE PROCEDURE RecomputeStockValueForStagedInventory(
  IN _date DATE
)
BEGIN
  DECLARE v_cursor_finished INTEGER DEFAULT 0;
  DECLARE v_inventory_uuid BINARY(16);

  DECLARE cursor_all_inventories CURSOR FOR
    SELECT inv.inventory_uuid AS inventory_uuid
    FROM stock_movement AS sm
      JOIN lot AS l ON l.uuid = sm.lot_uuid
      JOIN stage_inventory_for_stock_value AS inv ON inv.inventory_uuid = l.inventory_uuid
    WHERE DATE(sm.date) <= DATE(_date)
    GROUP BY inv.inventory_uuid;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_cursor_finished = 1;

  OPEN cursor_all_inventories;

  loop_cursor_all_inventories : LOOP
    FETCH cursor_all_inventories INTO v_inventory_uuid;

    IF v_cursor_finished = 1 THEN
      LEAVE loop_cursor_all_inventories;
    END IF;

    CALL RecomputeInventoryStockValue(v_inventory_uuid, _date);
  END LOOP;

  CLOSE cursor_all_inventories;

  DROP TEMPORARY TABLE stage_inventory_for_stock_value;
END $$

DROP PROCEDURE IF EXISTS RecomputeAllInventoriesValue$$
CREATE PROCEDURE RecomputeAllInventoriesValue(
  IN _date DATE
)
BEGIN
  DECLARE v_cursor_finished INTEGER DEFAULT 0;
  DECLARE v_inventory_uuid BINARY(16);

  DECLARE cursor_all_inventories CURSOR FOR
    SELECT inv.uuid AS inventory_uuid
    FROM stock_movement AS sm
      JOIN lot AS l ON l.uuid = sm.lot_uuid
      JOIN inventory AS inv ON inv.uuid = l.inventory_uuid
    WHERE DATE(sm.date) <= DATE(_date)
    GROUP BY inv.uuid;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_cursor_finished = 1;

  OPEN cursor_all_inventories;

  loop_cursor_all_inventories : LOOP
    FETCH cursor_all_inventories INTO v_inventory_uuid;

    IF v_cursor_finished = 1 THEN
      LEAVE loop_cursor_all_inventories;
    END IF;

    CALL RecomputeInventoryStockValue(v_inventory_uuid, _date);
  END LOOP;

  CLOSE cursor_all_inventories;
END $$

DROP PROCEDURE IF EXISTS RecomputeStockValue$$
CREATE PROCEDURE RecomputeStockValue(
  IN _date DATE
)
BEGIN
  IF _date IS NOT NULL THEN
    CALL RecomputeAllInventoriesValue(_date);
  ELSE
    CALL RecomputeAllInventoriesValue(CURRENT_DATE());
  END IF;
END $$

/*
  ---------------------------------------------------
  Add an inventory tag
  ---------------------------------------------------

  Add a tag to this inventory (create it if necessary)
*/
DROP PROCEDURE IF EXISTS AddInventoryTag$$
CREATE PROCEDURE AddInventoryTag (
  IN inventoryUuid BINARY(16),
  IN tagName VARCHAR(100),
  IN tagColor VARCHAR(50)
)
BEGIN
  DECLARE tagExists TINYINT(1);
  DECLARE tagUuid BINARY(16);

  SET tagExists = (SELECT IF((SELECT COUNT(t.name) FROM tags AS t WHERE t.name = tagName) > 0, 1, 0));

  /* If the tag does not exist yet, create it */
  IF (tagExists = 0) THEN
    SET tagUuid = HUID(UUID());
    INSERT INTO `tags` (`uuid`, `name`, `color`) VALUES (tagUuid, tagName, tagColor);
  ELSE
    SET tagUuid = (SELECT `uuid` FROM `tags` WHERE `name` = tagName);
  END IF;

  /* Create a new tag for this inventory */
  INSERT IGNORE INTO `inventory_tag` (`inventory_uuid`, `tag_uuid`) VALUES (inventoryUuid, tagUuid);
END$$


/*
---------------------------------------------------
Import Inventory Procedure
---------------------------------------------------

This procedure import a new inventory into the system
by creating one and performing a stock integration
if necessary.
*/
DROP PROCEDURE IF EXISTS ImportInventory$$
CREATE PROCEDURE ImportInventory (
  IN enterpriseId SMALLINT(5),
  IN inventoryGroupName VARCHAR(100),
  IN inventoryCode VARCHAR(30),
  IN inventoryText VARCHAR(100),
  IN inventoryType VARCHAR(30),
  IN inventoryUnit VARCHAR(30),
  IN inventoryUnitPrice DECIMAL(18, 4),
  IN inventoryConsumable TINYINT(1),
  IN inventoryIsAsset TINYINT(1),
  IN inventoryDepreciationRate DECIMAL(18, 4),
  IN inventoryBrand TEXT,
  IN inventoryModel TEXT,
  IN tag VARCHAR(50)
)
BEGIN
  DECLARE inventoryUuid BINARY(16);
  DECLARE existInventoryGroup TINYINT(1);
  DECLARE existInventoryType TINYINT(1);
  DECLARE existInventoryUnit TINYINT(1);
  DECLARE existInventory TINYINT(1);

  DECLARE randomCode INT(11);
  DECLARE inventoryGroupUuid BINARY(16);
  DECLARE inventoryTypeId TINYINT(3);
  DECLARE inventoryUnitId SMALLINT(5);

  SET existInventoryGroup = (SELECT IF((SELECT COUNT(`name`) AS total FROM `inventory_group` WHERE `code` = inventoryGroupName OR `name` = inventoryGroupName) > 0, 1, 0));
  SET existInventory = (SELECT IF((SELECT COUNT(`text`) AS total FROM `inventory` WHERE `code` = inventoryCode OR `text` = inventoryText) > 0, 1, 0));
  SET existInventoryType = (SELECT IF((SELECT COUNT(*) AS total FROM `inventory_type` WHERE `text` = inventoryType) > 0, 1, 0));
  SET existInventoryUnit = (SELECT IF((SELECT COUNT(*) AS total FROM `inventory_unit` WHERE `text` = inventoryUnit OR `abbr` = inventoryUnit) > 0, 1, 0));

  /* Create group if doesn't exist */
  IF (existInventoryGroup = 0) THEN
    SET randomCode = (SELECT ROUND(RAND() * 10000000));
    SET inventoryGroupUuid = HUID(UUID());
    INSERT INTO `inventory_group` (`uuid`, `name`, `code`, `depreciation_rate`) VALUES (inventoryGroupUuid, inventoryGroupName, randomCode, inventoryDepreciationRate);
  ELSE
    SET inventoryGroupUuid = (SELECT `uuid` FROM `inventory_group` WHERE `code` = inventoryGroupName OR `name` = inventoryGroupName LIMIT 1);
  END IF;

  /* Create type if doesn't exist */
  IF (existInventoryType = 0) THEN
    SET inventoryTypeId = (SELECT MAX(`id`) + 1 FROM `inventory_type`);
    INSERT INTO `inventory_type` (`id`, `text`) VALUES (inventoryTypeId, inventoryType);
  ELSE
    SET inventoryTypeId = (SELECT `id` FROM `inventory_type` WHERE LOWER(`text`) = LOWER(inventoryType) LIMIT 1);
  END IF;

  /* Create unit if doesn't exist */
  IF (existInventoryUnit = 0) THEN
    SET inventoryUnitId = (SELECT MAX(`id`) + 1 FROM `inventory_unit`);
    INSERT INTO `inventory_unit` (`id`, `abbr`, `text`) VALUES (inventoryUnitId, inventoryUnit, inventoryUnit);
  ELSE
    SET inventoryUnitId = (SELECT `id` FROM `inventory_unit` WHERE LOWER(`text`) = LOWER(inventoryUnit) OR LOWER(`abbr`) = LOWER(inventoryUnit) LIMIT 1);
  END IF;

  /*
    Create inventory if it doesn't exist

    If the inventory already exists, skip because we are in a loop and
    we have to continue importing other inventories

    Inventory imported are considered by default as stockable (consumbale)
  */
  IF (existInventory = 0) THEN
    SET inventoryUuid = HUID(UUID());
    INSERT INTO `inventory` (`enterprise_id`, `uuid`, `code`, `text`, `price`, `group_uuid`, `type_id`, `unit_id`,
                             `consumable`, `is_asset`, `manufacturer_brand`, `manufacturer_model`)
    VALUES
    (enterpriseId, inventoryUuid, inventoryCode, inventoryText, inventoryUnitPrice, inventoryGroupUuid, inventoryTypeId,
     inventoryUnitId, inventoryConsumable, inventoryIsAsset, inventoryBrand, inventoryModel);

    IF (tag != '') THEN
      CALL AddInventoryTag(inventoryUuid, tag, "#8000FF");
    END IF;
  END IF;
END $$


/* ---------------------------------------------------------------------------- */

/*

This section contains procedures related to setting up a
new server.

---------------------------------------------------
Import Account Procedure
---------------------------------------------------

This procedure import a new account into the system.
*/

DROP PROCEDURE IF EXISTS ImportAccount$$
CREATE PROCEDURE ImportAccount (
  IN enterpriseId SMALLINT(5),
  IN accountNumber INT(11),
  IN accountLabel VARCHAR(200),
  IN accountType VARCHAR(100),
  IN accountParent INT(11),
  IN importingOption TINYINT(1)
)
BEGIN
  DECLARE existAccount TINYINT(1);
  DECLARE existAccountType TINYINT(1);
  DECLARE existAccountParent TINYINT(1);
  DECLARE accountLength TINYINT(1);

  DECLARE accountParentId INT(11) DEFAULT 0;
  DECLARE defaultAccountParentId INT(11) DEFAULT 0;
  DECLARE accountTypeId MEDIUMINT(8);
  DECLARE IMPORT_DEFAULT_OHADA_ACCOUNT_OPTION TINYINT(1) DEFAULT 1;

  SET existAccount = (SELECT IF((SELECT COUNT(`number`) AS total FROM `account` WHERE `number` = accountNumber) > 0, 1, 0));
  SET existAccountType = (SELECT IF((SELECT COUNT(*) AS total FROM `account_type` WHERE `type` = accountType) > 0, 1, 0));
  SET accountTypeId = (SELECT id FROM `account_type` WHERE `type` = accountType LIMIT 1);
  SET existAccountParent = (SELECT IF((SELECT COUNT(*) AS total FROM `account` WHERE `number` = accountParent) > 0, 1, 0));

  SET accountLength = (SELECT CHAR_LENGTH(accountNumber));

  /*
    Handle parent account for importing ohada list of accounts
    We assume that ohada main accounts are already loaded into the system
  */
  IF (existAccountParent = 1) THEN
    SET accountParentId = (SELECT id FROM `account` WHERE `number` = accountParent);
  END IF;


  /*
    Create account if it doesn't exist

    if the account already exist skip because we are in a loop and
    we have to continue importing other accounts
  */
  IF (existAccount = 0 AND existAccountType = 1) THEN
    INSERT INTO `account` (`type_id`, `enterprise_id`, `number`, `label`, `parent`) VALUES (accountTypeId, enterpriseId, accountNumber, accountLabel, accountParentId);

    /*
      Insert default accounts for a quick usage

      insert an child account if the option is default ohada and we have an account with four digit
    */
    IF (accountLength = 4 AND importingOption = IMPORT_DEFAULT_OHADA_ACCOUNT_OPTION) THEN
      -- parent id
      SET defaultAccountParentId = (SELECT LAST_INSERT_ID());

      -- account type
      SET accountTypeId = PredictAccountTypeId(accountNumber);
      INSERT INTO `account` (`type_id`, `enterprise_id`, `number`, `label`, `parent`) VALUES (accountTypeId, enterpriseId, accountNumber * 10000, CONCAT('Compte ', accountLabel), defaultAccountParentId);
    END IF;

  END IF;
END $$

-- roles
DROP PROCEDURE IF EXISTS superUserRole$$
CREATE PROCEDURE superUserRole(IN user_id INT)
BEGIN
  DECLARE roleUUID BINARY(16);

  SET roleUUID = HUID(UUID());

  INSERT INTO role(uuid, label) VALUES(roleUUID, 'Administrateur');
  INSERT INTO role_unit SELECT HUID(uuid()) as uuid,roleUUID, id FROM unit;
  INSERT INTO user_role(uuid, user_id, role_uuid) VALUES(HUID(uuid()), user_id, roleUUID);
  INSERT INTO role_actions(uuid, role_uuid, actions_id) SELECT HUID(uuid()) as uuid, roleUUID, id FROM actions;

  UPDATE user SET is_admin = 1 WHERE id = user_id;
END $$


/* ---------------------------------------------------------------------------- */

/*

This section contains procedures for the payroll in BHIMA.

*/
DROP PROCEDURE IF EXISTS `UpdateStaffingIndices`$$
CREATE PROCEDURE `UpdateStaffingIndices`(IN _dateFrom DATE, IN _dateTo DATE, IN _payroll_conf_id INT)
BEGIN
  DECLARE _id mediumint(8) unsigned;
  DECLARE _hiring_date DATE;
  DECLARE _employee_uuid, _grade_uuid, _current_staffing_indice_uuid, _last_staffing_indice_uuid BINARY(16);
  DECLARE _hiring_year, _fonction_id INT;
  DECLARE _grade_indice, _last_grade_indice, _function_indice, _grade_indice_rate DECIMAL(19,4);

  DECLARE done BOOLEAN;

  DECLARE curs1 CURSOR FOR
  -- The request should only return the employees affected by the pay period,
  -- just because two pay periods can have the same time range.
  SELECT emp.uuid, emp.grade_uuid, emp.fonction_id, emp.hiring_date
    FROM employee AS emp
    JOIN config_employee_item AS conf ON conf.employee_uuid = emp.uuid
    JOIN config_employee AS cemp ON cemp.id = conf.config_employee_id
    JOIN payroll_configuration cpay ON cpay.config_employee_id = cemp.id
    WHERE cpay.id = _payroll_conf_id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  SELECT (ent.base_index_growth_rate / 100) AS base_index_growth_rate INTO _grade_indice_rate FROM enterprise_setting AS ent LIMIT 1;

    OPEN curs1;
        read_loop: LOOP
        FETCH curs1 INTO _employee_uuid, _grade_uuid, _fonction_id, _hiring_date;
            IF done THEN
                LEAVE read_loop;
            END IF;
            -- anciennette
            SET _hiring_year = FLOOR(DATEDIFF(_dateTo, _hiring_date)/365);
            -- is there any staffing indice specified for the employee in this payroll config period interval ?
            -- _current_staffing_indice_uuid is the indice for this payroll config period interval
            SET _current_staffing_indice_uuid  = IFNULL((
                SELECT st.uuid
                FROM staffing_indice st
                WHERE st.employee_uuid = _employee_uuid AND (st.date BETWEEN _dateFrom AND _dateTo)
                LIMIT 1
            ), HUID('0'));

            SET _last_staffing_indice_uuid  = IFNULL((
                SELECT st.uuid
                FROM staffing_indice st
                WHERE st.employee_uuid = _employee_uuid
                ORDER BY st.created_at DESC
                LIMIT 1
            ), HUID('0'));

            SET @shouldInsert = FALSE;

            -- check if the hiring_date is in the current payroll config period interval
            SET @hiring_date = DATE(CONCAT(YEAR(_dateTo), '-', MONTH(_hiring_date), '-', DAY(_hiring_date)));
            SET @hiring_date_interval = (@hiring_date BETWEEN _dateFrom AND _dateTo);

            -- should update staffing_indice and there's no previous staffing_indice for in this payroll config period interval
            IF  ((@hiring_date_interval=1)  AND (_current_staffing_indice_uuid = HUID('0'))) THEN
                -- increase the _last_grade_indice if it exist
                IF (_last_staffing_indice_uuid <> HUID('0')) THEN
                    SET _last_grade_indice = (SELECT grade_indice FROM staffing_indice WHERE uuid = _last_staffing_indice_uuid);
                    SET _grade_indice =  _last_grade_indice + (_last_grade_indice*_grade_indice_rate);
                ELSE
                    SET _grade_indice = (SELECT IFNULL(value, 0)  FROM staffing_grade_indice WHERE grade_uuid = _grade_uuid LIMIT 1);
                    SET _grade_indice = _grade_indice + (_grade_indice*_hiring_year*_grade_indice_rate);
                END IF;
                SET @shouldInsert = TRUE;

            -- no indice has been created for the employee previously(no record in the table for him)
            -- this is used when configuring for the first time
            ELSE
                IF ((@hiring_date_interval = 0) && (_last_staffing_indice_uuid = HUID('0'))) THEN
                    SET _grade_indice = (SELECT IFNULL(value, 0)  FROM staffing_grade_indice WHERE grade_uuid = _grade_uuid LIMIT 1);
                    SET _grade_indice = _grade_indice + (_grade_indice * _hiring_year * _grade_indice_rate);
                    SET @shouldInsert = TRUE;
                END IF;
            END IF;

            IF @shouldInsert THEN
                SET _function_indice = (SELECT IFNULL(value, 0) FROM staffing_function_indice WHERE fonction_id = _fonction_id LIMIT 1);
                INSERT INTO staffing_indice(uuid, employee_uuid, grade_uuid, fonction_id, grade_indice, function_indice, date)
                VALUES(HUID(uuid()), _employee_uuid,  _grade_uuid , _fonction_id, IFNULL(ROUND(_grade_indice, 0), 0), IFNULL(_function_indice, 0), _dateTo);
            END IF;
        END LOOP;
    CLOSE curs1;
END$$

-- sum of a column of indexes (index for each employee)
DROP FUNCTION IF EXISTS `sumTotalIndex`$$
CREATE FUNCTION `sumTotalIndex`(_payroll_configuration_id INT, _indice_type VARCHAR(50)) RETURNS DECIMAL(19, 4) DETERMINISTIC
BEGIN

    DECLARE _employee_uuid BINARY(16);
    DECLARE _employee_grade_indice, totals DECIMAL(19, 4);

  SET totals  = (
    SELECT SUM(rubric_value) as 'rubric_value'
        FROM stage_payment_indice sp
        JOIN rubric_payroll r ON r.id = sp.rubric_id
        WHERE  r.indice_type = _indice_type AND  payroll_configuration_id = _payroll_configuration_id
  );

    RETURN IFNULL(totals, 1);
END$$

DROP FUNCTION IF EXISTS `getStagePaymentIndice`$$
CREATE  FUNCTION `getStagePaymentIndice`(_employee_uuid BINARY(16),
_payroll_configuration_id INT, _indice_type VARCHAR(50) ) RETURNS DECIMAL(19, 4) DETERMINISTIC
BEGIN
    return IFNULL((SELECT SUM(rubric_value) as 'rubric_value'
        FROM stage_payment_indice sp
        JOIN rubric_payroll r ON r.id = sp.rubric_id
        WHERE sp.employee_uuid = _employee_uuid AND r.indice_type = _indice_type AND
            payroll_configuration_id = _payroll_configuration_id
        LIMIT 1), 0);
END;


DROP PROCEDURE IF EXISTS `addStagePaymentIndice`$$
CREATE   PROCEDURE `addStagePaymentIndice`(
    IN _employee_uuid BINARY(16),IN _payroll_configuration_id INT(10),

    IN _indice_type VARCHAR(50), IN _value DECIMAL(19, 10)
)
BEGIN
   DECLARE _rubric_id INT;
   DECLARE _stage_payment_uuid BINARY(16);

   SELECT id INTO _rubric_id FROM rubric_payroll WHERE indice_type = _indice_type LIMIT 1;

   IF _rubric_id > 0 THEN
    SET _stage_payment_uuid = IFNULL((
        SELECT sp.uuid
        FROM stage_payment_indice sp
        JOIN rubric_payroll r ON r.id = sp.rubric_id
        WHERE sp.employee_uuid = _employee_uuid AND r.indice_type = _indice_type AND
            payroll_configuration_id = _payroll_configuration_id
        LIMIT 1), HUID('0')
    );
   IF _stage_payment_uuid <> HUID('0') THEN
    DELETE FROM stage_payment_indice  WHERE uuid = _stage_payment_uuid;
   END IF;

   INSERT INTO stage_payment_indice
    (uuid,employee_uuid, payroll_configuration_id, rubric_id, rubric_value ) VALUES
    (HUID(uuid()), _employee_uuid, _payroll_configuration_id, _rubric_id, _value);
  END IF;
END $$

/* ---------------------------------------------------------------------------- */

/*
This section conaints miscellaneous procedures for analysis tools.

*/

-- Use this Procedure below posted at http://mysql.rjweb.org/doc.php/pivot.
-- You want to "pivot" the data so that a linear list of values with 2 keys becomes a spreadsheet-like array.

DROP PROCEDURE IF EXISTS Pivot$$

CREATE PROCEDURE Pivot(
  IN tbl_name TEXT,    -- table name (or db.tbl)
  IN base_cols TEXT,   -- column(s) on the left, separated by commas
  IN pivot_col TEXT,   -- name of column to put across the top
  IN tally_col TEXT,   -- name of column to SUM up
  IN where_clause TEXT,  -- empty string or "WHERE ..."
  IN order_by TEXT -- empty string or "ORDER BY ..."; usually the base_cols
)
DETERMINISTIC
SQL SECURITY INVOKER
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
      GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE,
        @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
      SET @full_error = CONCAT("ERROR ", @errno, " (", @sqlstate, "): ", @text);
      SELECT @full_error;
    END;

  -- Find the distinct values
  -- Build the SUM()s
  SET @subq = CONCAT('SELECT DISTINCT ', pivot_col, ' AS val ',
          ' FROM ', tbl_name, ' ', where_clause, ' ORDER BY 1') COLLATE utf8mb4_unicode_ci;
  -- select @subq;

  SET @cc1 = "CONCAT('SUM(IF(&p = ', &v, ', &t, 0)) AS ', &v)" COLLATE utf8mb4_unicode_ci;

  SET @cc2 = REPLACE(@cc1, '&p' , pivot_col) COLLATE utf8mb4_unicode_ci;

  SET @cc3 = REPLACE(@cc2, '&t', tally_col) COLLATE utf8mb4_unicode_ci;
  -- select @cc2, @cc3;
  SET @qval = CONCAT("'\"', val, '\"'") COLLATE utf8mb4_unicode_ci;
  -- select @qval;
  SET @cc4 = REPLACE(@cc3, '&v', @qval) COLLATE utf8mb4_unicode_ci;
  -- select @cc4;

  SET SESSION group_concat_max_len = 10000;  -- just in case
  SET @stmt = CONCAT(
      'SELECT GROUP_CONCAT(', @cc4, ' SEPARATOR ",\n") INTO @sums',
      ' FROM ( ', @subq, ' ) AS top') COLLATE utf8mb4_unicode_ci;

  -- SELECT @stmt;
  PREPARE _sql FROM @stmt;
  EXECUTE _sql;           -- Intermediate step: build SQL for columns
  DEALLOCATE PREPARE _sql;
  -- Construct the query and perform it
  SET @stmt2 = CONCAT(
      'SELECT ',
        base_cols, ',\n',
        @sums,
        ',\n SUM(', tally_col, ') AS Total'
      '\n FROM ', tbl_name, ' ',
      where_clause,
      ' GROUP BY ', base_cols,
      '\n WITH ROLLUP',
      '\n', order_by
    ) COLLATE utf8mb4_unicode_ci;

  -- SELECT @stmt2;          -- The statement that generates the result
  PREPARE _sql FROM @stmt2;
  EXECUTE _sql;           -- The resulting pivot table ouput
  DEALLOCATE PREPARE _sql;
END$$

-- from https://stackoverflow.com/questions/173814/using-alter-to-drop-a-column-if-it-exists-in-mysql
DROP FUNCTION IF EXISTS bh_column_exists;

CREATE FUNCTION bh_column_exists(
  tname VARCHAR(64) ,
  cname VARCHAR(64)
)
  RETURNS BOOLEAN
  READS SQL DATA
  BEGIN
    RETURN 0 < (SELECT COUNT(*)
      FROM `INFORMATION_SCHEMA`.`COLUMNS`
      WHERE `TABLE_SCHEMA` = SCHEMA()
        AND `TABLE_NAME` = tname
        AND `COLUMN_NAME` = cname);
  END $$

-- drop_column_if_exists:

DROP PROCEDURE IF EXISTS drop_column_if_exists;

CREATE PROCEDURE drop_column_if_exists(
  IN tname VARCHAR(64),
  IN cname VARCHAR(64)
)
BEGIN
    IF bh_column_exists(tname, cname)
    THEN
      SET @drop_column_if_exists = CONCAT("ALTER TABLE `", tname, "` DROP COLUMN `", cname, "`");
      PREPARE drop_query FROM @drop_column_if_exists;
      EXECUTE drop_query;
    END IF;
END $$

-- add_column_if_missing:

DROP PROCEDURE IF EXISTS add_column_if_missing;

CREATE PROCEDURE add_column_if_missing(
  IN tname VARCHAR(64),
  IN cname VARCHAR(64),
  IN typeinfo VARCHAR(128)
)
BEGIN
  IF NOT bh_column_exists(tname, cname)
  THEN
    SET @add_column_if_missing = CONCAT("ALTER TABLE `", tname, "` ADD COLUMN `", cname, "` ", typeinfo);
    PREPARE add_query FROM @add_column_if_missing;
    EXECUTE add_query;
  END IF;
END $$


-- From  https://stackoverflow.com/questions/2480148/how-can-i-employ-if-exists-for-creating-or-dropping-an-index-in-mysql
-- This procedure try to drop a table index if it exists


DROP FUNCTION IF EXISTS index_exists;

CREATE FUNCTION index_exists(
  theTable VARCHAR(64),
  theIndexName VARCHAR(64)
)
  RETURNS BOOLEAN
  READS SQL DATA
  BEGIN
    RETURN 0 < (SELECT COUNT(*) AS exist FROM information_schema.statistics WHERE TABLE_SCHEMA = DATABASE() and table_name =
theTable AND index_name = theIndexName);
  END $$

DROP PROCEDURE IF EXISTS drop_index_if_exists $$
CREATE PROCEDURE drop_index_if_exists(in theTable varchar(128), in theIndexName varchar(128) )
BEGIN
 IF(index_exists (theTable, theIndexName)) THEN
   SET @s = CONCAT('DROP INDEX ' , theIndexName , ' ON ' , theTable);
   PREPARE stmt FROM @s;
   EXECUTE stmt;
 END IF;
END $$


--

DROP FUNCTION IF EXISTS Constraint_exists$$
CREATE FUNCTION Constraint_exists(
  theTable VARCHAR(64),
  theConstraintName VARCHAR(64)
)
  RETURNS BOOLEAN
  READS SQL DATA
  BEGIN
    RETURN 0 < (
     SELECT COUNT(*) AS nbr
     FROM
      INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
     AND TABLE_NAME= theTable
    AND  CONSTRAINT_NAME = theConstraintName
   );
  END $$

DROP PROCEDURE IF EXISTS add_constraint_if_missing$$
CREATE PROCEDURE add_constraint_if_missing(
  IN tname VARCHAR(64),
  IN cname VARCHAR(64),
  IN cdetails VARCHAR(128)
)
BEGIN
  IF NOT Constraint_exists(tname, cname)
  THEN
    SET @add_constraint_if_missing = CONCAT("ALTER TABLE `", tname, "` ADD CONSTRAINT `", cname, "` ", cdetails);
    PREPARE add_query FROM @add_constraint_if_missing;
    EXECUTE add_query;
  END IF;
END $$

-- this procedure will be used for "ALTER TABLE table_name DROP FOREIGN KEY constraint_name";
-- example : CALL drop_foreign_key('table_name', 'constraint_name');

DROP PROCEDURE IF EXISTS drop_foreign_key $$
CREATE PROCEDURE drop_foreign_key(in theTable varchar(128), in theConstraintName varchar(128) )
BEGIN
 IF(Constraint_exists(theTable, theConstraintName) > 0) THEN

   SET @s = CONCAT(' ALTER TABLE ' , theTable , ' DROP FOREIGN KEY  ' , theConstraintName);
   PREPARE stmt FROM @s;
   EXECUTE stmt;
 END IF;
END $$


/* ---------------------------------------------------------------------------- */

/*
This section contains code for linking cost centers to various activities throughout the app.

@function GetCostCenterByAccountId()

@description
Retrieves the cost center id for an account by using its account_id. Each account should
have one and only one cost center.  If an account does not have a cost center, NULL will be
returned.

NOTE(@jniles) - Currently, BHIMA does not guarantee that only one cost center is associated with an
account, but when we do make guarantees, we will be able to modify this function to do it.
*/
DROP FUNCTION IF EXISTS GetCostCenterByAccountId$$
CREATE FUNCTION GetCostCenterByAccountId(account_id INT)
RETURNS MEDIUMINT(8) DETERMINISTIC
BEGIN
  RETURN (
    SELECT cost_center_id FROM account WHERE account.id = account_id
  );
END $$


/*
@function GetCostCenterByServiceUuid()

@description
Retrieves the cost center id for a service using its service_uuid.  Each service should have one
and only one cost center assocaited with it.  If a service does not have a cost center, NULL will
be returned.

NOTE(@jniles) - Currently, BHIMA does not guarantee that only one cost center is associated with a
service, but when we do make guarantees, we will be able to modify this function to do it.
*/
DROP FUNCTION IF EXISTS GetCostCenterByServiceUuid$$
CREATE FUNCTION GetCostCenterByServiceUuid(service_uuid BINARY(16))
RETURNS MEDIUMINT(8) DETERMINISTIC
BEGIN
  RETURN (
    SELECT cost_center_id FROM service_cost_center
    WHERE service_cost_center.service_uuid = service_uuid
  );
END $$

/*
@function GetCostCenterByInvoiceUuid(invoice_uuid)

@params invoice_uuid BINARY(16) the invoice uuid

@description
Returns the cost center id for the invoice using the service_uuid in the invoice table
*/
DROP FUNCTION IF EXISTS GetCostCenterByInvoiceUuid$$
CREATE FUNCTION GetCostCenterByInvoiceUuid(invoice_uuid BINARY(16))
RETURNS MEDIUMINT(8) DETERMINISTIC
BEGIN
  RETURN (
    SELECT GetCostCenterByServiceUuid(i.service_uuid)
    FROM invoice i
    WHERE i.uuid = invoice_uuid
  );
END $$


DROP PROCEDURE IF EXISTS ComputeCostCenterAllocationByIndex$$
CREATE PROCEDURE ComputeCostCenterAllocationByIndex(
  IN _dateFrom DATE,
  IN _dateTo DATE,
  IN _useRevenue BOOLEAN,
  IN _currencyId TINYINT
)
BEGIN
  DECLARE _enterpriseId SMALLINT;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
      GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE,
        @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
      SET @full_error = CONCAT("ERROR ", @errno, " (", @sqlstate, "): ", @text);
      SELECT @full_error AS error_message;
    END;


  SET _enterpriseId = (SELECT id FROM enterprise LIMIT 1);
  SET _useRevenue = (SELECT IF(_useRevenue, 1, 0));

  DROP TEMPORARY TABLE IF EXISTS cost_center_costs_with_indexes;
  CREATE TEMPORARY TABLE cost_center_costs_with_indexes AS
    SELECT
      z.id, z.label AS cost_center_label,
      z.allocation_basis_id,
      z.is_principal,
      z.step_order,
      SUM(z.`value` * IFNULL(GetExchangeRate(_enterpriseId, _currencyId, _dateTo), 1)) AS direct_cost,
      ccb.name AS cost_center_allocation_basis_label,
      ccbv.quantity AS cost_center_allocation_basis_value
    FROM (
      SELECT
        fc.id, fc.label, fc.is_principal, fc.step_order, ccb.name AS allocation_basis_id,
        SUM(cca.debit - cca.credit) AS `value`
      FROM cost_center AS fc
      JOIN cost_center_aggregate cca ON cca.cost_center_id = fc.id
      JOIN `period` p ON p.id = cca.period_id
      LEFT JOIN cost_center_allocation_basis ccb ON ccb.id = fc.allocation_basis_id
      WHERE DATE(p.start_date) >= DATE(_dateFrom) AND DATE(p.end_date) <= DATE(_dateTo)
        AND cca.is_income = _useRevenue
      GROUP BY cca.cost_center_id
    ) AS z
    JOIN cost_center_allocation_basis_value ccbv ON ccbv.cost_center_id = z.id
    JOIN cost_center_allocation_basis ccb ON ccb.id = ccbv.basis_id
    GROUP BY z.id, ccb.name
    ORDER by z.step_order ASC;

  SELECT
    GROUP_CONCAT(DISTINCT
      CONCAT(
        'MAX(CASE WHEN cost_center_allocation_basis_label = ''',
        cost_center_allocation_basis_label,
        ''' then cost_center_allocation_basis_value end) AS `',
        cost_center_allocation_basis_label, '`'
      )
    ) INTO @sql
  FROM cost_center_costs_with_indexes;

  SET @sql = CONCAT('SELECT id, cost_center_label, is_principal, step_order, direct_cost, allocation_basis_id, ', @sql, ' FROM cost_center_costs_with_indexes GROUP BY id');

  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;

END$$

/* ---------------------------------------------------------------------------- */

/* This section contains procedures for dealing with budgets */

-- Delete all budget items for each period of the given fiscal year
DROP PROCEDURE IF EXISTS DeleteBudget$$
CREATE PROCEDURE DeleteBudget(
  IN fiscalYearId MEDIUMINT(8) UNSIGNED
)
BEGIN
  DECLARE _periodId mediumint(8) unsigned;

  DECLARE done BOOLEAN;
  DECLARE periodCursor CURSOR FOR
    SELECT id FROM period
    WHERE period.fiscal_year_id = fiscalYearId;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  OPEN periodCursor;
    ploop: LOOP
    FETCH periodCursor INTO _periodId;
      IF done THEN
        LEAVE ploop;
      END IF;
      DELETE FROM budget WHERE budget.period_id = _periodId;
    END LOOP;
  CLOSE periodCursor;
END$$

-- Insert a budget line for a given period
-- NOTE: This procedure will error if the record already exists
DROP PROCEDURE IF EXISTS InsertBudgetItem$$
CREATE PROCEDURE InsertBudgetItem(
  IN acctNumber INT UNSIGNED,
  IN periodId MEDIUMINT(8) UNSIGNED,
  IN budget DECIMAL(19,4) UNSIGNED,
  IN locked BOOLEAN
)
BEGIN
    INSERT INTO budget (`account_id`, `period_id`, `budget`, `locked`)
    SELECT act.id, periodId, budget, locked
    FROM account AS act
    WHERE act.number = acctNumber;
END$$

-- EXAMPLE ABORT CODE
-- DECLARE MyError CONDITION FOR SQLSTATE '45500';
-- SIGNAL MyError SET MESSAGE_TEXT = 'message';

DELIMITER ;
