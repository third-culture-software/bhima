> [Accueil](../index.md) / [Gestion des stocks](./index.md) / les inventaires

# Les inventaires

Les inventaires sont les informations sur des produits ou services qui peuvent être facturable, ou encore qui peuvent être stocké dans des dépots.

La différence entre inventaire et stock dans BHIMA est que l'inventaire est une information sur un produit (ou service) sans tenir compte de la quantité et du dépot concerné, alors qu'un stock concerne une inventaire, son lot, sa quantité et son dépôt.

### Registre des inventaires

Pour acceder au module lié aux inventaires :

<div class = "bs-callout bs-callout-success">
  <p>Inventaires > <strong>Registre des inventaires</strong> : ce module est un registre qui liste tous les inventaires du système, et permet d'en créer des nouveaux.
  </p>
</div>

Pour créer un nouveau inventaire il faut cliquer sur le bouton **Ajouter un inventaire** ce qui ouvrira une fenetre modal pour saisir les informations sur l'inventaire.

Il faut noter que l'inventaire exige certaines informations au préalable. ces pré-requis doivent exister dans le système avant de créer l'inventaire.

<div class = "bs-callout bs-callout-warning">
  <h4>Pré-requis</h4>
  <ul>
    <li>
      <strong>Groupe d'inventaire</strong>: le groupe d'inventaire contient les informations comptable <em>(les comptes de stock, de charge et de produit)</em> des inventaires de ce groupe
    </li>
    <li>
      <strong>Type d'inventaire</strong>: l'inventaire que l'on souhaite ajouté est un article, un service ou autre choses
    </li>
    <li>
      <strong>Unité ou forme galénique</strong>: l'unité de l'inventaire existe t-elle dans le système, sinon il faut ajouter cette unité.
    </li>
  </ul>
</div>

### Configurations

Ce module permet de créer des informations requises pour les inventaires, telles que :
- les groupes d'inventaires
- les types d'inventaires
- les unités d'inventaires

Pour acceder au module lié à la configuration des inventaires :

<div class = "bs-callout bs-callout-success">
  <p>
  Inventaires > <strong>Configuration</strong> : ce module permet de créer, d'éditer et de supprimer les groupes d'inventaires, les types d'inventaires et les unités d'inventaires.
  </p>
</div>

#### Les groupes d'inventaires

Un groupe d'inventaires est un regroupement d'inventaires qui partagent les mêmes :
- Compte de produit
- Compte de charge
- Compte de stock

Si au sein de l'entreprise, il y a des inventaires qui partagent ces trois comptes (produit, charge et stock) ou qui ont ces trois comptes en commun, il faut qu'il y ait un groupe d'inventaires dans BHIMA qui a ces trois comptes, et les inventaires concernés doivent avoir comme groupe d'inventaires ce groupe.

Les groupes d'inventaires ont comme pré-requis : les comptes, il faut que les comptes (produit, charge et stock) puissent exister dans BHIMA; s'ils n'existent pas, il faudrait les créer.

<div class = "bs-callout bs-callout-warning">
  <h4>Pré-requis</h4>
  <strong>Les comptes</strong>: voir le module compte dans Finance.
</div>

#### Les types d'inventaires

Dans BHIMA les inventaires peuvent être soit :
- Des articles
- Des services
- Des assemblages

S'il se fait qu'un type est manquant, vous pouvez facilement l'ajouter. Dans la section type d'inventaire, cliquez sur `Ajouter`.

#### Les unités ou forme galénique d'inventaires

L'unité consituté l'unité à considérer pour donner la quantité de l'inventaire dans le stock, ou encore la plus petite unité à considérer lors d'une facturation.

S'il se fait qu'une unité est manquante, vous pouvez facilement l'ajouter. Dans la section unité ou forme galénique d'inventaire, cliquez sur `Ajouter`.