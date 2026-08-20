# Glossary

---
## A

##### Average Monthly Consumption (AMC)

The average monthly consumption is a measure of the consumption of a drug or
medication by patients or hospital services.  Importantly, the AMC does _not_
include the loss of drugs due to expiry, theft, or other losses.  The AMC may
be defined for the entire institution or by pharmacy in the institution. In
French this is  Consommation Mensuelle Moyenne (CMM).

---
## D

#### DEPOT
A “depot” is a location where significant numbers of stock items are stored
until they are needed.  The size and function of a Depot can vary from a large
storehouse for handling transfers of drugs to a pharmacy in a clinic for
dispensing drugs to patients.

---
## L

#### LOT
A "Lot" is a collection of identical stock items that are usually purchased
and tracked together.  For instance, a box of pills might be part of a lot of
that type of medication.  But "Lot" is also a more general term.  For
instance, a single piece of equipment may be purchased by itself but for stock
tracking purposes, it would be considered to be in a lot of 1 stock item.

---
## P

##### PHARMACY
A location used to store and provide medications (and other related stock
items) as needed by Patients, Services, or other Pharmacies.

* **Stock Pharmacy**
A Stock Pharmacy is typically a localStorage facility that receives stock
from depots and supplies stock to other pharmacies.  A stock pharmacy does not
generally dispense medications directly to patients.

* **Dispensing Pharmacy**
A Dispensing Pharmacy (Pharmacie D'Usage in French) is a pharmacy that
dispenses stock to patients, wards, and services.  Normally, stock is not
transferred from Dispensing Pharmacies to other Pharmacies.


---
## I

##### INTEGRATION
Integration is a method of increasing or decreasing the quantity in stock of a particular stock lot.  It's used to perform adjustments to the stock in a depot/pharmacy after an inventory is performed and quantities need to be adjusted to match the real quantity in stock.


---
## S

##### SERVICE

A service is a department in the hospital such as "pediatrics",
"ophthalmology", "internal medicine", "pharmacy", and "administration".
Services can be assigned invoices, consume medications, contain staff, and
have both profit and loss centers.  They are useful for understanding where in
the hospital financial activities are taking place.

#### STOCK
"Stock" are any items used in the operation of a hospital or clinic.  Examples
include drugs for treating patients, medical equipment and supplies, and
administrative supplies.  "Stock" items are often purchased in "Lots" which
include a number of the stock items.  Note that "Lot Numbers" are sometimes
given by manufacturers and are not necessarily unique to BHIMA.

#### STOCK ADJUSTMENT
When a physical inventory of stock reveals that the actual count of stock
items in a depot or pharmacy differs from the count in the BHIMA software,
then an "Stock Adjustment" should be performed to update the BHIMA software.

#### STOCK ENTRY
"Stock entries" occur when an item of stock is added to a Depot.  Types of
stock entries include:

* **Purchase** - stock items entering the Depot from a fulfilled purchase order

* **Donation** - stock items entering the Depot from a donation

* **Integration** - stock items entering the Depot that do not have a known
  origin but are necessary to be tracked in the system.  This often happens
  during start-up - stock is found on the shelf, but it isn't necessarily
  clear where it came from.  It's easiest to simply "integrate" the stock
  as-is, rather than try to reproduce the history exactly from previous
  documentation.

* **Transfer** - stock items entering the Depot due to a transfer from some
  other Depot.

#### STOCK EXIT
"Stock exits" occur when an item is removed from a Depot.  This includes exits due to:

* **Exit to an individual** - Stock items leaving the pharmacy or depot directly to a patient.  A stock exit to an individual can optionally be associated with an invoice billed to the patient.

* **Distribution to a service** - Stock items leaving the depot for use by a
  hospital service (such as sutures for the operating room).
