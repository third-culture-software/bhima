# Upgrading BHIMA

This page provides notes on how upgrades to BHIMA work.  Note that these steps are quite manual, and we would like to automate them in the future.

## BHIMA Versions

BHIMA uses git tags to tag changes on the master branch and [Github Releases](https://help.github.com/en/github/administering-a-repository/managing-releases-in-a-repository) to cut releases.  The latest version is always the latest tag/release on git and Github respectively.  The [latest release](https://github.com/Third-Culture-Software/bhima/releases/latest) is always available from the link `https://github.com/Third-Culture-Software/bhima/releases/latest`.

While git effectively manages changes with code, some changes require changes to underlying production data - for example, adding a column to a database table, reassigning foreign keys, etc.  These changes are kept in the `server/models/migrations/` directory in the BHIMA repository.  Within this directory are a series of folders, named in the form `v.old.release-v.new.release`.  They contain a single SQL file (generally called `migrate.sql`) that is needed to upgrade from `v.old.release` to `v.new.release`.  For example, the file `v1.12.1-v1.13.0/migrate.sql` would migrate the database from version `1.12.1` to version `1.13.0`.

New changes (e.g. unreleased changes) are kept in `server/models/migrations/next/` folder.  In preparation for a new release, these changes are combined and renamed into the format `v.old-release-v.new-release` described above.

Note: not all releases require changes to data structures.  Therefore, not all version changes will have an associated `migrate.sql` file.

When upgrading from an old version to a new version, it is important to run all `migrate.sql` files _in order_ from the oldest to the newest.  Unfortunately, once in a these files fail on a production database where changes were made without checking into the source code the data structure.  Please let us know if you find that.

## Notes on database migrations

Changes to stored procedures, triggers, and functions are **not** tracked in migration scripts.  This is because they are due to frequent change and are already stored in the `server/models` directory.  Therefore, it is sufficient to simply rebuild them from source.

To help with this operation, BHIMA provides a [migration helper script](https://github.com/Third-Culture-Software/bhima/blob/master/sh/setup-migration-script.sh) that can be invoked with `npm run migrate`.  This script does several things:

1. Drops all the triggers
2. Drops all routines
3. Combines triggers, functions, and procedures from source
4. Writes out data to `migration-$DATABASE.sql` file

where `$DATABASE` is the name of the production database.  Now that the data is written out, it is can be run on the production database with the command `mysql $DATABASE < migration-$DATABASE.sql`.  As with all operations on production databases, _always take a backup snapshot first._

## Getting the latest release

As mentioned above, releases are managed on Github.  There are two ways to obtain the latest release - either by downloading a zipped directory from Github or using git to pull the latest changes and check out the latest tag.  If you have deployed [from Digital Ocean](../getting-started/deploying-digital-ocean.md), the deployment was made via zip download and you must use that method.  Most development deployments are made with git and simply checking out the latest version is sufficient.

## Steps to Upgrade

The basic steps to upgrade now are:

1. Obtain the latest release either by downloading and unzipping or checking out the tag with git.
2. Run `npm install` to upgrade dependencies.
3. Run `NODE_ENV=production npm run build` to compile the latest client-side code
4. Run `npm run migrate` to create the migration script.
5. Run `mysql $DATABASE < migration-$DATABASE.sql` as described above.
6. Restart any running BHIMA instances

This should complete the steps to upgrading an existing BHIMA installation.
