/**
author: @jniles
date: 2022-01-04
description: removes the USD Caisse Auxiliare from Vanga
*/
DELETE FROM cash_box_account_currency
WHERE id = 2;
