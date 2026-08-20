> [Accueil](../../index.md) / [Gestion des stocks](../index.md) / [les mouvements des stocks](./index.md) / Entrée de stock

# Entrée de stock

Pour acceder au module des entrées de stock :

<div class = "bs-callout bs-callout-success">
  <p>Stock > <strong>Entrée de stock </strong> : ce module est permet de faire les opérations d'entrées de stock
  </p>
</div>

Pour faire des entrées de stock, vous devez avoir un ou plusieurs [dépôts](./depot.md) déjà crée.

Il faut noter que chaque opération d'entrée de stock (ou de sortie de stock) concerne des dépôts, vous devez séléctionner le dépot sur lequel les opérations d'entrées de stock seront effectuées.

<div class = "bs-callout bs-callout-danger">
  <h4>Attention</h4>
  <strong>Vérifier le dépot séléctionné</strong> : vous devez toujours vous rassurer que le dépôt séléctionné est le bon dépôt; si ce n'est pas le cas, allez dans <em>Menu > <strong>Changer de dépôt</strong></em> pour séléctionner le bon dépôt.
</div>

Le module d'entrées de stock dispose de quatre options pour les entrées de stock :
- **Achat** _(recommandée)_ : Si vous voulez faire entréer dans un dépôt les produits en provenance d'un achat sur base d'un bon de commande qui se trouve dans BHIMA.

- **Intégration** : l'intégration concerne des produits qui sont physiquement dans un dépot mais pas encore dans le système, et l'on souhaite les incorporer dans le système.

- **Donation** : Si vous voulez faire entrer dans un dépôt les produits en provenance d'une donation, elle est similaire à l'intégration mais avec une indication que c'est une donation.

- **Transfer** : Si vous voulez faire entrer dans un dépôt les produits en provenance d'un autre dépôt.

## Achat

Pour entrer le stock en provenance d'un achat :
- Cliquer sur le bouton `Achat`
- Séléctionner le bon de commande, puis cliquer sur soumettre dans la fenêtre des bons de commande
- Vérifier :
  - La date
  - La description
  - Le code et la déscription des produits
- Définissez les lots en cliquant sur `lots`
  - La quantité globale correspond à la quantité totale du produit ou article que l'on veut entrer en stock
  - Le coût unitaire : correspond au coût d'achat de l'unité
  - Insérer les lots en définissant :
    - Le lot (batch numer)
    - La quantité du lot
    - La date d'expiration du lot
  - Cliquer sur soumettre pour valider les lots.
- Cliquer sur soumettre pour valider l'entrée des stocks.
- Un document apparait renseignant l'entrée en stock par achat.

## Integration

Pour entrer le stock par intégration :
- Cliquer sur le bouton `Intégration`
- Vérifier :
  - La date
  - La description
- Insérer les inventaires en cliquant sur le bouton `Ajouter`
- Définissez les lots en cliquant sur `lots` de chaque inventaire
  - La quantité globale correspond à la quantité totale du produit ou article que l'on veut entrer en stock
  - Le coût unitaire : correspond au coût d'achat de l'unité
  - Insérer les lots en définissant :
    - Le lot (batch numer)
    - La quantité du lot
    - La date d'expiration du lot
  - Cliquer sur soumettre pour valider les lots.
- Cliquer sur soumettre pour valider l'entrée des stocks.
- Un document apparait renseignant l'entrée en stock par intégration

## Donation

Pour entrer le stock par donation la procédure est la même que celle avec l'intégration mais il faut cliquer sur le bouton `Donation`

## Transfer

Pour entrer le stock en provenance d'un autre dépot :
- Cliquer sur le bouton `Transfert`
- Séléctionner le bon mouvement sur base de la reférence du mouvement, puis cliquer sur soumettre dans la fenêtre des transferts
- Vérifier :
  - La date
  - La description
  - Le code et la déscription des produits
- Le lot est déjà défini
- Cliquer sur soumettre pour valider l'entrée des stocks.
- Un document apparait renseignant l'entrée en stock par achat.

