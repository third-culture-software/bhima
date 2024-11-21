UPGRADING
--------

This file documents how to upgrade an existing BHIMA installation to a new release.  To learn about the releases process, see [RELEASES](./RELEASES.md).

Upgrading an existing installation takes three steps:

1. Preparing the BHIMA software
2. Preparing the database
3. Running the upgrade

Steps 1 and 2 can happen in parallel and can be done at a leasurely pace.  The third step is destructive and will commit the changes, deploying the new version at the location.

These steps describe the typical deployment setup.  We assume that the BHIMA software is deployed in `$HOME/apps/`, `$VERSION` will be the next version name, and will refer to `$DATABASE` as the database name.

## Step 1: Peparing the BHIMA software

1. Go to https://github.com/Third-Culture-Software/bhima/releases/latest in your web browser.
2. Copy the link to the `$VERSION.tar.gz` file.
2. Connect to the server with SSH.
3. Start a `screen` session in case the connection drops during the upgrade.
4. Change directory into `$HOME/apps/`.
5. Download the latest release with `wget -c "$URL"` where $URL is the url you copied in step 2.  This will create `$VERSION.tar.gz` in the `$HOME/apps/` directory.
6. Unzip the release file with `tar xf $VERSION.tar.gz`.  This will create the folder `bhima-$RELEASE/` in the `$HOME/apps/` directory.
7. Copy the `.env` file from the current application into the `bhima-$RELEASE/bin/` folder and make any changes necessary to `.env`.
8. Copy the contents (but not sub-directories) from the `bhima-$RELEASE/bin/` folder into the `bhima-$RELEASE/` folder.  This can be done with `cp $HOME/apps/bhima-$RELEASE/bin/* $HOME/apps/bhima-$RELEASE/bin/`
9. Change directory into the release directory with `cd $HOME/apps/bhima-$RELEASE/`
10. Install the `node_modules/` in the `bhima-$RELEASE/` folder with the command: `NODE_ENV=production npm install`

The BHIMA upgrade is not prepared.

## Step 2: Preparing the database

Locally:
1. Download the latest production database from the BHIMA backups server for the site you are upgrading.
2. Build it locally.
3. Change the environmental variable `$DB_NAME` in the `.env` file in the bhima repository to the name of the site you are upgrading.
4. Run `npm run migrate` to create a migration script `migration-$DATABASE.sql`.
5. Copy in the migration files from up to the present version from the `server/models/migrations/` folder(s).  You can use `cat` for this.
6. Test the database migration script: `mysql $DATABASE < migration-$DATABASE.sql`
7. If it works, copy the database over to the remote server with `scp`:  `scp migration-$DATABASE.sql bhima@target.bhi.ma:~/`

The database is now prepared.

## Step 3: Run the upgrade
1. SSH into the production server.
2. Create a backup of the production database using `mysqldump`.  Typically, there is a `dump` routine available for you in `$HOME/tasks/dump.sh`.
3. Run the database migration file in the production: `mysql $DATABASE < migration-$DATABASE.sql`
4. Remove the `$HOME/apps/bhima` soft link (`rm $HOME/apps/bhima/`).
5. Create a new soft link pointing towards the new server:  `ln -s $HOME/apps/bhima-$VERSION/ $HOME/apps/bhima`
6. Restart the BHIMA server: `systemctl restart bhima`

## Step 4:  Make sure everything worked.
1. Check the journal logs: `journalctl -u bhima`
2. Reboot the server: `sudo reboot now`
3. Reconnect via SSH and check the journal logs again.
