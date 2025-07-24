# Getting Started

## Preamble

Welcome!  Thank you for your interest in BHIMA.

This guide is intended to quickly get you up and running with BHIMA so that you can start
to explore the application first hand.

The first thing you'll want to do is [deploy on Digital Ocean](./deploying-digital-ocean).  Please come
back here after you have a running system.

You should now have BHIMA installed in a Digital Ocean droplet.

# Initial Configuration

BHIMA needs to know a few pieces of information before you can use it:

 1. Enterprise Information:
    a. The name of your enterprise.  This is shown on most printed documents.
    b. An abbreviation of 1-5 characters for suffixing and prefixing different records.
    c. The currency to report in.  This is the base currency of the enterprise, and should be the most commonly used for sales, purchases, and payments.
 2. (Optionally) a project.  Projects are namespaces - they allow you to classify transactions into different groups.  You can create more later.  By default, a project is created with the name of the enterprise if one is not provided.
 3. A administrative username and password.  Note that BHIMA doesn't set a default username/password, you must create one.

Once these settings are in place, the server will generate an administrative user with full access to the system and redirect you to the login screen.
