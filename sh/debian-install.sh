#!/bin/bash

# This script is designed to be run on a freshly installed
# version of Debian 12.  It will setup the BHIMA application
# using docker and systemd.

# bash strict mode
set -euo pipefail

echo "Welcome to the BHIMA installation script."

# Default values for global variables
default_bhima_port=8080
default_bhima_db_name=bhima
default_bhima_db_host=127.0.0.1
default_bhima_db_password=$(openssl rand -hex 45)

# Prompt user for input, use default if no input is provided
read -p "Enter BHIMA Port (default: $default_bhima_port): " BHIMA_PORT
BHIMA_PORT=${BHIMA_PORT:-$default_bhima_port}

read -p "Enter BHIMA Database Name (default: $default_bhima_db_name): " BHIMA_DB_NAME
BHIMA_DB_NAME=${BHIMA_DB_NAME:-$default_bhima_db_name}

read -p "Enter BHIMA Database Host (default: $default_bhima_db_host): " BHIMA_DB_HOST
BHIMA_DB_HOST=${BHIMA_DB_HOST:-$default_bhima_db_host}

read -p "Enter BHIMA Database Password (default: generated): " BHIMA_DB_PASSWORD
BHIMA_DB_PASSWORD=${BHIMA_DB_PASSWORD:-$default_bhima_db_password}

echo "Upgrading operating system & package dependencies..."

## update all package dependencies
sudo apt-get update && sudo apt-get full-upgrade -y

echo "Installing chromium and other needed tools..."

# install chromium for pdf rendering, curl, nginx, and dependencies
# for docker
sudo apt-get install curl unattended-upgrades screen default-mysql-client \
  dbus-user-session uidmap nginx ca-certificates curl gnupg \
  chromium libx11-xcb1 libxcomposite1 libasound2 \
  libatk1.0-0 libatk-bridge2.0-0 libcairo2 libcups2 \
  libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 \
  libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 \
  libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
  libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 \
  libxrender1 libxss1 libxtst6 -y

# add the CHROME_BIN variable to the user home directory.
CHROME_BIN=$(which chromium)
if ! grep -q "CHROME_BIN" ~/.bashrc; then
  echo "export CHROME_BIN=$(which chromium)" >>~/.bashrc
  echo 'export CHROME_OPTIONS="--headless"' >>~/.bashrc
  echo "export PUPPETEER_EXECUTABLE_PATH=$(which chromium)" >>~/.bashrc
  echo 'export PUPPETEER_SKIP_DOWNLOAD="true"'
fi

source ~/.bashrc

#
# NODE.JS INSTALL
#

echo "Installing NodeJS"

# install LTS version of NodeJS from the NodeSource repositories
#
if [ -f "/etc/apt/keyrings/nodesource.gpg" ]; then
    echo "Nodesource GPG keyring already exists, skipping creation."
else
    echo "Nodesource GPG keyring not found, creating..."
    # Commands to create the Nodesource GPG keyring
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
fi

# add the node repository for the latest LTS version (20)
NODE_MAJOR=20
echo "Using NodeJS v$NODE_MAJOR."
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg arch=amd64] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list

# install nodejs
sudo apt-get update && sudo apt-get install nodejs -y
sudo npm i npm@latest -g

#
# DOCKER INSTALL
#

if ! command -v docker &>/dev/null; then
  echo "Docker not found, installing..."
  curl -fsSL https://get.docker.com -o ~/get-docker.sh
  sh ~/get-docker.sh

  # install docker in rootless mode.  You must run this as the BHIMA user.
  dockerd-rootless-setuptool.sh install

  # add docker environmental variables to bashrc script

  if ! grep -q "DOCKER_HOST" ~/.bashrc; then
    echo 'export PATH=/usr/bin:$PATH' >>~/.bashrc
    echo 'export DOCKER_HOST=unix:///run/user/1000/docker.sock' >>~/.bashrc
  fi
else
  echo "Docker is already installed, skipping installation."
fi

if ! docker --version; then
  echo "Docker installation failed."
  exit 1
fi

source ~/.bashrc

# ensure that docker starts on boot
systemctl --user enable docker
sudo loginctl enable-linger $(whoami)

#
# DOCKER CONFIGURATION
#

if docker image inspect redis &> /dev/null; then
  echo "Redis Docker image already exists, skipping creation."
else
  # install redis with docker
  docker run --name redis -p 6379:6379 --restart unless-stopped -d redis
fi

if [ $(docker ps -q -f name="mysql") ]; then
  echo "MySQL Docker image already exists, skipping creation."
  echo "MySQL is running"
else
  # configure mysql
  MYSQL_PASSWORD=$(openssl rand -hex 35)

# create ~/.my.cnf for easy access
cat <<EOF >~/.my.cnf
[mysql]
user=root
password=$MYSQL_PASSWORD
host=127.0.0.1
EOF

# install mysql with docker.  This is version 8.2
docker run --name mysql -p 3306:3306 \
  --restart unless-stopped \
  -e MYSQL_ROOT_PASSWORD=$MYSQL_PASSWORD \
  -e MYSQL_ROOT_HOST=% \
  -d mysql:8.2 \
  --character-set-server=utf8mb4 \
  --sql-mode=STRICT_ALL_TABLES,NO_UNSIGNED_SUBTRACTION \
  --default-authentication-plugin=mysql_native_password

  # wait for mysql to boot
  sleep 3
fi


#
# NGINX CONFIGURATION
#

echo "Configuring nginx..."

FILE="/etc/nginx/sites-available/bhima"
if [ ! -f "$FILE" ]; then
# create BHIMA server file
    sudo tee -a "$FILE" >/dev/null <<EOF
server {
 server_name bhima;
 # turn on gzip compression by including config
 include includes/gzip.conf;
 location / {
   proxy_pass http://127.0.0.1:$BHIMA_PORT;
   proxy_http_version 1.1;
   proxy_set_header Upgrade \$http_upgrade;
   proxy_set_header Connection 'upgrade';
   proxy_set_header Host \$host;
   proxy_cache_bypass \$http_upgrade;
 }

  listen 80;
}
EOF
else
    echo "File $FILE already exists, skipping creation."
fi

# make directory for includes
sudo mkdir -p /etc/nginx/includes/

FILE="/etc/nginx/includes/gzip.conf"
if [ ! -f "$FILE" ]; then
  sudo tee -a "$FILE" >/dev/null <<EOF
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
EOF
else
    echo "File $FILE already exists, skipping creation."
fi

# link the  bhima file to enable it
if [ ! -f "/etc/nginx/sites-enabled/bhima" ]; then
  sudo ln -s /etc/nginx/sites-available/bhima /etc/nginx/sites-enabled/
fi

# remove the old default file
if [ -f "/etc/nginx/sites-enabled/default" ]; then
  sudo rm /etc/nginx/sites-enabled/default
fi

sudo systemctl restart nginx

#
# BHIMA INSTALL
#

echo "Downloading and install latest version of BHIMA"

# create the apps/ directory
mkdir -p $HOME/apps
cd $HOME/apps

# get the latest release tar.gz
release_url=$(wget -qO- "https://api.github.com/repos/ima-worldhealth/bhima/releases/latest" | grep "browser_download_url.*tar\.gz" | cut -d '"' -f 4 | awk '{$1=$1};1')

# download the release
wget "$release_url" -O "bhima.tar.gz"

# unpack the released BHIMA file into bhima.tar.gz
tar xf bhima.tar.gz

# get the untar'd directory
BHIMA_DIR="$(pwd)/$(ls -td -- */ | head -n 1)"

# make a softlink from the BHIMA directory to $HOME/apps/bhima
ln -s $BHIMA_DIR bhima

# copy required files out of the bin directory
cd $HOME/apps/bhima
cp ./bin/package.json .
cp ./bin/.env .env

# install the nodejs dependencies
npm install --omit=dev

# create the BHIMA user and schema
mysql -e "CREATE USER 'bhima'@'%' IDENTIFIED WITH 'mysql_native_password' BY '$BHIMA_DB_PASSWORD';"
mysql -e "GRANT ALL PRIVILEGES ON *.* TO 'bhima'@'%';"
mysql -e "CREATE schema $BHIMA_DB_NAME;"

sed -i "s/DB_PASS='password'/DB_PASS=$BHIMA_DB_PASSWORD/" .env
sed -i "s/DB_HOST='localhost'/DB_HOST=$BHIMA_DB_HOST/" .env
sed -i "s/DB_NAME='bhima_test'/DB_NAME=$BHIMA_DB_NAME/" .env
cp .env bin/

echo "Building initial mysql database..."

echo "[ build ] database schema"
mysql "$BHIMA_DB_NAME" < $HOME/apps/bhima/bin/server/models/01-schema.sql || { echo "failed to build DB scheme" ; exit 1; }
echo "[ build ] functions"
mysql "$BHIMA_DB_NAME" < $HOME/apps/bhima/bin/server/models/02-functions.sql || { echo "failed to import functions into DB" ; exit 1; }

echo "[ build ] procedures"
mysql "$BHIMA_DB_NAME" < $HOME/apps/bhima/bin/server/models/03-procedures.sql || { echo "failed to import procedures into DB 1/2" ; exit 1; }

mysql "$BHIMA_DB_NAME" < $HOME/apps/bhima/bin/server/models/98-admin.sql || { echo "failed to import procedures into DB 2/2" ; exit 1; }

echo "[ build ] triggers"
mysql "$BHIMA_DB_NAME" < $HOME/apps/bhima/bin/server/models/04-triggers.sql

echo "[ build ] default data"
mysql  "$BHIMA_DB_NAME" < $HOME/apps/bhima/bin/server/models/05-icd10.sql || { echo "failed to import default data into DB 1/2" ; exit 1; }
mysql  "$BHIMA_DB_NAME" < $HOME/apps/bhima/bin/server/models/06-bhima.sql || { echo "failed to import default data into DB 2/2" ; exit 1; }

echo "[build] recomputing mappings"
mysql "$BHIMA_DB_NAME" -e "Call zRecomputeEntityMap();" || { echo "failed to recompute mappings 1/2" ; exit 1; }
mysql "$BHIMA_DB_NAME" -e "Call zRecomputeDocumentMap();" || { echo "failed to recompute mappings 2/2" ; exit 1; }

echo "[ /build ]"

cp .env bin/

#
# SYSTEMD CONFIGURATION
#

FILE="/etc/systemd/system/bhima.service"
if [ ! -f "$FILE" ]; then
  sudo tee -a "$FILE" >/dev/null <<EOF
# bhima.service
[Unit]
Description=The bhima server
Documentation=https://docs.bhi.ma
# NOTE: change this if you aren't using docker
After=docker.service

[Service]
Environment=NODE_ENV=production
Type=simple
User=bhima

# adjust this accordingly
WorkingDirectory=/home/bhima/apps/bhima/bin/

# adjust this accordingly
ExecStart=/usr/bin/node server/app.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF
else
    echo "File $FILE already exists, skipping creation."
fi

# reload system and start BHIMA
sudo systemctl daemon-reload
sudo systemctl start bhima
sudo systemctl enable bhima

echo "BHIMA is installed and listening on port $BHIMA_PORT"
