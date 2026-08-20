# Journal Module

Le journal est le module central du logiciel BHIMA - toutes les transactions doivent passer par le journal pour entrer dans le [grand livre](../general-ledger.md) et apparaître dans les rapports ultérieurs. C'est un portier pour toutes les transactions proposées, un grand livre où le comptable peut valider, corriger et approuver les transactions qui entrent dans le système. Aucune transaction financière n'est considérée comme finalisée tant qu'elle n'a pas été postée du journal dans le grand livre.

## Opérations financières en tant que transactions

Dans l'introduction, nous avons noté que toutes les opérations financières sont représentées à la fois comme un enregistrement et une transaction. Dans cette section, nous discuterons des propriétés des transactions en BHIMA.

Comme décrit dans [Comptabilité en partie double](../overview.md#double-entry-bookkeeping), les transactions sont composées de deux lignes ou plus. Certaines informations, telles que la date de transaction, sont partagées sur toutes les lignes. d'autres, comme les comptes, sont spécifiques à une ligne. La liste ci-dessous contient toutes les propriétés d'une transaction. Les propriétés partagées sont désignées par la balise **\[shared\]**.

* **ID**: utilisé uniquement à des fins internes. Cette chaîne de 36 caractères identifie de manière unique la ligne dans la transaction. En réalité, il est uniquement destiné à être utilisé pour signaler des problèmes au support BHIMA.
* **Période\[partagé\]**: une version lisible par l'homme de la période.
* **Projet\[partagé\]**: le projet associé à l'enregistrement.
* **ID de transaction\[partagé\]**: identifiant lisible par l'homme associé à la transaction. Il est composé de la manière suivante: `${project abbreviation}${increment}`. Par exemple, la première transaction d'un projet abrégé en "TST" sera "TST1". Cela permet de différencier les transactions entre les projets.
* **Date de transaction\[partagé\]**: date à laquelle la transaction a été créée.
* **Record\[shared\]**: Identifiant de l'enregistrement qui a créé cette transaction. Ces identifiants sont composés comme suit: `${record type}.${project abbreviation}.${increment}`. Le "type d'enregistrement" est `VO` pour les pièces justificatives,`CP` pour les paiements en espèces et `IV` pour les factures. Un exemple d'enregistrement est `CP.TST.1`, qui lit" le premier paiement en espèces du projet TST ".
* **Description**: description textuelle de la transaction. Les descriptions sont créées manuellement\(par exemple, une description de pièce justificative \) ou sont générées par l’application.
* **Compte**
* **Débit**: la valeur du débit dans la devise de l'entreprise.
* **Crédit**: la valeur du crédit dans la devise de l'entreprise.
* **Currency\[shared\]**: la devise de l'enregistrement d'origine.
* **Débit\(Source\)**: la valeur du débit dans la devise de l'enregistrement d'origine.
* **Crédit\(Source\)**: la valeur du crédit dans la devise de l'enregistrement d'origine.
* **Destinataire**: le débiteur ou le créancier associé à cette ligne de la transaction. Par exemple, si la transaction représente une facture patient, la colonne de destinataire associera le patient que l'entreprise facture \(ce patient sera modélisé comme un débiteur de l'entreprise dans le système\).
* **Référence**: la référence pointe vers la colonne d'enregistrement d'un autre enregistrement / transaction auquel la ligne est liée. Un exemple de ceci est un paiement en espèces contre une facture. Dans la transaction sur facture, la référence sera vide. Dans la transaction de paiement en espèces, la ligne de crédit du compte du débiteur contiendra l'identifiant d'enregistrement de la facture dans la colonne "référence".
* **Type de transaction\[partagé\]**: identifie le type de transaction. Voir [Types de transaction] (# types de transaction) ci-dessous.
* **Responsable\[partagé\]**: l'utilisateur qui a créé la transaction.
* **Commentaire**: cette colonne n'existe que pour l'analyse dynamique. Un utilisateur peut écrire n'importe quoi dans cette colonne, puis filtrer par commentaires pour obtenir des totaux personnalisés et des groupes de transactions.

## Transactions liées

Les opérations financières ne se déroulent pas souvent de manière isolée, mais sont motivées par des engagements antérieurs ou anticipent des opérations futures. Par exemple, lorsqu'un client contracte une dette, on s'attend à ce qu'il finisse par rembourser sa dette ou, lors de l'achat d'un stock, qu'une livraison ultérieure augmente la valeur et la quantité du stock dans un entrepôt.

Pour refléter cette propriété réelle, les transactions dans BHIMA sont _linked_ par leurs colonnes **enregistrement**et **référence**. Comme indiqué ci-dessus, la colonne d'enregistrement est l'identifiant du paiement en espèces, de la facture ou du bon sous-jacent. La colonne de référence pointe toutefois vers la colonne d'enregistrement d'une autre transaction quelque part dans le journal ou le grand livre. Cela relie les deux transactions, l'interprétation de cette ligne particulière dans la seconde transaction ayant été motivée par la première transaction référencée.

La notion d'opérations liées est mieux illustrée par un exemple. Vous trouverez ci-dessous deux transactions simplifiées, la dernière liant la première.

| Transaction | Record | Compte | Débit | Crédit | Entité | Référence |
| --- | --- | --- | --- | --- | --- | --- |
| TRANS1 | IV.TPA.1 | 410001 | 10,00 $ | | PA.HEV.1 | |
| TRANS1 | IV.TPA.1 | 760001 | | 2,50 $ | | |
| TRANS1 | IV.TPA1 | 760002 | | 7,50 $ | | |

| Transaction | Record | Compte | Débit | Crédit | Entité | Référence |
| --- | --- | --- | --- | --- | --- | --- |
| TRANS2 | CP.TPA.1 | 560001 | 4,50 $ | | | |
| TRANS2 | CP.TPA.1 | 410001 | | 4,50 $ | PA.HEV.1 | IV.TPA.1 |

La première transaction est une facture \(notée `IV.TPA.1`\] pour un patient \(notée`PA.HEV.1` \) d’une valeur totale de 10,00 $. La deuxième transaction est un paiement en espèces\(désigné par `CP.TPA.1` \) par le même patient\(`PA.HEV.1`\) envers la transaction de facture précédente\(`IV.TPA.1`\) de 4,50 $.

### Analyse avec transactions liées

BHIMA liant les transactions de cette manière, nous pouvons effectuer les analyses suivantes:

1. Quel est le solde du compte du patient `PA.HEV.1` après ces opérations?

Nous pouvons prendre les lignes qui ont `PA.HEV.1` comme **Entity**et additionner leurs valeurs comme suit:

| Transaction | Record | **Compte** | Débit | Crédit | Entité | Référence |
| --- | --- | --- | --- | --- | --- | --- |
| TRANS1 | IV.TPA.1 | 410001 | 10,00 $ | | PA.HEV.1 | |
| TRANS2 | CP.TPA.1 | 410001 | | 4,50 $ | PA.HEV.1 | IV.TPA.1 |
| | | | **10,00 $** | **4,50 $** | | - |

Le solde du compte `PA.HEV.1` est de **10,00 $ - 4,50 $** **= 5,50 $**. Comme le signe est positif, nous disons que «PA.HEV.1» a un solde débiteur.

1. Quel est le solde de la facture «IV.TPA.1»?

Cette fois, nous rassemblons la facture via son _record_`IV.TPA.1`, ainsi que toutes les transactions associées via son _reference_ `IV.TPA.1`, comme indiqué ci-dessous:

| Transaction | Record | **Compte** | Débit | Crédit | Entité | Référence |
| --- | --- | --- | --- | --- | --- | --- |
| TRANS1 | IV.TPA.1 | 410001 | 10,00 $ | | PA.HEV.1 | |
| TRANS2 | CP.TPA.1 | 410001 | | 4,50 $ | PA.HEV.1 | IV.TPA.1 |
| | | | **10,00 $** | **4,50 $** | | - |

Sans surprise, le solde de la facture «IV.TPA.1» correspond à **10,00 $ - 4,50 $ = 5,50 $**.

## états de transaction

Une transaction est dans l'un des deux états suivants: _unposted_ et _posted_. Les transactions _non postées_ peuvent être éditées et supprimées tandis que les transactions _postées_ sont inaltérables. Toutes les transactions commencent dans l'état _posted_, peu importe leur origine. Cela indique qu'ils n'ont pas été validés par un comptable et qu'ils resteront dans cet état jusqu'à ce qu'un comptable les publie dans le grand livre.

Les transactions non postées et les transactions enregistrées sont indiquées par un point bleu clair et un point orange clair, respectivement.

Les transactions sont enregistrées dans le grand livre en procédant comme suit:

1. Les transactions sont auditées et éditées si nécessaire dans le journal.
2. Le comptable sélectionne une ou plusieurs transactions pour exécuter une [Balance de vérification](# #trial-balance).
3. La balance de vérification affiche l'effet des transactions sur les soldes des comptes. Si des erreurs sont détectées par l'application ou si le comptable observe des transactions incohérentes, il peut revenir à l'étape \(1\).
4. Une fois la balance de vérification vierge générée, le comptable soumet la balance de contrôle en enregistrant les transactions dans le grand livre.
5. Si le journal est dans sa configuration par défaut, les transactions seront filtrées de la vue, indiquant qu'elles ont été enregistrées dans le GL.

Dans les deux états, les transactions peuvent être modifiées en [modifiant une transaction](./editing-transactions.md).

## Types de transaction

Chaque transaction dans le système a un type de transaction. Les types de transaction facilitent les analyses ultérieures en étiquetant chaque transaction avec une balise descriptive. Ceux-ci sont généralement regroupés dans les types suivants:

* **Produits**
* **Charges**
* **Personnalisé**

Une transaction ne peut avoir qu'un seul type de transaction. Vous pouvez ajouter vos propres types de transaction via le module Type de transaction.
