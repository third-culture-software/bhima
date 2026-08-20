# Grand livre général

Toutes les transactions valides se retrouveront un jour dans le grand livre. Il contient toutes les transactions financières effectuées depuis l’installation du système et alimente les capacités de reporting de BHIMA. Le terme «grand livre» désigne toutes les transactions approuvées et comptabilisées à partir du journal. Cependant, BHIMA contient également un module appelé "**Grand livre**". Cette section décrit le module Grand livre.

Le module Comptabilité générale est une matrice de tous les comptes de l'entreprise classés en lignes par chaque période d'un exercice comptable en colonnes. Les cellules de la matrice contiennent le solde du compte sur la ligne pour la période sur la colonne. Il existe deux colonnes supplémentaires: la colonne **Solde d'ouverture** et la colonne **Solde**. Comme son nom l'indique, le solde d'ouverture correspond au solde au début de l'exercice, tandis que la colonne des soldes récapitule les valeurs du solde d'ouverture et de chaque période. Voir le tableau ci-dessous pour une représentation simplifiée:

_En tête_ | Numéro de compte | Solde d'ouverture | Janvier | Février | Balance
---       | ---              | ---               | ---     | ---     | ---
_Corps_   | 1001             | 25,00 $           | 1,13 $  | 2,27 $  | 25 $
_Pied_    |                  |                   |         |         |

Vous remarquerez que chaque colonne a une somme au bas de la colonne. _Cette valeur devrait toujours être 0_. Si la valeur n'est pas égale à zéro, cela signifie qu'il existe des informations manquantes ou incohérentes quelque part dans la période, probablement issues d'une transaction non équilibrée.