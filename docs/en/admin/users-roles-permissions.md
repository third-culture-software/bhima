
# Users, Roles, and Permissions

The BHIMA application uses a role-based access control (RBAC) system to manage users, roles, and permissions. This allows administrators to define what actions users can perform within the application based on their assigned roles.  Users are assigned roles which contain a set of permissions.   All users who connect to BHIMA must have a role.

## User Management
The User Management module (`Admin > User Management`) provides the ability to create, update, and delete BHIMA application users.  New users can be added using the **Create User** button at the top of the module.  The **Create User** button opens a modal to add the details of the new user.  The following fields are required:

1. Display Name  - The name printed on official receipts and shown on associated records.
2. Login - the username associated with the account, used to log in to the application.
3. Email - an email address used to automatic emailing of reports and _eventually_ will be used for password resets.
4. Project - one or more projects the user has access to.
5. Password - A secret password that the user will use to sign in.  If the enterprise has strong password settings set, the user must pass a strength check to save their password.
6. Password (retype) - an identical password to the one above.

Once a user is created, they will appear in the users list.  Any user information can be updated at any time by accessing the `action` menu in the user registry, and selecting **Edit**.

An optional user field is the **Preferred Language** field, which allows users to indicate the language in which they prefer to receive reports and notification.  Note that this functionality is still under development.

Additionally, users can be assigned a **Cashbox** or **Depot** in the user management module.  This allows the user to access the cashbox or depot in the application, and is required for users who will be managing cashboxes or depots.  For more information, see [the documentation](./cashboxes-depots).

## Roles
Roles are collections of permissions to access specific modules, and may grant the user authority for specific actions, such as creating, reading, updating, or deleting data.  Users can be assigned one or more roles, which determine their access level and capabilities within the system.

The currently assigned roles for each user are visible in the column "roles" in the user list.  To assign or remove roles, click the dropdown menu in the user list and choose "assign roles".  This will open a modal with a list of available roles.  You can select one or more roles to assign to the user, and then click "Submit" to apply the changes.  The user will need to log out and log back in for the changes to take effect.

## Permissions
You can think of permissions as the modules in the user's navigation tree.  If a user has permission to a module, it will appear in their navigation tree at the left side of the application window.  If a user does not have permission to that module, it will be hidden.  If the user attempts to access a module that they do not have permission to use, they will be shown a 403 error page, indicating that they do not have access to the page.



