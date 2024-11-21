RELEASES
--------

Releases are partially automated in BHIMA.  This document is a checklist of things that need to be done before a release and the steps to creating a new release.

The directions below assume you are working in a development environment based on a fork of the main BHIMA repository on github.

1. Checkout Bhima 'master' from your fork of https://github.com/Third-Culture-Software/bhima
2. Do `git pull` to make sure it is up-to-date.
3. Create a new branch called `release-next` (for example) that is based on the upstream repo to do your release with.  If one exists on upstream, remove it first.  For example, if the main BHIMA githup repo is called `upstream` in your local development setup, do:
  - `git checkout -b release-next upstream/master`
4. Run `npm install` to ensure you have the latest dependencies.
5. (Optional, best practice) Test the latest migration script on a production database. (See * below)
6. Build the application in production mode to make sure the build works correctly.
  - `NODE_ENV=production npm run build`
7. Determine the version number for the next version (eg, `v1.X.Y`)
8. Create a new folder in the `server/models/migrations/` directory to hold the migration file with the format `v1.A.B-v1.X.Y` where `1.A.B` is the current version and `v1.X.Y` is the next version.
9. Move the `server/models/migrations/next/migrate.sql` file to the directory created in the previous step.
10. Create an empty `migrate.sql` file in `server/models/migrations/next/`.  You may insert a comment at the top of the file including the name of the new release version.
11. Commit any updated files (`git commit ...`)
12. Push your branch to the BHIMA upstream repo:
  - `git push --set-upstream upstream release-next`
13. In github, convert your branch to a PR in the `IMA-WorldHealth/bhima` repository.
14. Make sure your personal GITHUB_TOKEN environment variable is defined
    (assuming you have permissions to update the main BHIMA repository.  [See Github instructions for this.](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
15. Run `npm run release` and follow the directions.
16. Verify the release was created and that the binary <version>.tar.gz file
    is in the assets for the release.
17. Via the github interface, merge your `release-next` PR into `master`

(*) Optional, Best Practice: Test the latest database changes on a production database.

1. Change your `.env` so the `$DB_NAME` variable is the correct one for a production database.
2. Create your database migration script by running `npm run migrate`.  This will create a release migration file `migration-$DB_NAME.sql`.
3. Append the current migration file into the release migration file:
 - `cat server/models/migrations/next/migrate.sql >> migration-$DB_NAME.sql`.
4. Build the migration script targetting your database.
 - `mysql $DB_NAME < migration-$DB_NAME.sql`
5. If no errors occur, remove the file `migration-$DB_NAME.sql` to prevent it from getting checked into SQL.
