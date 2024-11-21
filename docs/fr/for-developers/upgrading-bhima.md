# Mise à niveau de BHIMA

Cette page fournit des notes sur le fonctionnement des mises à niveau de BHIMA. Notez que ces étapes sont assez manuelles, et nous aimerions les automatiser à l'avenir.

## Versions BHIMA

BHIMA utilise les balises git pour baliser les modifications sur la branche principale et [Versions de Github](https://help.github.com/en/github/administering-a-repository/managing-releases-in-a-repository) pour supprimer les versions.  La dernière version est toujours la dernière balise/version sur git et Github respectivement.  La [dernière version](https://github.com/Third-Culture-Software/bhima/releases/latest) est toujours disponible à partir du lien `https://github.com/Third-Culture-Software/bhima/releases/latest`.

Bien que git gère efficacement les modifications avec le code, certaines modifications nécessitent des modifications des données de production sous-jacentes - par exemple, l'ajout d'une colonne à une table de base de données, la réaffectation de clés étrangères, etc. Ces modifications sont conservées dans le répertoire `server/models/migrations/` dans le référentiel BHIMA. Dans ce répertoire se trouvent une série de dossiers, nommés sous la forme `v.old.release-v.new.release`.  Ils contiennent un seul fichier SQL (généralement appelé `migrate.sql`) qui est nécessaire pour passer de `v.old.release` à `v.new.release`.  Par exemple, le fichier `v1.12.1-v1.13.0/migrate.sql` migrerait la base de données de la version `1.12.1` vers la version `1.13.0`.

Les nouvelles modifications (par exemple les modifications non publiées) sont conservées dans le dossier `server/models/migrations/next/`. En préparation d'une nouvelle version, ces modifications sont combinées et renommées dans le format `v.old-release-v.new-release` décrit ci-dessus.

Remarque : toutes les versions ne nécessitent pas de modifications des structures de données. Par conséquent, toutes les modifications de version n'auront pas un fichier `migrate.sql` associé.

Lors de la mise à niveau d'une ancienne version vers une nouvelle version, il est important d'exécuter tous les fichiers `migrate.sql` _dans l'ordre_ du plus ancien au plus récent. Malheureusement, une fois entrés, ces fichiers échouent sur une base de données de production où des modifications ont été apportées sans vérifier dans le code source la structure des données. S'il vous plaît laissez-nous savoir si vous trouvez cela.

## Notes sur les migrations de bases de données

Les modifications apportées aux procédures stockées, aux déclencheurs et aux fonctions ne sont **pas** suivies dans les scripts de migration. En effet, ils sont dus à des changements fréquents et sont déjà stockés dans le répertoire `server/models`. Il suffit donc simplement de les reconstruire à partir des sources.

Pour faciliter cette opération, BHIMA fournit un [script d'aide à la migration](https://github.com/Third-Culture-Software/bhima/blob/master/sh/setup-migration-script.sh) qui peut être invoqué avec `npm run migrate`. Ce script fait plusieurs choses :

1. Supprime tous les déclencheurs
2. Supprime toutes les routines
3. Combine les déclencheurs, les fonctions et les procédures de la source
4. Écrit les données dans le fichier `migration-$DATABASE.sql`

où `$DATABASE` est le nom de la base de données de production. Maintenant que les données sont écrites, elles peuvent être exécutées sur la base de données de production avec la commande `mysql $DATABASE < migration-$DATABASE.sql`. Comme pour toutes les opérations sur les bases de données de production, _prenez toujours d'abord un instantané de sauvegarde._

## Obtenir la dernière version

Comme mentionné ci-dessus, les versions sont gérées sur Github. Il existe deux façons d'obtenir la dernière version : soit en téléchargeant un répertoire compressé depuis Github, soit en utilisant git pour extraire les dernières modifications et consulter la dernière balise.  Si vous avez déployé [à Digital Ocean](../getting-started/deploying-digital-ocean.md), le déploiement a été effectué via un téléchargement zip et vous devez utiliser cette méthode. La plupart des déploiements de développement sont effectués avec git et il suffit de vérifier la dernière version.

## Étapes de mise à niveau

Les étapes de base pour mettre à niveau maintenant sont :

1. Obtenez la dernière version en téléchargeant et en décompressant ou en vérifiant la balise avec git.
2. Exécutez `npm install` pour mettre à niveau les dépendances.
3. Exécutez `NODE_ENV=production npm run build` pour compiler le dernier code côté client
4. Exécutez `npm run migrate` pour créer le script de migration.
5. Exécutez `mysql $DATABASE < migration-$DATABASE.sql` comme décrit ci-dessus.
6. Redémarrez toutes les instances BHIMA en cours d'exécution

Cela devrait terminer les étapes de mise à niveau d’une installation BHIMA existante.
