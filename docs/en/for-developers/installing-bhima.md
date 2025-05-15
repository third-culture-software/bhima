# Installing BHIMA

_Note: these are the instructions for installing the BHIMA development environment.  If you wish to deploy BHIMA in production, check out our [deployment instructions for Digital Ocean](../getting-started/deploying-digital-ocean.md)._

The BHIMA software can be complex to install.  We only officially support Linux, so the following guide assumes you are setting up BHIMA on Debian-based Linux environment.

Note: if you are running on the x64 architecture, you may consider [installing BHIMA using docker](./installing-bhima-with-docker.md).

This guide will get you up and running with bhima locally. Please note that bhima is under active development and tends to move fast and break things. If you are interested in development progress, shoot us a line at [developers@imaworldhealth.org](mailto:developers@imaworldhealth.org).

### Dependencies

Before you begin the installation process, please make sure you have all the bhima dependencies installed locally. We only test on Linux, so your best bet is to use a Linux flavor you are familiar with. Please make sure you have recent version of:

1. [MySQL 8.4 LTS](http://dev.mysql.com/downloads/)
2. [Redis](https://redis.io)
3. [curl](https://curl.haxx.se/)
4. [NodeJS](https://nodejs.org/en/) \(Note that we only test on stable and edge\).
5. [git](https://git-scm.com/downloads)

### Detailed dependency installation instructions for Ubuntu

Some of the following instructions assume Ubuntu 22.04 and Node.js 22 LTS.  Update these versions as needed.

```bash
# Run the following command to update the package lists:
sudo apt-get update

# Run the following command to install git:
sudo apt-get install -y git

# Install MySQL with the following command:
# (On Debian 12, check [Installing MySQL on Debian](https://www.digitalocean.com/community/tutorials/how-to-install-the-latest-mysql-on-debian-10) )
sudo apt-get install -y mysql-server

# Run the following commands to install Redis:
sudo apt-get install redis-server

# Run the following commands to install curl:
sudo apt-get install curl

# To find the latest LTS version of nodejs, visit https://nodejs.  For latest install
# directions, see https://github.com/nodesource/distributions#debian-and-ubuntu-based-distributions
sudo apt-get install -y ca-certificates curl gnupg
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
NODE_MAJOR=22
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
sudo apt-get update
sudo apt-get install nodejs

# Verify that nodejs and npm are installed as expected
npm --version
node --version

```bash

# Install chromium browser
# (On debian, you will also need to install 'chromium-driver' separately)
sudo apt install chromium-browser

# Install extra needed dependencies
# (On Debian, check the `Dockerfile` for other dependencies)
sudo apt-get install libx11-xcb1 libxcomposite1 libasound2 libatk1.0-0 libatk-bridge2.0-0 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6
```

We suggest putting the following line into your .bashrc file and restarting your shell session:

```bash
export CHROME_BIN=`which chromium`
export CHROME_OPTIONS="--headless"
```

```bash
# Verify that chromium and chromedriver have the same version
chromium --version
chromedriver --version
```

### Getting the source

Clone the source using git from the [github repository](https://github.com/Third-Culture-Software/bhima) using the following commands:

```bash
git clone https://github.com/Third-Culture-Software/bhima.git bhima
cd bhima
```

### Building from source

All our build scripts are found the `package.json` file. We use [gulpjs](http://www.gulpjs.com) internally, but you shouldn't ever need to call gulp explicitly.

To execute the build scripts, you can use either `yarn` or `npm`.  We'll use `npm` below.
```bash
# Inside the bhima/ directory
# install all node modules

npm install

#If this command gives you an error (I.E. if you’re running Parallels), try running the following command:
git config -global url."https://".insteadOf git://
```

The dependencies should now be set!

BHIMA uses environmental variables to connect to the database and toggle features. These are found in the `.env.sample` file included in the top level of the repository. You'll need to set these in a `.env` file to be read by the application at runtime.

Before building, create your `.env` file based on the sample template to set up your MySQL database connection parameters. The variables should be self-explanatory.

Use the following command to edit the .env file if desired \(make your changes and then type ctrl + x to exit and save\):

```bash
cp .env.sample .env
nano .env
```

### Configure the bhima user in MySQL and build the app

```bash
# Run the following commands to create the bhima user in MySQL, so that it can build the database (make sure the user and 'password' both match what you set in the .env file):

sudo mysql -u root -p
CREATE USER 'bhima'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON *.* TO 'bhima'@'localhost';
FLUSH PRIVILEGES;
# Use ctrl + z to get back to the main terminal prompt
```


Then, build the app with:

```bash
# build the application

NODE_ENV="development" npm run build
```

### Creating a database

_NOTE: BHIMA runs in `sql_mode="STRICT_ALL_TABLES,NO_UNSIGNED_SUBTRACTION"`. While it is not necessary to have this set to build the database, the tests will not pass unless the correct SQL\_MODE is set._

```bash
# To configure MySQL with this setting, run the following commands:
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Under the section [mysqld], add in the following text:
sql-mode = "STRICT_ALL_TABLES,NO_UNSIGNED_SUBTRACTION"

# Save and quit, then restart mysql with the following command:
sudo systemctl restart mysql
```

To start a MySQL server using docker you can use:

```bash
# In this example, we use "mysql" as the tag name
docker run --name mysql -p 3306:3306  \
  -e MYSQL_ROOT_PASSWORD=<MyPassword> \
  -e MYSQL_ROOT_HOST=%  \
  -d mysql:9.1  \
  --sql-mode='STRICT_ALL_TABLES,NO_UNSIGNED_SUBTRACTION'

# give it a few seconds, and MySQL will be started and listening on port 3306
```

This will start a MySQL server that listens on port 3306 (the default MySQL port) on your localhost.  Additionally, you have to set `DB_HOST` in the `.env` file to `127.0.0.1`, leaving it to `localhost` will make the `mysql` command trying to connect via socket, what is not possible when using docker.

Note that you can also run redis using docker if you prefer:

```bash
docker run --name redis -p 6379:6379 -d redis
```

If you have already a MySQL server running on port 3306 of your local machine, start docker without the port-forwarding (`-p 3306:3306`), use `docker inspect mysql` to find the IP of the container and use that IP in the `.env` file as `DB_HOST`.

The database structure is contained in the `server/models/*.sql` files. You can execute these one by one in the order below, or simply run `npm run build:db`.

1. `server/models/01-schema.sql`
2. `server/models/02-functions.sql`
3. `server/models/03-procedures.sql`
4. `server/models/98-admin.sql`
5. `server/models/04-triggers.sql`


This sets up the basic schema, routines, and triggers. The following scripts will build a basic dataset to begin playing around with:

1. `server/models/05-icd10.sql`
2. `server/models/06-bhima.sql`
3. `test/data.sql`

You can run all this by using the following command: `npm run build:db` Alternatively, you might use the `./sh/build-database.sh` script, customized with your environmental variables as shown below:

```bash
# Install the database
DB_USER='<MyUser>' DB_PASS='<MyPassword>' DB_NAME='bhima' ./sh/build-database.sh
```

If you are creating a fresh build for a new production site, you should probably start with:

```bash
npm run build:clean
```
And the databases to be loaded will need to be customized for that site.

### Running the Application

Running the application is super easy! Just type `npm run dev` in the application root directory.

### Verify the Install

If you changed the `$PORT` variable in the `.env` file, your application will be listening on that port. By default it is `8080`.

Navigate to [http://localhost:8080](http://localhost:8080) in the browser to verify the installation. You should be greeted with a login page.

### Testing the Application

Our tests are broken into unit tests, end to end tests, and integration tests. There is more information on testing in the [wiki](https://github.com/Third-Culture-Software/bhima/wiki).

1. **Integration Tests** - These test the server + database integration and generally our APIs. All reachable API endpoints should generally have an integration test associated with them. To run them, type `npm run test:integration`.
2. **Server Unit Tests** - Server libraries are unit tested with mocha and chai, similar to the integration tests. To run them, type
   `npm run test:server-unit.`
3. **Client Unit Tests** - Client components are unit tested with karma which you should have installed if you installed all dependencies. Karma launches a chrome browser to execute the tests. To run them, type `npm run test:client-unit`.
4. **End to End Tests** - The entire stack is tested with end to end tests using [playwright](https://playwright.dev/).  To enable the end-to-end tests, see [Running end-to-end tests](./end-to-end-tests.md).
You can run the end-to-end tests with
- `npm run test:e2e-account`  _or_
- `npm run test:e2e-all` _or_
- `npm run test:e2e-?` _(where ? varies from 1 to 8)_.

Note: test:e2e-3 includes test:e2e-account.

You can run all non-end-to-end tests by simply typing `npm run test`.

Enjoy using bhima!
