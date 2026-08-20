# GLOSSARY

- **DEPOT** - A "depot" is a location where significant numbers of stock items
    are stored until they are needed.  The size and function of a Depot can
    vary from a large storehouse for handling transfers of drugs to a small
    pharmacy in a clinic for dispensing drugs to patients.

- **PHARMACY** - A location used to store and provide medications (and other
    related stock items) as needed by Patients, Services, or other Pharmacies.

  - Stock Pharmacy - A Stock Pharmacy is typically a local storage facility
       that receives stock from depots and suppliers and provides stock to
       other pharmacies.  A stock pharmacy does not generally dispense
       medications directly to patients.

  - Dispensing Pharmacy - A Dispensing Pharmacy (Pharmacie D'Usage in
       French) is a pharmacy that dispenses stock to patients, wards, and
       services.  Normally, stock is not transferred from Dispensing
       Pharmacies to other Pharmacies.

- **LOT** - A "Lot" is a collection of identical stock items that are usually
    purchased and tracked together.  For instance, a box of pills
    might be part of a lot of that type of medication.  But "Lot" is also a
    more general term.  For instance, a single piece of equipment may be
    purchased by itself but for stock tracking purposes, it would be
    considered to be in a lot of 1 stock item.

- **SERVICE** - In the BHIMA perspective, a "Service" is a department in the
    hospital such as "pediatrics", "ophthalmology", "internal medicine",
    "pharmacy", or "administration".  Services can be assigned invoices,
    consume medications, contain staff, and have both profit and loss centers.

- **STOCK** - "Stock" are any items used in the operation of a hospital or
    clinic.  Examples include drugs for treating patients, medical equipment
    and supplies, and administrative supplies.  "Stock" items are often
    purchased in "Lots" which include a number (or identifier) of the stock
    items.  Where possible BHIMA uses the lot number provided by the
    manufacturer (see this [Wikipedia article](https://en.wikipedia.org/wiki/Lot_number)
    for more information).

- **STOCK ADJUSTMENT** - When a physical inventory of stock reveals that the
    actual count of stock items differs from the count in the "Theoretical
    Quantity" (as tracked by the BHIMA system), then an "Stock Adjustment"
    should be performed to update the BHIMA system (and the "Theoretical
    Quantity".

- **STOCK ENTRY** - "Stock entries" occur when an item of stock is added to a
    Depot.  Types of stock entries include:

  - **Purchase** - stock items entering the Depot from a fulfilled purchase
       order

  - **Donation** - stock items entering the Depot from a donation

  - **Integration** - stock items entering the Depot that do not have a known
       origin but are necessary to be tracked in the system.  This often
       happens during start-up - stock is found on the shelf, but it isn't
       necessarily clear where it came from.  It's easiest to simply
       "integrate" the stock as-is, rather than try to reproduce the history
       exactly from previous documentation.

  - **Transfer** - stock items entering the Depot due to a transfer from some other Depot.

- **STOCK EXIT** - "Stock exits" occur when an item is removed from a Depot.
    This includes exits due to:

  - **Exit to an individual** - Stock items leaving the depot for use in the
       hospital or clinic

  - **Distribution to a service** - Stock items leaving the depot for use by a
       hospital service (such as sutures for the operating room).

  - **Distribution to a depot** - Stock items leaving the depot to be
       transferred to another depot.

  - **Loss** - Stock items that are declared lost or expired and removed from
       the inventory of stock items.  This may happen when a direct review of
       the stock items reveals that some items are missing or expired.

- **SUPPLIER** - A supplier is the source of the stock items coming into depots
    from purchases.  They are represented as a creditor in the accounting
    module.
