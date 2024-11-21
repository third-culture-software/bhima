# Codes-barres

Les codes-barres constituent un mécanisme efficace pour récupérer des documents avec une intervention minimale de l'utilisateur. BHIMA génère des codes-barres pour chaque reçu produit. Ce document décrit le fonctionnement des codes-barres dans BHIMA.

## Conventions de dénomination des enregistrements

_Note: il serait peut-être préférable de le mettre ailleurs_

En interne, BHIMA utilise la version 4 [universally unique identifiers (UUIDs)](https://en.wikipedia.org/wiki/Universally_unique_identifier#Version_4_.28random.29) comme clé primaire pour la plupart des enregistrements. Bien qu’ils présentent de nombreux avantages, être lisibles par l’homme n’en fait pas partie. Afin de faire référence facilement et de manière significative aux documents, nous avons développé une « référence » lisible par l'homme composée avec la syntaxe suivante :

```
${type}.${project}.${integer}
```

où `${type}` est le type de document à deux lettres, `${project}` est l'abréviation du projet qui a créé le document et `${integer}` est un identifiant entier croissant de manière monotone. Quelques exemples de ces références peuvent être « IV.TPA.123 », « VO.XYZ.333 », etc.

Les types suivants sont codés en dur dans le système :

1. `IV` -> Facture
2. `VO` -> Bon
3. `CP` -> Paiement en espèces
4. `SM` -> Mouvement de stock
5. `PA` -> Carte patient

Ainsi, la référence `PA.NXR.3` se lit comme "le troisième patient du projet NXR". De même, `VO.UOU.39410` est le "39410ème bon du projet UOU".

## Génération de codes à barres

Semblables aux références lisibles par l’homme, les codes-barres générés par le système ont une syntaxe spécifique. C'est:

```
${type}${8 premiers caractères de l'UUID}
```

Par exemple, un code-barres peut être `IVBBA182AF` qui désigne la _facture_ avec les 8 premiers caractères de l'uuid comme **BBA182AF**. Le code se trouve dans [server/lib/barcode.js](https://github.com/Third-Culture-Software/bhima/blob/master/server/lib/barcode.js).


Pourquoi utiliser 8 caractères ? Parce que les codes-barres sont larges et qu’il nous fallait un format adapté à un ticket thermique de 80 mm tout en restant lisible. Malgré leur obscurcissement, les codes-barres sont un alphabet, lu de gauche à droite. Plus de caractères créent un « mot » de code-barres plus long. Il est intéressant de noter que les codes QR ne présentent pas ce problème : ils augmentent plutôt la complexité du modèle de code QR. Mais les lecteurs de codes QR sont chers alors que les lecteurs de codes-barres sont bon marché.

## Comment les codes-barres sont lus dans BHIMA

Un lecteur de codes-barres se comporte comme un clavier. BHIMA utilise un composant de lecture de codes-barres (trouvé dans [client/src/modules/templates/bhBarcodeScanner.html](https://github.com/Third-Culture-Software/bhima/blob/master/client/src/modules/templates/bhBarcodeScanner.html)) pour faire tout le travail de lecture du code-barres. Le lecteur de code-barres renverra le `uuid` de l'enregistrement numérisé. C'est au contrôleur du module de déterminer ce qui doit se passer ensuite (rendre un reçu, le joindre à un objet, charger l'enregistrement depuis la base de données, etc.).

Étant donné qu'un lecteur de codes-barres se comporte comme un clavier, vous n'avez pas besoin d'un lecteur de codes-barres pour simuler une lecture de code-barres. Copier simplement une chaîne, ouvrir le composant de lecture de code-barres et coller (C-V) déclenchera la lecture avec le contenu que vous avez collé. Ceci est très utile lors du développement lorsque les lecteurs de codes-barres ne sont pas pratiques.
