# Installation de BHIMA

NB: ce sont les instructions pour installer l'environnement de développement BHIMA. Si vous souhaitez déployer BHIMA en production, consultez nos [instructions de déploiement pour Digital Ocean](../getting-started/deploying-digital-ocean.md).

Le logiciel BHIMA peut être complexe à installer. Nous ne prenons officiellement en charge que Linux. Le guide suivant suppose donc que vous configurez BHIMA dans un environnement Linux basé sur Debian.

Ce guide vous permettra de vous familiariser avec bhima localement. Veuillez noter que bhima est en développement actif et a tendance à aller vite et à casser des choses. Si vous êtes intéressé par les progrès du développement, envoyez-nous une ligne à [developers@imaworldhealth.org](mailto: developers@imaworldhealth.org).

### Dépendances

Avant de commencer le processus d'installation, assurez-vous que toutes les dépendances bhima sont installées localement. Nous ne testons que sous Linux. Il est donc préférable d’utiliser une version de Linux que vous connaissez bien. Assurez-vous d'avoir la version récente de:

1. [MySQL 8.4 LTS](http://dev.mysql.com/downloads/)
2. [Redis](https://redis.io)
3. [curl](https://curl.haxx.se/)
4. [NodeJS](https://nodejs.org/en/) \(nous vous recommandons d’utiliser le [gestionnaire de version de node](https://github.com/creationix/nvm) sous Linux. Notez que nous ne testons que sur des versions stables. et bord \).
5. [git](https://git-scm.com/downloads)

### Instructions détaillées sur l'installation des dépendances pour Ubuntu \(vérifiées/installées spécifiquement avec VirtualBox\)

```bash
# Exécutez la commande suivante pour mettre à jour les listes de paquets:
sudo apt-get update

#Installer MySQL avec la commande suivante:
sudo apt-get install mysql-server

# Exécutez les commandes suivantes pour installer Redis:
sudo apt-get install redis-server

# Exécutez les commandes suivantes pour installer curl:
sudo apt-get install curl

#Installer le gestionnaire de version de noeud localement
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | frapper

# Configurez les variables d'environnement pour le gestionnaire de version de noeud
export NVM_DIR = "$ HOME/.nvm"
[-s "$ NVM_DIR/nvm.sh"] && \. "$ NVM_DIR \ nvm.sh" # Ceci charge nvm

#Téléchargez NodeJS LTS
nvm install lts/*


# Exécutez la commande suivante pour installer git:
sudo apt-get install git
```

### Obtenir la source

Clonez la source à l'aide de git à partir du [référentiel github](https://github.com/Third-Culture-Software/bhima) à l'aide des commandes suivantes:

```bash
git clone https://github.com/Third-Culture-Software/bhima.git bhima
cd bhima
```

### Construire à partir de la source

Tous nos scripts de construction se trouvent dans le fichier `package.json`. Nous utilisons [gulpjs](http://www.gulpjs.com) en interne, mais vous ne devriez jamais avoir besoin d'appeler explicitement gulp.

Pour exécuter les scripts de construction, vous pouvez utiliser `yarn` ou` npm`. Nous utiliserons `npm` pour le reste de ce guide.
```bash
# Dans le répertoire bhima /
# installer tous les modules de noeuds

npm install

# Si cette commande vous donne une erreur (par exemple, si vous utilisez Parallels), essayez d’exécuter la commande suivante:
git config -global url. "https: //" .insteadOf git: //
```

Les dépendances devraient maintenant être définies!

BHIMA utilise des variables d'environnement pour se connecter à la base de données et basculer entre des fonctionnalités. Ceux-ci se trouvent dans le fichier `.env.sample` inclus dans le niveau supérieur du référentiel. Copiez les elements vers une fichier `.env` avec vos propres variables.

Avant de construire, éditez votre `.env` pour configurer vos paramètres de connexion à la base de données MySQL. Leurs variables doivent être explicites.

Utilisez la commande suivante pour modifier le fichier .env si vous le souhaitez \(apportez vos modifications, puis tapez ctrl + x pour quitter et enregistrer \):

```bash
cp .env.sample .env
nano .env
```

### Configurez l'utilisateur bhima dans MySQL et construisez l'application.

```bash
# Exécutez les commandes suivantes pour créer l'utilisateur bhima dans MySQL afin qu'il puisse construire la base de données (assurez-vous que l'utilisateur et #password correspondent tous les deux à ce que vous avez défini dans le fichier .env):

sudo mysql -u root -p
CREATE USER 'bhima'@'localhost' IDENTIFIED BY 'mot de passe';
Accordez tous les privilèges sur *. * TO 'bhima'@'localhost';
#Utilisez ctrl + z pour revenir à l'invite du terminal principal
```

Ensuite, construisez l'application avec

```bash
# construire l'application

NODE_ENV="development" npm run build
```

### Création d'une base de données

_NOTE: BHIMA s'exécute dans _`sql_mode = 'STRICT_ALL_TABLES,NO_UNSIGNED_SUBTRACTION'`_. Bien qu'il ne soit pas nécessaire que cette option soit définie pour générer la base de données, les tests ne seront pas validés à moins que le code SQL correct \_MODE soit défini._

```bash
#Pour configurer MySQL avec ce paramètre, exécutez les commandes suivantes:
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# dans la section [mysqld], ajoutez le texte suivant:
sql-mode="STRICT_ALL_TABLES,NO_UNSIGNED_SUBTRACTION"

# sauvegarder, puis redémarrez mysql avec la commande suivante:
sudo systemctl restart mysql
```

Tu peux aussi utiliser docker avec mysql.  Le command pour le lancer est:
```bash
# demarrer docker sur port 3306

docker run --name mysql -p 3306:3306  \
  -e MYSQL_ROOT_PASSWORD=<MyPassword> \
  -e MYSQL_ROOT_HOST=%  \
  -d mysql:9.1  \
  --sql-mode='STRICT_ALL_TABLES,NO_UNSIGNED_SUBTRACTION'
```

Il faut changer le fichier `.env` pour mettre `DB_HOST` a `127.0.0.1`.


La structure de la base de données est contenue dans les fichiers `server/models/*.sql`. Vous pouvez les exécuter un par un dans l'ordre ci-dessous ou simplement lancer `npm run build: db`.

1. `server/models/01-schema.sql`
2. `server/models/04-triggers.sql`
3. `server/models/02-functions.sql`
4. `server/models/03-procedures.sql`
5. `server/models/98-admin.sql`

Ceci configure le schéma de base, les déclencheurs et les routines. Les scripts suivants créeront un ensemble de données de base avec lequel commencer à jouer:

1. `server/models/05-icd10.sql`
2. `server/models/06-bhima.sql`
3. `test/data.sql`

Vous pouvez exécuter tout cela en utilisant la commande suivante: `npm run build:db` Vous pouvez également utiliser le script`./sh/build-database.sh`, personnalisé à l'aide de vos variables d'environnement, comme indiqué ci-dessous:

```bash
# installer la base de données
DB_USER='moi' DB_PASS='MonPassword' DB_NAME='bhima' ./sh/build-database.sh
```

### Exécution de l'application

Exécuter l'application est super facile! Tapez simplement `npm run dev` dans le répertoire racine de l'application.

### Vérifier l'installation

Si vous avez modifié la variable `$PORT` dans le fichier`.env`, votre application écoutera sur ce port. Par défaut, il est `8080`.

Accédez à [https://localhost:8080](https://localhost:8080) dans le navigateur pour vérifier l'installation. Vous devriez être accueilli avec une page de connexion.

### Test de l'application

Nos tests sont répartis en tests unitaires, tests de bout en bout et tests d'intégration. Il y a plus d'informations sur les tests dans le [wiki](https://github.com/Third-Culture-Software/bhima/wiki).

1. **Tests d'intégration** - Ils testent l'intégration serveur + base de données et généralement nos API. Tous les points de terminaison API accessibles doivent généralement être associés à un test d'intégration. Pour les exécuter, tapez `test de fil: intégration`.
2. **Tests unitaires de serveur** - Les bibliothèques de serveur sont testées d'unité avec mocha et chai, de manière similaire aux tests d'intégration. Pour les exécuter, tapez
   `test de fil: unité-serveur.`
3. **Tests d'unité client** - Les composants client sont testés avec karma et doivent être installés si vous avez installé toutes les dépendances. Karma lance un navigateur chrome pour exécuter les tests. Pour les exécuter, tapez `test de fil: unité-client`.
4. **Tests de bout en bout** - L'ensemble de la pile est testée avec \(souvent flaky \) des tests de bout en bout à l'aide de [rapporteur](https://playwright.dev/).  Les tests de bout en bout peuvent être exécutés avec `npm run test:e2e`.

Vous pouvez exécuter tous les tests en tapant simplement `npm run test`.

Profitez de l'aide bhima!
