## Filtrage des données

La plupart des grilles ne chargent pas tous les enregistrements de la base de données. Au lieu de cela, ils chargent le jeu de données correspondant à un ensemble de filtres. Les filtres persistent entre les rechargements de page et les sessions. Tous les filtres de données sont configurés à partir d'un modal de recherche lié par un bouton dans l'en-tête du module. Les filtres de données sont classés en deux catégories: _default filters_ ou _custom filters_.

Les filtres par défaut sont présents sur presque toutes les grilles, surlignés en violet dans l'en-tête. Bien que les valeurs des filtres par défaut puissent être modifiées, elles ne peuvent pas être supprimées. Ils sont configurés dans l'onglet "Filtres par défaut" du modal de recherche. Les filtres par défaut courants sont les suivants:

1. **Limite** - contrôle le nombre d'enregistrements que le client tentera de télécharger. Cela garantit que l'application ne chargera pas plus de données que nécessaire. Parfois, une limite basse coupera les données que l'utilisateur souhaite voir, et il devrait augmenter la limite pour obtenir le jeu de données complet.

2. **Période** - définit les dates de début et de fin du jeu de données. Cela s'applique aux données transactionnelles, telles que les factures, les paiements en espèces, les bons d'achat et les transactions. La période a diverses valeurs prédéfinies telles que _today_, _yesterday_, _this month_, et autres, qui peuvent être utilisées pour choisir rapidement une plage de dates judicieuse. Pour des requêtes de date spécifiques, l'option _custom_ permet à l'utilisateur de choisir n'importe quelle date de début et de fin.

Les filtres personnalisés sont similaires aux filtres par défaut, bien qu'ils puissent être supprimés et rendus en bleu foncé. Ils sont configurés dans l'onglet "Filtres personnalisés" de la recherche modale. Ces filtres varient considérablement en fonction du module. Toutefois, en règle générale, le titre du paramètre flter est identique à celui de la colonne dans la vue en cours de filtrage. Par exemple, si un module a une colonne _reference_, l'utilisateur devra trouver l'entrée intitulée _reference_ pour configurer le filtre.

Tous les filtres sont additifs: les filtres `limit: 10`,`compte: X` et `period: today` téléchargeront les 10 premiers enregistrements du jeu de données avec le compte X à partir d’aujourd’hui.

Le filtrage des données nécessite une connexion en direct au serveur, car l'opération de filtrage est effectuée sur le serveur.

<div class = "bs-callout bs-callout-danger">
<h4> Vérifiez vos limites! </h4>
Faites attention! Toutes les grilles fournissent un décompte du nombre de lignes dans la grille. Si vous filtrez sur plusieurs paramètres et que le nombre de lignes de la grille est équivalent à la limite que vous avez définie, il se peut que vous ne disposiez pas de toutes les données recherchées. Augmentez la limite pour vous assurer que vous disposez de l'ensemble de données complet.
</div>