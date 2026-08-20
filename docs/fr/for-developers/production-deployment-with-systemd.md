# Déploiement en production avec Systemd

Ce guide vous expliquera le déploiement de BHIMA à l'aide de systemd pour la gestion des processus et des journaux et d'un nginx pour équilibrer la charge entre plusieurs instances de Node.js. Ces instructions ont été testées sur Ubuntu 20.04.

### Gestion des processus avec SystemD

Créez un fichier appelé `bhima@.service` dans le répertoire `/etc/systemd/system/`.  C'est un [systemd unit file](https://www.freedesktop.org/software/systemd/man/systemd.unit.html) qui démarrera BHIMA sur un port spécifié. En supposant que l'utilisateur est `bhima` et que l'installation de BHIMA se trouve dans `/home/bhima/apps/bhima`,le contexte du fichier sera:

```systemd
# bhima@.service
[Unit]
Description=The bhima server
Documentation=https://docs.bhi.ma
After=network.target

[Service]
Environment=NODE_ENV=production PORT=%i
Type=simple
User=bhima

# adjust this accordingly
WorkingDirectory=/home/bhima/apps/bhima/bin/

# adjust this accordingly
ExecStart=/usr/bin/node server/app.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

[Plus d'information](https://www.freedesktop.org/software/systemd/man/systemd.syntax.html) sur la syntaxe des fichiers unités. Une fois le fichier en place, vous devez recharger le démon systemd.

```bash
systemctl daemon-reload
```


### Équilibrage de charge avec Nginx

Dans cet exemple, nous équilibrerons la charge sur trois serveurs Node.js en aval. Cependant, la meilleure pratique consiste à utiliser un maximum de processus `$(nproc - 1)`. Ajustez le fichier suivant en conséquence.

Créez un nouveau fichier de configuration nginx nommé `bhima` dans `/etc/nginx/sites-available/`.  Mettez la configuration suivante dans ce fichier:

```nginx
upstream bhima {

  # assurez-vous d'acheminer les requêtes vers le serveur qui a le moins de connexions
  # http://nginx.org/en/docs/http/load_balancing.html
  least_conn;

  # changez ces ports en fonction de ce que vous souhaitez équilibrer la charge
 # ajoutez/supprimez un serveur selon vos besoins. Ici, nous avons trois serveurs nodejs en aval
  server 127.0.0.1:3001;
  server 127.0.0.1:3002;
  server 127.0.0.1:3003;
}


# Serveur d'équilibrage de charge
server {

 # ajouter la configuration gzip (si vous le souhaitez)
 include includes/gzip.conf;

 # opt out of Google's FLOCK.
 add_header Permissions-Policy interest-cohort=();

 server_name _;

 # pass data to upstream server
 location / {
   proxy_pass http://bhima;
   proxy_http_version 1.1;
   proxy_set_header Upgrade $http_upgrade;
   proxy_set_header Connection 'upgrade';
   proxy_set_header Host $host;
   proxy_cache_bypass $http_upgrade;
  }
}
```

Pour être complet, le fichier `gzip.conf` situé dans `/etc/nginx/includes/gzip.conf` est :

```nginx
gzip on;
gzip_disable "msie6";

gzip_vary on;
gzip_proxied any;

gzip_comp_level 5;
gzip_buffers 16 8k; # see http://stackoverflow.com/a/5132440
gzip_http_version 1.1;
gzip_min_length 128;

gzip_types
        application/atom+xml
        application/javascript
        application/json
        application/ld+json
        application/manifest+json
        application/octet-stream
        application/rss+xml
        application/vnd.geo+json
        application/vnd.ms-fontobject
        application/x-font-ttf
        application/x-javascript
        application/x-web-app-manifest+json
        application/xhtml+xml
        application/xml
        font/opentype
        image/bmp
        image/svg+xml
        image/x-icon
        text/cache-manifest
        text/css
        text/javascript
        text/plain
        text/vcard
        text/vnd.rim.location.xloc
        text/vtt
        text/x-component
        text/x-cross-domain-policy
        text/xml;
```

Ce fichier configure un équilibre de charge qui transmet les requêtes à trois serveurs en aval sur les ports 3001, 3002 et 3003. Créez un lien symbolique entre `/etc/nginx/sites-available/bhima` dans `/etc/nginx/sites-enabled/bhima` pour s'assurer qu'il est actif. Testez la configuration nginx, puis rechargez :

```bash
# tester la configuration
nginx -t

# recharger la configuration
systemctl reload nginx
```

### Déploiement et redémarrage automatique

La touche finale au déploiement consiste à configurer le démarrage automatique au démarrage. Cela se fait facilement avec `systemctl activate bhima@${PORT}` où `${PORT}` est le port souhaité sur lequel exécuter BHIMA. Faites cela pour chaque serveur en aval.

```bash
# démarrer le serveur nodejs
systemctl start bhima@3001

# activer le démarrage au démarrage.
systemctl enable bhima@3001
```

Lorsque vous cURL `http://localhost`, vous devriez maintenant accéder au serveur BHIMA via nginx.

### Gestion des journaux

Parce que nous utilisons systemd, les journaux sont gérés avec [journald](https://www.man7.org/linux/man-pages/man8/systemd-journald.service.8.html).  Pour surveiller les journaux des serveurs ci-dessus, la ligne suivante affichera les journaux en temps réel :

```bash
# suivez et suivez tous les journaux de bhima
journalctl -u bhima@* --follow
```

Il peut être important, lors d'une installation avec un espace disque faible, d'ajuster la `SystemMaxUse` et `SystemMaxFileSize` paramètres dans `/etc/systemd/journald.conf`.
